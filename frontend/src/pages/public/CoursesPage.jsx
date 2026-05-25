import { useQuery } from '@tanstack/react-query';
import { BookOpen, RefreshCw } from 'lucide-react';
import { listCoursesAPI } from '../../api/course.api.js';
import PublicCourseCard from '../../components/courses/PublicCourseCard';

const CoursesPage = () => {
  const coursesQuery = useQuery({
    queryKey: ['publicCourses'],
    queryFn: () => listCoursesAPI({ page: 1, limit: 12 }),
  });

  const courses = coursesQuery.data?.data?.data?.courses || [];

  if (coursesQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="bg-muted rounded-xl border border-border h-72 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (coursesQuery.isError) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Available Courses</h1>
        
          <p className="text-sm text-muted-foreground">
            Browse published courses and view details.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {courses.length} courses
        </div>
      </div>

      {courses.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => (
            <PublicCourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 flex flex-col items-center justify-center text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/60 mb-3" />
          <div className="text-sm text-muted-foreground">
            No courses are available right now.
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
