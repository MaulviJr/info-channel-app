import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Lock, PlayCircle, Menu, X } from 'lucide-react';
import { getLearningCourseAPI, updateLectureProgressAPI } from '../../api/learning.api.js';
import Button from '../../components/common/Button';
import ReactPlayer from 'react-player';

const StudentLearn = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [activeLectureId, setActiveLectureId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // State and Refs for 80% watch tracking
  const [videoDuration, setVideoDuration] = useState(0);
  const watchedSecondsRef = useRef(new Set());
  const playerRef = useRef(null); // Added ref for ReactPlayer v3 HTMLMediaElement access

  // 1. Fetch Course Data
  const { data, isLoading, isError } = useQuery({
    queryKey: ['learningCourse', courseId],
    queryFn: () => getLearningCourseAPI(courseId),
    enabled: Boolean(courseId),
  });

  const course = data?.data?.data?.course;
 
  // 2. Mutation for updating progress
  const progressMutation = useMutation({
    mutationFn: updateLectureProgressAPI,
    onSuccess: () => {
      // Invalidate query to refetch fresh progress state
      queryClient.invalidateQueries(['learningCourse', courseId]);
    },
  });

  // 3. Process Modules & Apply Strict Sequential Locking Logic
  const { processedModules, activeLectureData } = useMemo(() => {
    if (!course?.modules) return { processedModules: [], activeLectureData: null };

    let previousCompleted = true; // The very first lecture is always unlocked
    let foundActive = null;

    const enrichedModules = course.modules.map(module => {
      const enrichedLectures = module.lectures.map(lecture => {
        
        // Logic: If the previous lecture was not completed, this one is locked.
        const isLocked = !previousCompleted; 
        
        // Update the flag for the *next* iteration
        previousCompleted = lecture.is_completed;

        const enrichedLecture = { ...lecture, isLocked };

        // Auto-select the first available/unlocked lecture if none selected
        if (!activeLectureId && !isLocked && !lecture.is_completed && !foundActive) {
          foundActive = enrichedLecture;
        }

        // Keep reference to the manually selected active lecture
        if (activeLectureId === lecture.lecture_id) {
          foundActive = enrichedLecture;
        }

        return enrichedLecture;
      });

      return { ...module, lectures: enrichedLectures };
    });

    return { processedModules: enrichedModules, activeLectureData: foundActive };
  }, [course, activeLectureId]);

  // Set initial active lecture on first load
  useEffect(() => {
    if (activeLectureData && !activeLectureId) {
      setActiveLectureId(activeLectureData.lecture_id);
    }
  }, [activeLectureData, activeLectureId]);

  // Reset watch tracking whenever the active lecture changes
  useEffect(() => {
    watchedSecondsRef.current.clear();
    setVideoDuration(0);
  }, [activeLectureId]);

  const handleToggleComplete = async () => {
    // Prevent manual trigger if it's locked or already updating
    if (!activeLectureData || activeLectureData.isLocked || progressMutation.isPending) return;

    await progressMutation.mutateAsync({
      courseId,
      lectureId: activeLectureData.lecture_id,
      isCompleted: !activeLectureData.is_completed
    });
  };

  // Video Progress Handler (Updated for v3 onTimeUpdate)
  const handleVideoProgress = (e) => {
    // If lecture is already completed, no need to track
    if (!activeLectureData || activeLectureData.is_completed || progressMutation.isPending) return;

    // ReactPlayer v3 mimics HTMLMediaElement, so we extract currentTime from the event or fallback to the player ref
    const currentTime = e?.target?.currentTime ?? playerRef.current?.currentTime ?? 0;
    
    // Add current second to our unique set
    const currentSecond = Math.floor(currentTime);
    watchedSecondsRef.current.add(currentSecond);

    // Calculate completion
    if (videoDuration > 0) {
      const requiredSeconds = Math.floor(videoDuration * 0.8); // 80% threshold
      
      if (watchedSecondsRef.current.size >= requiredSeconds) {
        // Mark as complete and clear the set so we don't spam the API
        watchedSecondsRef.current.clear();
        handleToggleComplete();
      }
    }
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center animate-pulse">Loading course environment...</div>;
  }

  if (isError || !course) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Could not load course</h2>
        <Button onClick={() => navigate('/student/courses')}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      
      {/* LEFT: Video Player Area */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Top Navbar */}
        <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
          <h1 className="font-semibold text-lg truncate">{course.course_title}</h1>
          <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Video Container */}
        <div className="bg-black w-full aspect-video flex items-center justify-center relative">
          {activeLectureData ? (
            activeLectureData.isLocked ? (
              <div className="text-white flex flex-col items-center gap-3">
                <Lock className="w-12 h-12 text-muted-foreground" />
                <p>This lecture is locked. Complete previous lectures first.</p>
              </div>
            ) : (
              activeLectureData.video_url ? (
                <ReactPlayer
                  ref={playerRef}
                  src={activeLectureData.video_url}
                  controls={true}
                  width="100%"
                  height="100%"
                  onDurationChange={(durationOrEvent) => {
                    // v3 docs define this as seconds, but handle event format just in case
                    const duration = typeof durationOrEvent === 'number' 
                      ? durationOrEvent 
                      : (durationOrEvent?.target?.duration || 0);
                    setVideoDuration(duration);
                  }}
                  onTimeUpdate={handleVideoProgress}
                  config={{
                    youtube: { playerVars: { showinfo: 1 } }
                  }}
                />
              ) : (
                <div className="text-white">No video provided for this lecture.</div>
              )
            )
          ) : (
            <div className="text-white">Select a lecture to begin</div>
          )}
        </div>

        {/* Lecture Details */}
        {activeLectureData && (
          <div className="p-8 max-w-4xl w-full mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">{activeLectureData.lecture_title}</h2>
                <p className="text-muted-foreground text-sm">
                  Duration: {activeLectureData.lecture_duration || 0} seconds
                </p>
              </div>
              
              <Button 
                onClick={handleToggleComplete}
                disabled={activeLectureData.isLocked || progressMutation.isPending}
                variant={activeLectureData.is_completed ? "outline" : "primary"}
                className={activeLectureData.is_completed ? "text-green-600 border-green-600 hover:bg-green-50" : ""}
              >
                {progressMutation.isPending ? 'Updating...' : 
                 activeLectureData.is_completed ? 'Completed' : 'Mark as Complete'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Curriculum Sidebar */}
      {isSidebarOpen && (
        <div className="w-80 bg-card border-l border-border flex flex-col h-full shrink-0 transition-all">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-bold text-foreground">Course Content</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {processedModules.map((module) => (
              <div key={module.module_id} className="border-b border-border">
                <div className="p-4 bg-muted/10 font-semibold text-sm text-foreground">
                  {module.module_title}
                </div>
                <div className="flex flex-col">
                  {module.lectures.map((lecture) => {
                    const isActive = activeLectureId === lecture.lecture_id;
                    return (
                      <button
                        key={lecture.lecture_id}
                        onClick={() => !lecture.isLocked && setActiveLectureId(lecture.lecture_id)}
                        disabled={lecture.isLocked}
                        className={`
                          w-full flex items-start gap-3 p-4 text-left transition-colors border-l-4
                          ${isActive ? 'bg-primary/5 border-primary' : 'border-transparent hover:bg-muted/50'}
                          ${lecture.isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <div className="mt-0.5 shrink-0">
                          {lecture.is_completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : lecture.isLocked ? (
                            <Lock className="w-5 h-5 text-muted-foreground" />
                          ) : isActive ? (
                            <PlayCircle className="w-5 h-5 text-primary" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm ${isActive ? 'font-semibold text-primary' : 'text-foreground'}`}>
                            {lecture.lecture_title}
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            {lecture.lecture_duration ? `${Math.floor(lecture.lecture_duration / 60)} min` : 'Reading'}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLearn;