import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createCourseAPI,
  getCourseByIdAPI,
  updateCourseAPI,
} from '../../api/course.api.js';
import Button from '../../components/common/Button';
import CourseForm from '../../components/courses/CourseForm';
import { courseToFormValues } from '../../components/courses/courseFormUtils';

const AdminCourseFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [courseValues, setCourseValues] = useState(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadCourse = async () => {
      if (!isEditMode) {
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await getCourseByIdAPI(id);
        const course = response?.data?.data?.course || response?.data?.data || {};

        if (!isMounted) {
          return;
        }

        setCourseValues(courseToFormValues(course));
      } catch (err) {
        if (isMounted) {
          setError(
            err?.response?.data?.message ||
              'Failed to load course details. Please try again.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCourse();

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    setError('');

    try {
      if (isEditMode) {
        await updateCourseAPI(id, payload);
      } else {
        await createCourseAPI(payload);
      }

      navigate('/admin/courses');
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Failed to save course. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {isEditMode ? 'Edit Course' : 'Create New Course'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditMode
              ? 'Update course details and publish settings.'
              : 'Set up a new course for students.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/courses')}>
          Back to Courses
        </Button>
      </div>

      <CourseForm
        key={isEditMode ? `${id}-${courseValues ? 'ready' : 'loading'}` : 'create'}
        initialValues={courseValues || undefined}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        error={error}
        submitLabel="Save Course"
        cancelLabel="Cancel"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/admin/courses')}
      />
    </div>
  );
};

export default AdminCourseFormPage;
