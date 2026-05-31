import { useQuery } from '@tanstack/react-query';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMyEnrollmentsAPI } from '../../api/enrollment.api.js';
import Button from '../../components/common/Button';

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

const statusConfig = {
  active: { label: 'Approved', className: 'bg-emerald-500/10 text-emerald-600' },
  pending_payment: {
    label: 'Pending approval',
    className: 'bg-amber-500/10 text-amber-600',
  },
  completed: { label: 'Completed', className: 'bg-sky-500/10 text-sky-600' },
  cancelled: { label: 'Rejected', className: 'bg-rose-500/10 text-rose-600' },
};

const getStatusMeta = (status) =>
  statusConfig[status] || {
    label: status || 'Unknown',
    className: 'bg-muted text-muted-foreground',
  };

const StudentEnrollmentsPage = () => {
  const navigate = useNavigate();

  const enrollmentsQuery = useQuery({
    queryKey: ['myEnrollments'],
    queryFn: getMyEnrollmentsAPI,
  });

  const rawEnrollments =
    enrollmentsQuery.data?.data?.data?.enrollments ||
    enrollmentsQuery.data?.data?.data ||
    [];
  const enrollments = Array.isArray(rawEnrollments) ? rawEnrollments : [];

  if (enrollmentsQuery.isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-10 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (enrollmentsQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <RefreshCw className="w-8 h-8 text-muted-foreground/60" />
        <div className="text-sm text-muted-foreground">
          Something went wrong. Please refresh the page.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Enrollments</h1>
          <p className="text-sm text-muted-foreground">
            Track approval status for each course.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {enrollments.length} requests
        </div>
      </div>

      {enrollments.length ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Course</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Requested</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {enrollments.map((enrollment) => {
                const courseTitle =
                  enrollment?.course?.title ||
                  enrollment?.course_title ||
                  enrollment?.courseTitle ||
                  'Course';
                const statusMeta = getStatusMeta(enrollment?.status);

                return (
                  <tr key={enrollment.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {courseTitle}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(enrollment.enrolled_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`/student/enrollments/${enrollment.id}`)
                          }
                        >
                          View status
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/courses/${enrollment.course_id}`)
                          }
                        >
                          Open course
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
          <ClipboardList className="w-10 h-10 text-muted-foreground/60 mb-3 mx-auto" />
          <div className="text-sm text-muted-foreground">
            No enrollments yet.
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentEnrollmentsPage;
