import { useEffect, useState } from 'react';
import {
  listEnrollmentsAPI,
  updateEnrollmentStatusAPI,
} from '../../api/enrollment.api.js';
import Button from '../../components/common/Button';
import ErrorAlert from '../../components/common/ErrorAlert';

const formatDateTime = (value) => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const getEnrollmentsFromResponse = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.enrollments)) {
    return payload.enrollments;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const getStatusLabel = (status) => {
  if (!status) {
    return 'Unknown';
  }

  const normalized = String(status).toLowerCase();
  if (normalized === 'active') {
    return 'Approved';
  }
  if (normalized === 'cancelled') {
    return 'Rejected';
  }
  if (normalized === 'pending_payment') {
    return 'Pending Payment';
  }
  if (normalized === 'completed') {
    return 'Completed';
  }

  return normalized.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
};

const getPaymentStatus = (enrollment) => {
  if (enrollment?.payment_status) {
    return enrollment.payment_status;
  }

  if (enrollment?.paymentStatus) {
    return enrollment.paymentStatus;
  }

  if (enrollment?.status === 'pending_payment') {
    return 'Pending';
  }

  if (enrollment?.status === 'active' || enrollment?.status === 'completed') {
    return 'Paid';
  }

  return 'Unknown';
};

const AdminEnrollmentsPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadEnrollments = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await listEnrollmentsAPI();
        const list = getEnrollmentsFromResponse(response);
        if (isMounted) {
          setEnrollments(list);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err?.response?.data?.message ||
              'Failed to load enrollments. Please try again.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadEnrollments();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateStatus = async (enrollmentId, nextStatus) => {
    setUpdatingId(enrollmentId);
    setError('');

    try {
      await updateEnrollmentStatusAPI(enrollmentId, { status: nextStatus });
      setEnrollments((prev) =>
        prev.map((enrollment) =>
          enrollment.id === enrollmentId
            ? { ...enrollment, status: nextStatus }
            : enrollment
        )
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Failed to update enrollment status. Please try again.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Enrollments</h1>
        <p className="text-sm text-muted-foreground">
          Review enrollment requests and approvals.
        </p>
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
      ) : enrollments.length ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Student</th>
                <th className="text-left px-4 py-3 font-medium">Course</th>
                <th className="text-left px-4 py-3 font-medium">Enrollment Date</th>
                <th className="text-left px-4 py-3 font-medium">Payment Status</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {enrollments.map((enrollment) => {
                const studentName =
                  enrollment?.student?.name ||
                  enrollment?.student_name ||
                  enrollment?.studentName ||
                  'Student';
                const courseTitle =
                  enrollment?.course?.title ||
                  enrollment?.course_title ||
                  enrollment?.courseTitle ||
                  'Course';
                const statusLabel = getStatusLabel(enrollment?.status);
                const paymentStatus = getPaymentStatus(enrollment);
                const isPending =
                  enrollment?.status === 'pending' ||
                  enrollment?.status === 'pending_payment';

                return (
                  <tr key={enrollment.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {studentName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {courseTitle}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(enrollment.enrolled_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground">
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!isPending || updatingId === enrollment.id}
                          onClick={() =>
                            handleUpdateStatus(enrollment.id, 'active')
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!isPending || updatingId === enrollment.id}
                          onClick={() =>
                            handleUpdateStatus(enrollment.id, 'cancelled')
                          }
                        >
                          Reject
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
            No enrollments found.
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEnrollmentsPage;
