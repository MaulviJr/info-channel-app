import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMyCoursesAPI } from '../../api/course.api.js';
import Button from '../../components/common/Button';
import ErrorAlert from '../../components/common/ErrorAlert';

const formatFee = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  return `Rs ${value}`;
};

const getCoursesFromResponse = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.courses)) {
    return payload.courses;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const TeacherCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await listMyCoursesAPI({ page: 1, limit: 50 });
        const list = getCoursesFromResponse(response);

        if (isMounted) {
          setCourses(list);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err?.response?.data?.message ||
              'Failed to load your courses. Please try again.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">My Courses</h1>
          <p className="text-sm text-muted-foreground">
            Courses you created and manage.
          </p>
        </div>
        <Button onClick={() => navigate('/teacher/courses/new')}>
          Create New Course
        </Button>
      </div>

      <ErrorAlert message={error} />

      {isLoading ? (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4 animate-pulse">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      ) : courses.length ? (
        <div className="grid gap-4">
          {courses.map((course) => {
            const isPublished = course.is_published !== false;
            const statusLabel = isPublished ? 'Published' : 'Draft';
            const statusClass = isPublished
              ? 'bg-emerald-500/10 text-emerald-600'
              : 'bg-amber-500/10 text-amber-600';

            return (
              <div
                key={course.id}
                className="bg-card rounded-xl border border-border p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-medium text-foreground">
                      {course.title || 'Untitled course'}
                    </h2>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 max-w-3xl">
                    {course.description || 'No description provided.'}
                  </p>
                  <div className="text-sm text-muted-foreground">
                    <span className="mr-4">Admission: {formatFee(course.admission_fee)}</span>
                    <span>Monthly: {formatFee(course.monthly_fee)}</span>
                  </div>
                </div>
{/* I want buttons as a stack */}
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/teacher/courses/${course.id}`)}
                  >
                    View Students
                  </Button>
                   <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/teacher/courses/modules/${course.id}`)}
                  >
                    Open Modules
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center space-y-4">
          <div className="text-sm text-muted-foreground">
            You do not have any courses yet.
          </div>
          <Button onClick={() => navigate('/teacher/courses/new')}>
            Create Your First Course
          </Button>
        </div>
      )}
    </div>
  );
};

export default TeacherCourses;
