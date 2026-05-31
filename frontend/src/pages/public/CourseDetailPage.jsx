import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { getCourseByIdAPI } from '../../api/course.api.js';
import { createEnrollmentAPI } from '../../api/enrollment.api.js';
import { getMeAPI } from '../../api/auth.api.js';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';

const formatFee = (value) => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  return `Rs ${value}`;
};

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const courseQuery = useQuery({
    queryKey: ['course', id],
    queryFn: () => getCourseByIdAPI(id),
    enabled: Boolean(id),
  });

  const enrollMutation = useMutation({
    mutationFn: (payload) => createEnrollmentAPI(payload),
  });

  const course = useMemo(
    () => courseQuery.data?.data?.data?.course || null,
    [courseQuery.data]
  );

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      alert('Please login first to enroll.');
      navigate('/login');
      return;
    }

    if (user?.role && user.role !== 'student') {
      alert('Only students can enroll in courses.');
      return;
    }

    try {
      const meResponse = await getMeAPI();
      const completion = meResponse.data?.data?.completion;

      if (!completion?.isComplete) {
        alert('Please complete your profile before enrolling.');
        navigate('/student/profile');
        return;
      }

      const response = await enrollMutation.mutateAsync({ courseId: id });
      const enrollmentId = response?.data?.data?.enrollment?.id;

      if (enrollmentId) {
        navigate(`/student/enrollments/${enrollmentId}`);
        return;
      }

      alert('Enrollment requested. Status is pending payment.');
      navigate('/student/courses');
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          'Enrollment failed. Please try again.'
      );
    }
  };

  if (courseQuery.isLoading) {
    return (
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="bg-muted h-72 rounded-xl" />
        <div className="lg:col-span-2 bg-muted h-72 rounded-xl" />
      </div>
    );
  }

  if (courseQuery.isError || !course) {
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
    <div className="p-6 flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-64 object-cover"
            />
          ) : (
            <div className="h-64 bg-muted flex items-center justify-center text-muted-foreground">
              No thumbnail
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{course.title}</h1>
            <p className="text-sm text-muted-foreground">
              Instructor: {course.instructor_name || 'Instructor'}
            </p>
          </div>

          {course.description ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {course.description}
            </p>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div>Admission Fee: {formatFee(course.admission_fee)}</div>
            <div>Monthly Fee: {formatFee(course.monthly_fee)}</div>
            {course.board_registration ? (
              <div>Board: {course.board_registration}</div>
            ) : null}
          </div>

          <div className="pt-2">
            <Button
              size="lg"
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
            >
              {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;