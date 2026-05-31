import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { getEnrollmentByIdAPI } from '../../api/enrollment.api.js';
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

const statusConfig = {
  pending_payment: {
    label: 'Pending approval',
    description: 'Your request is waiting for admin approval.',
    tone: 'bg-amber-500/10 text-amber-600',
    icon: Clock3,
  },
  pending: {
    label: 'Pending approval',
    description: 'Your request is waiting for admin approval.',
    tone: 'bg-amber-500/10 text-amber-600',
    icon: Clock3,
  },
  active: {
    label: 'Approved',
    description: 'You are approved. You can start learning now.',
    tone: 'bg-emerald-500/10 text-emerald-600',
    icon: CheckCircle2,
  },
  completed: {
    label: 'Completed',
    description: 'This course is marked as completed.',
    tone: 'bg-sky-500/10 text-sky-600',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Rejected',
    description: 'This enrollment was rejected by the admin.',
    tone: 'bg-rose-500/10 text-rose-600',
    icon: XCircle,
  },
};

const EnrollmentConfirmationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const enrollmentQuery = useQuery({
    queryKey: ['enrollment', id],
    queryFn: () => getEnrollmentByIdAPI(id),
    enabled: Boolean(id),
    refetchInterval: (data) => {
      const status = data?.data?.data?.enrollment?.status;
      if (status === 'pending_payment' || status === 'pending') {
        return 15000;
      }
      return false;
    },
  });

  const enrollment = useMemo(
    () => enrollmentQuery.data?.data?.data?.enrollment || null,
    [enrollmentQuery.data]
  );

  const statusKey = enrollment?.status || 'pending_payment';
  const statusMeta = statusConfig[statusKey] || statusConfig.pending_payment;
  const StatusIcon = statusMeta.icon;
  const course = enrollment?.course || {};
  const errorMessage = enrollmentQuery.isError
    ? enrollmentQuery.error?.response?.data?.message ||
        enrollmentQuery.error?.message ||
        'Failed to load enrollment. Please try again.'
    : '';

  if (enrollmentQuery.isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="bg-muted rounded-xl border border-border h-24 animate-pulse" />
        <div className="bg-muted rounded-xl border border-border h-56 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Enrollment status
        </h1>
        <p className="text-sm text-muted-foreground">
          Keep track of your approval and next steps.
        </p>
      </div>

      <ErrorAlert message={errorMessage} />

      {enrollment ? (
        <>
          <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className={`rounded-full p-3 ${statusMeta.tone}`}>
                <StatusIcon className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Current status
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {statusMeta.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {statusMeta.description}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => enrollmentQuery.refetch()}
                disabled={enrollmentQuery.isFetching}
              >
                {enrollmentQuery.isFetching ? 'Refreshing...' : 'Refresh status'}
              </Button>
              {(statusKey === 'active' || statusKey === 'completed') ? (
                <Button size="sm" onClick={() => navigate('/student/courses')}>
                  Go to my courses
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate('/student/courses/browse')}
                >
                  Browse courses
                </Button>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 space-y-3">
            <div className="text-sm text-muted-foreground">Course details</div>
            <div className="text-lg font-semibold text-foreground">
              {course.title || 'Untitled course'}
            </div>
            <div className="text-sm text-muted-foreground">
              {course.description || 'No description provided.'}
            </div>
            <div className="text-sm text-muted-foreground">
              Instructor: {course.instructor?.name || 'Instructor'}
            </div>
            <div className="text-xs text-muted-foreground">
              Requested: {formatDateTime(enrollment.enrolled_at)}
            </div>
            <div className="text-xs text-muted-foreground">
              Enrollment ID: {enrollment.id}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="text-sm text-muted-foreground">
            Enrollment details are not available.
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentConfirmationPage;
