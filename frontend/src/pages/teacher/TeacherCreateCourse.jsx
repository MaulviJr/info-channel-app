import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCourseAPI } from '../../api/course.api.js';
import Button from '../../components/common/Button';
import CourseForm from '../../components/courses/CourseForm';

const TeacherCreateCourse = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    setError('');

    try {
      await createCourseAPI(payload);
      navigate('/teacher/courses');
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Failed to save course. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Create Course</h1>
          <p className="text-sm text-muted-foreground">
            Publish a new course for your students.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/teacher/courses')}>
          Back to Courses
        </Button>
      </div>

      <CourseForm
        error={error}
        isSubmitting={isSubmitting}
        submitLabel="Create Course"
        cancelLabel="Cancel"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/teacher/courses')}
      />
    </div>
  );
};

export default TeacherCreateCourse;
