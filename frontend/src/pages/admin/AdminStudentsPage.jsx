import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listStudentsWithProfileStatusAPI,
  updateUserStatusAPI,
} from '../../api/user.api.js';
import Button from '../../components/common/Button';
import ErrorAlert from '../../components/common/ErrorAlert';

const formatStatusLabel = (value) => {
  if (!value) {
    return 'Unknown';
  }

  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

const resolveAccountStatus = (student) => {
  if (student?.accountStatus) {
    return student.accountStatus;
  }

  if (student?.status) {
    return student.status;
  }

  if (typeof student?.isActive === 'boolean') {
    return student.isActive ? 'active' : 'suspended';
  }

  return 'active';
};

const getStudentsFromResponse = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.students)) {
    return payload.students;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const AdminStudentsPage = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadStudents = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await listStudentsWithProfileStatusAPI();
        const list = getStudentsFromResponse(response);

        if (isMounted) {
          setStudents(list);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err?.response?.data?.message ||
              'Failed to load students. Please try again.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStudents();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStatusChange = async (studentId, nextStatus) => {
    setUpdatingId(studentId);
    setError('');

    try {
      await updateUserStatusAPI(studentId, { status: nextStatus });
      setStudents((prev) =>
        prev.map((student) =>
          student.id === studentId
            ? { ...student, accountStatus: nextStatus, status: nextStatus }
            : student
        )
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Failed to update user status. Please try again.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground">
            Monitor student profiles and account status.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {students.length} students
        </div>
      </div>

      <ErrorAlert message={error} />

      {isLoading ? (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-10 bg-muted rounded animate-pulse"
            />
          ))}
        </div>
      ) : students.length ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Profile Status</th>
                <th className="text-left px-4 py-3 font-medium">Account Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((student) => {
                const profileStatus = student?.profileStatus || {};
                const isComplete = profileStatus?.isComplete;
                const missingCount = profileStatus?.missingFields?.length || 0;
                const accountStatus = resolveAccountStatus(student);
                const statusLabel = formatStatusLabel(accountStatus);
                const statusClass =
                  accountStatus === 'suspended'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-emerald-500/10 text-emerald-600';

                return (
                  <tr key={student.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {student.name || 'Unnamed student'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {student.email || 'Not provided'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isComplete
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-amber-500/10 text-amber-600'
                          }`}
                        >
                          {isComplete ? 'Complete' : 'Incomplete'}
                        </span>
                        {!isComplete && missingCount ? (
                          <span className="text-xs text-muted-foreground">
                            {missingCount} missing
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
                          value={accountStatus}
                          onChange={(event) =>
                            handleStatusChange(student.id, event.target.value)
                          }
                          disabled={updatingId === student.id}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                        </select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/students/${student.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="text-sm text-muted-foreground">
            No students found.
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentsPage;
