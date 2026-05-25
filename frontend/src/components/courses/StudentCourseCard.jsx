import { useNavigate } from 'react-router-dom';

const statusConfig = {
  active: {
    label: 'Active',
    badgeClass: 'bg-primary/15 text-primary',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-secondary text-secondary-foreground',
  },
  pending_details: {
    label: 'Pending setup',
    badgeClass: 'bg-accent/20 text-accent-foreground',
  },
  pending_payment: {
    label: 'Pending payment',
    badgeClass: 'bg-muted text-muted-foreground',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-destructive/15 text-destructive',
  },
};

const getCourseInitials = (title) =>
  title
    ?.split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'IC';

function StudentCourseCard({ enrollment }) {
  const navigate = useNavigate();
  const course = enrollment?.course || {};
  const progress = enrollment?.progress || {};
  const status = enrollment?.status;
  const statusMeta = statusConfig[status];
  const courseTitle = course.title || 'Untitled course';
  const courseId = course.id || enrollment?.course_id;
  const progressPercent = Math.round(progress.percent || 0);
  const completionLabel =
    status === 'completed' ? 'Completed' : `${progressPercent}% complete`;

  return (
    <button
      type="button"
      disabled={!courseId}
      onClick={() => {
        if (courseId) {
          navigate(`/courses/${courseId}`);
        }
      }}
      className="bg-card rounded-xl border border-border overflow-hidden text-left transition hover:border-primary/40 hover:shadow-sm disabled:opacity-60"
    >
      <div className="relative h-40">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={courseTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-sidebar flex items-center justify-center">
            <div className="text-accent text-2xl font-bold">
              {getCourseInitials(courseTitle)}
            </div>
          </div>
        )}
        {statusMeta ? (
          <div
            className={`absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full ${statusMeta.badgeClass}`}
          >
            {statusMeta.label}
          </div>
        ) : null}
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="text-base font-semibold text-foreground line-clamp-2">
          {courseTitle}
        </div>
        <div className="text-sm text-muted-foreground">
          {course.instructor?.name || 'Instructor'}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Completion</span>
          <span className="text-primary font-medium">{completionLabel}</span>
        </div>
        <div className="bg-muted rounded-full h-1.5 w-full">
          <div
            className="bg-primary h-1.5 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {progress.completedLectures || 0} / {progress.totalLectures || 0} lectures
        </div>
      </div>
    </button>
  );
}

export default StudentCourseCard;
