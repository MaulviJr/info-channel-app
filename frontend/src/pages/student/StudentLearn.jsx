import { useState, useMemo, useEffect } from 'react';
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
      console.log("ReactPlayer:", ReactPlayer);
    }
  }, [activeLectureData, activeLectureId]);


  const handleToggleComplete = async () => {
    if (!activeLectureData || activeLectureData.isLocked) return;
    // console.log(`Toggling completion for lecture ${activeLectureData.lecture_id}`);

    await progressMutation.mutateAsync({
      courseId,
      lectureId: activeLectureData.lecture_id,
      isCompleted: !activeLectureData.is_completed
    });
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
        slot="media"
        src={activeLectureData.video_url}
        controls={true}
        style={{
          width: "100%",
          height: "100%",
          "--controls": "all",
        }}
      ></ReactPlayer>
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


// import { useState, useMemo, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { CheckCircle2, Circle, Lock, PlayCircle, Menu, X } from 'lucide-react';
// import ReactPlayer from 'react-player';
// import { getLearningCourseAPI, updateLectureProgressAPI } from '../../api/learning.api.js';
// import Button from '../../components/common/Button';

// const StudentLearn = () => {
//   // 1. Component Render
//   console.log("===== COMPONENT RENDERED =====");

//   // 2. Route Params
//   const { id: courseId } = useParams();
//   console.log("Course ID:", courseId);

//   const navigate = useNavigate();
//   const queryClient = useQueryClient();
  
//   // 3. Local State
//   const [activeLectureId, setActiveLectureId] = useState(null);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);

//   console.log("Current Active Lecture ID:", activeLectureId);
//   console.log("Sidebar Open:", isSidebarOpen);

//   // 4. Query Execution
//   const { data, isLoading, isError } = useQuery({
//     queryKey: ['learningCourse', courseId],
//     queryFn: () => {
//       console.log("Fetching course from API...");
//       return getLearningCourseAPI(courseId);
//     },
//     enabled: Boolean(courseId),
//   });

//   const course = data?.data?.data?.course;

//   // 5. Query Result
//   console.log("Query Loading:", isLoading);
//   console.log("Query Error:", isError);
//   console.log("Fetched Course:", course);

//   // 15. Mutation Setup
//   const progressMutation = useMutation({
//     mutationFn: updateLectureProgressAPI,
//     onSuccess: () => {
//       console.log("Mutation Successful");
//       console.log("Invalidating Query...");
//       // Invalidate query to refetch fresh progress state
//       queryClient.invalidateQueries({ queryKey: ['learningCourse', courseId] });
//     },
//   });

//   // 6. useMemo Entry & 7. Module Processing & 8. Lock Logic
//   const { processedModules, activeLectureData } = useMemo(() => {
//     console.log("===== useMemo RUNNING =====");

//     if (!course?.modules) {
//       console.log("No modules found");
//       return { processedModules: [], activeLectureData: null };
//     }

//     let previousCompleted = true; // The very first lecture is always unlocked
//     let foundActive = null;

//     const enrichedModules = course.modules.map(module => {
//       console.log("Processing Module:", module.module_title);

//       const enrichedLectures = module.lectures.map(lecture => {
        
//         // Logic: If the previous lecture was not completed, this one is locked.
//         const isLocked = !previousCompleted; 
        
//         console.log(`Lecture: ${lecture.lecture_title}`, {
//           completed: lecture.is_completed,
//           previousCompleted,
//           willBeLocked: isLocked
//         });

//         // Update the flag for the *next* iteration
//         previousCompleted = lecture.is_completed;

//         const enrichedLecture = { ...lecture, isLocked };

//         // 9. Auto Selection Logic
//         if (!activeLectureId && !isLocked && !lecture.is_completed && !foundActive) {
//           console.log("Auto-selecting lecture:", lecture.lecture_title);
//           foundActive = enrichedLecture;
//         }

//         // 10. Manual Selection Detection
//         if (activeLectureId === lecture.lecture_id) {
//           console.log("Found active lecture:", lecture.lecture_title);
//           foundActive = enrichedLecture;
//         }

//         return enrichedLecture;
//       });

//       return { ...module, lectures: enrichedLectures };
//     });

//     // 11. useMemo Return
//     console.log("Processed Modules:", enrichedModules);
//     console.log("Active Lecture Data:", foundActive);

//     return { processedModules: enrichedModules, activeLectureData: foundActive };
//   }, [course, activeLectureId]);

//   // 12. useEffect for Initialization
//   useEffect(() => {
//     console.log("===== useEffect =====");
//     console.log("activeLectureData:", activeLectureData?.lecture_title || null);
//     console.log("activeLectureId:", activeLectureId);

//     if (activeLectureData && !activeLectureId) {
//       console.log("Setting initial lecture:", activeLectureData.lecture_title);
//       setActiveLectureId(activeLectureData.lecture_id);
//     }
//   }, [activeLectureData, activeLectureId]);

//   // 13. Complete Button Logic
//   const handleToggleComplete = async () => {
//     console.log("===== COMPLETE CLICKED =====");
//     console.log("Current Lecture:", activeLectureData?.lecture_title);

//     if (!activeLectureData || activeLectureData.isLocked) {
//       console.log("Cannot complete lecture (Locked or Missing Data)");
//       return;
//     }
    
//     // 14. Mutation Payload
//     const payload = {
//       courseId,
//       lectureId: activeLectureData.lecture_id,
//       isCompleted: !activeLectureData.is_completed
//     };

//     console.log("Sending Progress Update:", payload);
//     await progressMutation.mutateAsync(payload);
//   };

//   if (isLoading) {
//     return <div className="h-screen flex items-center justify-center animate-pulse">Loading course environment...</div>;
//   }

//   if (isError || !course) {
//     return (
//       <div className="h-screen flex flex-col items-center justify-center gap-4">
//         <h2 className="text-xl font-semibold">Could not load course</h2>
//         <Button onClick={() => navigate('/student/courses')}>Go Back</Button>
//       </div>
//     );
//   }

//   return (
//     <div className="flex h-screen bg-background overflow-hidden">
      
//       {/* LEFT: Video Player Area */}
//       <div className="flex-1 flex flex-col h-full overflow-y-auto">
//         {/* Top Navbar */}
//         <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
//           <h1 className="font-semibold text-lg truncate">{course.course_title}</h1>
//           <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
//             {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
//           </Button>
//         </div>

//         {/* Video Container */}
//         <div className="bg-black w-full aspect-video flex items-center justify-center relative">
//           {activeLectureData ? (
//             activeLectureData.isLocked ? (
//               <div className="text-white flex flex-col items-center gap-3">
//                 <Lock className="w-12 h-12 text-muted-foreground" />
//                 <p>This lecture is locked. Complete previous lectures first.</p>
//               </div>
//             ) : (
//               activeLectureData.video_url ? (
//                 <ReactPlayer
//                   url={activeLectureData.video_url}
//                   controls
//                   width="100%"
//                   height="100%"
//                   onEnded={() => {
//                     // 16. Video End
//                     console.log("Video Finished");
//                     if (!activeLectureData.is_completed) {
//                       console.log("Auto-completing lecture");
//                       handleToggleComplete();
//                     }
//                   }}
//                   config={{
//                     youtube: {
//                       playerVars: { showinfo: 1 }
//                     }
//                   }}
//                 />
//               ) : (
//                 <div className="text-white">No video provided for this lecture.</div>
//               )
//             )
//           ) : (
//             <div className="text-white">Select a lecture to begin</div>
//           )}
//         </div>

//         {/* Lecture Details */}
//         {activeLectureData && (
//           <div className="p-8 max-w-4xl w-full mx-auto">
//             <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
//               <div>
//                 <h2 className="text-2xl font-bold mb-2">{activeLectureData.lecture_title}</h2>
//                 <p className="text-muted-foreground text-sm">
//                   Duration: {activeLectureData.lecture_duration || 0} seconds
//                 </p>
//               </div>
              
//               <Button 
//                 onClick={handleToggleComplete}
//                 disabled={activeLectureData.isLocked || progressMutation.isPending}
//                 variant={activeLectureData.is_completed ? "outline" : "primary"}
//                 className={activeLectureData.is_completed ? "text-green-600 border-green-600 hover:bg-green-50" : ""}
//               >
//                 {progressMutation.isPending ? 'Updating...' : 
//                  activeLectureData.is_completed ? 'Completed' : 'Mark as Complete'}
//               </Button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* RIGHT: Curriculum Sidebar */}
//       {isSidebarOpen && (
//         <div className="w-80 bg-card border-l border-border flex flex-col h-full shrink-0 transition-all">
//           <div className="p-4 border-b border-border bg-muted/30">
//             <h3 className="font-bold text-foreground">Course Content</h3>
//           </div>
          
//           <div className="flex-1 overflow-y-auto">
//             {processedModules.map((module) => (
//               <div key={module.module_id} className="border-b border-border">
//                 <div className="p-4 bg-muted/10 font-semibold text-sm text-foreground">
//                   {module.module_title}
//                 </div>
//                 <div className="flex flex-col">
//                   {module.lectures.map((lecture) => {
//                     const isActive = activeLectureId === lecture.lecture_id;
//                     return (
//                       <button
//                         key={lecture.lecture_id}
//                         onClick={() => {
//                           // 17. Lecture Click
//                           console.log("Lecture Clicked:", lecture.lecture_title);
//                           if (!lecture.isLocked) {
//                             setActiveLectureId(lecture.lecture_id);
//                           }
//                         }}
//                         disabled={lecture.isLocked}
//                         className={`
//                           w-full flex items-start gap-3 p-4 text-left transition-colors border-l-4
//                           ${isActive ? 'bg-primary/5 border-primary' : 'border-transparent hover:bg-muted/50'}
//                           ${lecture.isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
//                         `}
//                       >
//                         <div className="mt-0.5 shrink-0">
//                           {lecture.is_completed ? (
//                             <CheckCircle2 className="w-5 h-5 text-green-500" />
//                           ) : lecture.isLocked ? (
//                             <Lock className="w-5 h-5 text-muted-foreground" />
//                           ) : isActive ? (
//                             <PlayCircle className="w-5 h-5 text-primary" />
//                           ) : (
//                             <Circle className="w-5 h-5 text-muted-foreground" />
//                           )}
//                         </div>
//                         <div className="flex flex-col">
//                           <span className={`text-sm ${isActive ? 'font-semibold text-primary' : 'text-foreground'}`}>
//                             {lecture.lecture_title}
//                           </span>
//                           <span className="text-xs text-muted-foreground mt-1">
//                             {lecture.lecture_duration ? `${Math.floor(lecture.lecture_duration / 60)} min` : 'Reading'}
//                           </span>
//                         </div>
//                       </button>
//                     )
//                   })}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default StudentLearn;