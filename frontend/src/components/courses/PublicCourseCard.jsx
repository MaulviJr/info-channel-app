import { useNavigate } from 'react-router-dom';

const getCourseInitials = (title) =>
  title
    ?.split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'IC';

const formatFee = (value) => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  return `Rs ${value}`;
};

function PublicCourseCard({ course }) {
  const navigate = useNavigate();
  const courseTitle = course?.title || 'Untitled course';
  const courseId = course?.id;
  const instructorName = course?.instructor_name || course?.instructor?.name || 'Instructor';

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
      <div className="relative h-44">
        {course?.thumbnail_url ? (
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
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="text-base font-semibold text-foreground line-clamp-2">
          {courseTitle}
        </div>
        <div className="text-sm text-muted-foreground">{instructorName}</div>
        {course?.description ? (
          <div className="text-xs text-muted-foreground line-clamp-3">
            {course.description}
          </div>
        ) : null}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Admission: {formatFee(course?.admission_fee)}</span>
          <span>Monthly: {formatFee(course?.monthly_fee)}</span>
        </div>
      </div>
    </button>
  );
}

export default PublicCourseCard;
