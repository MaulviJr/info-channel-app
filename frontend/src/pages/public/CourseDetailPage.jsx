import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { RefreshCw, PlayCircle, Clock, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { getCourseWithModulesAndLecturesAPI } from '../../api/course.api.js';
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
    queryFn: () => getCourseWithModulesAndLecturesAPI(id),
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
      <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-10 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-32 bg-muted rounded w-full" />
        </div>
        <div className="h-[400px] bg-muted rounded-xl" />
      </div>
    );
  }

  if (courseQuery.isError || !course) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <RefreshCw className="w-10 h-10 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold">Course Not Found</h2>
        <div className="text-sm text-muted-foreground">
          Something went wrong or the course doesn't exist. Please refresh the page.
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    );
  }

  // Handle varying key names between API responses gracefully
  const displayTitle = course.course_title || course.title;
  const displayDesc = course.course_description || course.description;

  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col gap-8 relative">
      {/* Layout Strategy: 
        Left side (lg:col-span-2) for Title, Description, and Modules 
        Right side (lg:col-span-1) for sticky pricing/enrollment card
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Header Section */}
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {displayTitle}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {displayDesc}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                Instructor: {course.instructor_name || 'Not specified'}
              </span>
            </div>
          </div>

          <hr className="border-border" />

          {/* Curriculum / Modules Section */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              Course Curriculum
            </h2>

            <div className="flex flex-col gap-4">
              {course.modules && course.modules.length > 0 ? (
                course.modules.map((module, idx) => (
                  <div 
                    key={module.module_id || idx} 
                    className="border border-border rounded-xl bg-card overflow-hidden shadow-sm"
                  >
                    {/* Module Header */}
                    <div className="bg-muted/40 px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-background p-2 rounded-md shadow-sm border border-border">
                           <Layers className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-semibold text-foreground text-base">
                          {module.module_title || module.title}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground bg-background px-3 py-1 rounded-full border border-border">
                        {module.lectures?.length || 0} lectures
                      </span>
                    </div>

                    {/* Lectures List */}
                    <div className="flex flex-col">
                      {module.lectures?.length > 0 ? (
                        module.lectures.map((lecture, lIdx) => (
                          <div 
                            key={lecture.lecture_id || lIdx} 
                            className="px-6 py-4 border-t border-border flex items-center justify-between hover:bg-muted/30 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <PlayCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              <span className="text-sm text-foreground/90 font-medium">
                                {lecture.lecture_title || lecture.title}
                              </span>
                            </div>
                            {lecture.lecture_duration ? (
                              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{lecture.lecture_duration} min</span>
                              </div>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="px-6 py-4 text-sm text-muted-foreground italic border-t border-border flex items-center gap-2">
                           No lectures available in this module yet.
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                  <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No curriculum modules have been added yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Sidebar Area */}
        <div className="lg:col-span-1 sticky top-6">
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
            
            {/* Thumbnail */}
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={displayTitle}
                className="w-full h-56 object-cover"
              />
            ) : (
              <div className="h-56 bg-muted/60 flex flex-col items-center justify-center text-muted-foreground">
                 <PlayCircle className="w-12 h-12 mb-2 opacity-50" />
                 <span className="text-sm font-medium">No preview available</span>
              </div>
            )}

            {/* Pricing & Actions */}
            <div className="p-6 flex flex-col gap-6">
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground text-sm font-medium">Admission Fee</span>
                  <span className="text-foreground font-bold text-lg">{formatFee(course.admission_fee)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground text-sm font-medium">Monthly Fee</span>
                  <span className="text-foreground font-semibold">{formatFee(course.monthly_fee)}</span>
                </div>
                {course.board_registration && (
                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <span className="text-muted-foreground text-sm font-medium">Board Reg.</span>
                    <span className="text-foreground font-semibold">{course.board_registration}</span>
                  </div>
                )}
              </div>

              {/* What you'll get preview */}
              <div className="space-y-2">
                <p className="text-sm font-bold text-foreground mb-3">This course includes:</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Full lifetime access
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Access on mobile and TV
                </div>
              </div>

              <Button
                size="lg"
                className="w-full font-bold text-md mt-2"
                onClick={handleEnroll}
                disabled={enrollMutation.isPending}
              >
                {enrollMutation.isPending ? 'Processing...' : 'Enroll Now'}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CourseDetailPage;