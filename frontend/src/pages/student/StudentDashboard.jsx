import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle, RefreshCw, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getProfileStatus } from '../../api/user.api.js';
import { getMyEnrollmentsAPI } from '../../api/enrollment.api.js'; // Updated import
import CourseProgressCard from '../../components/dashboard/CourseProgressCard';
import RecentActivity from '../../components/dashboard/RecentActivity';
import StatCard from '../../components/dashboard/StatCard';
import ProfileCompletionBanner from '../../components/profile/ProfileCompletionBanner';
import Button from '../../components/common/Button';

function StudentDashboard() {
  const navigate = useNavigate();
  
  const profileQuery = useQuery({
    queryKey: ['profileStatus'],
    queryFn: getProfileStatus,
  });

  const enrollmentsQuery = useQuery({
    queryKey: ['myEnrollments'],
    queryFn: getMyEnrollmentsAPI, // Use the new function here
  });

  // Safely extract data accounting for Axios and the backend ApiResponse structure
  const profilePayload = profileQuery.data?.data?.data || profileQuery.data?.data || {};
  console.log('Profile status response:', profileQuery.data);
  const isComplete = profilePayload.isComplete ?? true;
  const missingFields = profilePayload.missingFields || [];

  // Assuming backend returns { data: { enrollments: [...] } } or an array directly
  const rawEnrollments = enrollmentsQuery.data?.data?.data?.enrollments || enrollmentsQuery.data?.data?.data || [];
  console.log('Enrollments response:', enrollmentsQuery.data);
  const enrollments = Array.isArray(rawEnrollments) ? rawEnrollments : [];

  const enrolledCount = enrollments.filter(
    (enrollment) => enrollment.status === 'active' || enrollment.status === 'pending_payment'
  ).length;

  const completedCount = enrollments.filter(
    (enrollment) => enrollment.status === 'completed'
  ).length;

  const activeEnrollments = enrollments.filter((enrollment) => enrollment.status === 'active');
  
  const avgProgress = activeEnrollments.length
    ? Math.round(
        activeEnrollments.reduce(
          (sum, enrollment) => sum + (enrollment.progress?.percent || 0),
          0
        ) / activeEnrollments.length
      )
    : 0;

  if (profileQuery.isLoading || enrollmentsQuery.isLoading) {
    return (
      <div>
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="bg-muted rounded-xl border border-border h-24 animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          {[0, 1].map((item) => (
            <div key={item} className="bg-muted rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (profileQuery.isError || enrollmentsQuery.isError) {
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
      <ProfileCompletionBanner isComplete={isComplete} missingFields={missingFields} />
      
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={BookOpen}
          label="Enrolled courses"
          value={enrolledCount}
          accentBg="bg-primary/15"
          accentText="text-primary"
        />
        <StatCard
          icon={TrendingUp}
          label="Overall progress"
          value={`${avgProgress}%`}
          accentBg="bg-accent/20"
          accentText="text-accent-foreground"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={completedCount}
          accentBg="bg-secondary/70"
          accentText="text-secondary-foreground"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="text-base font-medium text-foreground mb-3">My Courses</div>
          {enrollments.length ? (
            <div className="grid grid-cols-2 gap-4">
              {enrollments.map((enrollment) => (
                <CourseProgressCard key={enrollment.id} enrollment={enrollment} />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-12 flex flex-col items-center justify-center text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground/60 mb-3" />
              <div className="text-sm text-muted-foreground mb-4">
                You are not enrolled in any courses yet.
              </div>
              <Button size="lg" onClick={() => navigate('/student/courses')}>
                Browse Courses
              </Button>
            </div>
          )}
        </div>
        <div className="col-span-1">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;