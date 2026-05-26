
import { useQuery } from '@tanstack/react-query';
import { BookOpen, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMyEnrollmentsAPI } from '../../api/enrollment.api.js';
import Button from '../../components/common/Button';
import StudentCourseCard from '../../components/courses/StudentCourseCard';

const StudentCourse = () => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="bg-muted rounded-xl border border-border h-72 animate-pulse"
          />
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
          <h1 className="text-lg font-semibold text-foreground">My Courses</h1>
          <p className="text-sm text-muted-foreground">
            Track your enrolled courses and completion status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {enrollments.length} courses
          </div>
          <Button size="sm" onClick={() => navigate('/student/courses/browse')}>
            Browse Courses
          </Button>
        </div>
      </div>

      {enrollments.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {enrollments.map((enrollment) => (
            <StudentCourseCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 flex flex-col items-center justify-center text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/60 mb-3" />
          <div className="text-sm text-muted-foreground mb-4">
            You are not enrolled in any courses yet.
          </div>
          <Button size="lg" onClick={() => navigate('/student/courses/browse')}>
            Browse Courses
          </Button>
        </div>
      )}
    </div>
  );
};

export default StudentCourse;