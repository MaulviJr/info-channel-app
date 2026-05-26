import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  deleteCourseAPI,
  listCoursesAPI,
  toggleCoursePublishAPI,
} from '../../api/course.api.js';
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

const AdminCoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await listCoursesAPI({ page: 1, limit: 50 });
        const list = getCoursesFromResponse(response);
        if (isMounted) {
          setCourses(list);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err?.response?.data?.message ||
              'Failed to load courses. Please try again.'
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

  const handleTogglePublish = async (courseId) => {
    setUpdatingId(courseId);
    setError('');

    try {
      const response = await toggleCoursePublishAPI(courseId);
      const isPublished = response?.data?.data?.is_published;

      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? {
                ...course,
                is_published:
                  typeof isPublished === 'boolean'
                    ? isPublished
                    : !course.is_published,
              }
            : course
        )
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Failed to update publish status. Please try again.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (courseId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this course?'
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(courseId);
    setError('');

    try {
      await deleteCourseAPI(courseId);
      setCourses((prev) => prev.filter((course) => course.id !== courseId));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Failed to delete course. Please try again.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Courses</h1>
          <p className="text-sm text-muted-foreground">
            Manage course listings and publication status.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/courses/new')}>
          Create New Course
        </Button>
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
      ) : courses.length ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Instructor</th>
                <th className="text-left px-4 py-3 font-medium">Fees</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {courses.map((course) => {
                const isPublished = course.is_published !== false;
                const statusLabel = isPublished ? 'Published' : 'Draft';
                const statusClass = isPublished
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-amber-500/10 text-amber-600';

                return (
                  <tr key={course.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {course.title || 'Untitled course'}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {course.description || 'No description provided'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {course.instructor_name || course.instructor?.name || 'Instructor'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{formatFee(course.admission_fee)} admission</div>
                      <div>{formatFee(course.monthly_fee)} monthly</div>
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(course.id)}
                          disabled={updatingId === course.id}
                        >
                          {updatingId === course.id
                            ? 'Updating...'
                            : 'Toggle Publish'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(course.id)}
                          disabled={deletingId === course.id}
                        >
                          {deletingId === course.id ? 'Deleting...' : 'Delete'}
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
            No courses found.
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoursesPage;
