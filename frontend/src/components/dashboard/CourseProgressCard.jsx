import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';

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

function CourseProgressCard({ enrollment }) {
  const navigate = useNavigate();
  const course = enrollment?.course || {};
  const progress = enrollment?.progress || {};
  const status = enrollment?.status;
  const statusMeta = statusConfig[status];
  const courseTitle = course.title || 'Untitled course';
  const progressPercent = Math.round(progress.percent || 0);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="relative h-36">
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
            className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${statusMeta.badgeClass}`}
          >
            {statusMeta.label}
          </div>
        ) : null}
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="text-sm font-semibold text-foreground line-clamp-2">
          {courseTitle}
        </div>
        <div className="text-xs text-muted-foreground">
          by {course.instructor?.name || 'Instructor'}
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="text-muted-foreground">Progress</div>
          <div className="text-primary font-medium">{progressPercent}%</div>
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
        {(status === 'active' || status === 'completed') && (
          <div className="mt-auto pt-2">
            <Button
              fullWidth
              onClick={() => navigate(`/courses/${enrollment.course_id}/learn`)}
            >
              Continue Learning
            </Button>
          </div>
        )}
        {status === 'pending_details' && (
          <div className="mt-auto pt-2 text-xs text-center text-muted-foreground py-2">
            Awaiting admin setup
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseProgressCard;
