import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, LayoutList } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Button from '../common/Button';
import ErrorAlert from '../common/ErrorAlert';
import ModuleItem from './ModuleItem';
import AddLectureModal from './AddLectureModal';
import AddModuleModal from './AddModuleModal';
import { getModulesByCourseIdAPI, reorderModulesAPI } from '../../api/modules.api';
import { reorderLectureAPI } from '../../api/lectures.api';

const ViewModules = () => {
  const { id: courseId } = useParams();
  const queryClient = useQueryClient();

  // Modal State
  const [isAddLectureModalOpen, setIsAddLectureModalOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);

  // Fetch Course Modules
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['courseModules', courseId],
    queryFn: () => getModulesByCourseIdAPI(courseId),
    enabled: !!courseId,
  });

  const modules = data?.data?.data?.modules || [];

  // Reorder Module Mutation
  // const reorderModuleMutation = useMutation({
  //   mutationFn: ({ moduleId, apiPosition }) => reorderModulesAPI(moduleId, courseId, apiPosition),
  //   onMutate: async ({ moduleId, targetIndex }) => {
  //     const queryKey = ['courseModules', courseId];
  //     // Do not await this, run it concurrently so state updates synchronously
  //     const cancelPromise = queryClient.cancelQueries({ queryKey });
  //     const previousModules = queryClient.getQueryData(queryKey);

  //     queryClient.setQueryData(queryKey, (old) => {
  //       if (!old) return old;
  //       const oldData = JSON.parse(JSON.stringify(old)); // Deep clone
  //       let modulesArray = oldData?.data?.data?.modules || oldData?.data?.modules || oldData?.modules;
        
  //       if (!modulesArray || !Array.isArray(modulesArray)) return old;

  //       const currentIndex = modulesArray.findIndex((m) => String(m.id) === String(moduleId));
  //       if (currentIndex === -1) return old;

  //       const [movedModule] = modulesArray.splice(currentIndex, 1);
  //       modulesArray.splice(targetIndex, 0, movedModule);

  //       return oldData;
  //     });

  //     await cancelPromise;
  //     return { previousModules, queryKey };
  //   },
  //   onError: (err, variables, context) => {
  //     if (context?.queryKey && context?.previousModules) {
  //       queryClient.setQueryData(context.queryKey, context.previousModules);
  //     }
  //   },
  //   onSettled: () => {
  //     queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
  //   },
  // });

  // // Reorder Lecture Mutation
  // const reorderLectureMutation = useMutation({
  //   mutationFn: ({ lectureId, apiPosition }) => reorderLectureAPI(lectureId, apiPosition),
  //   onMutate: async ({ lectureId, targetIndex, moduleId }) => {
  //     // FIX: Ensure moduleId is a Number if it represents an integer ID
  //     // This prevents the string "1" vs number 1 cache mismatch
  //     const parsedModuleId = isNaN(Number(moduleId)) ? moduleId : Number(moduleId);
  //     const queryKey = ['lectures', parsedModuleId];
      
  //     console.log(`[DND] Starting optimistic update for Key:`, queryKey);

  //     // 1. Snapshot previous data
  //     const previousLectures = queryClient.getQueryData(queryKey);
      
  //     // 2. Start canceling queries but DO NOT AWAIT IT YET!
  //     const cancelPromise = queryClient.cancelQueries({ queryKey });

  //     // 3. Synchronously update UI state
  //     queryClient.setQueryData(queryKey, (old) => {
  //       if (!old) {
  //         console.warn("[DND] Cache is empty, cannot optimistically update. Check if the queryKey exactly matches the one in ModuleItem.");
  //         return old;
  //       }

  //       // Deep clone to guarantee immutability for React Query
  //       const oldData = JSON.parse(JSON.stringify(old));
        
  //       // Flexibly find the array regardless of Axios interceptor wrappers
  //       let lecturesArray = oldData?.data?.data?.lectures || oldData?.data?.lectures || oldData?.lectures;
        
  //       if (!lecturesArray || !Array.isArray(lecturesArray)) {
  //         console.error("[DND] Could not locate 'lectures' array in cache payload!", oldData);
  //         return old;
  //       }

  //       const currentIndex = lecturesArray.findIndex((l) => String(l.id) === String(lectureId));
  //       if (currentIndex === -1) {
  //         console.error(`[DND] Lecture ID ${lectureId} not found in array!`);
  //         return old;
  //       }

  //       // Perform array swap
  //       const [movedLecture] = lecturesArray.splice(currentIndex, 1);
  //       lecturesArray.splice(targetIndex, 0, movedLecture);

  //       console.log("[DND] Optimistic Array Updated Successfully!");
  //       return oldData;
  //     });

  //     // 4. Await cancellation now that the UI is updated
  //     await cancelPromise;
  //     return { previousLectures, queryKey };
  //   },
  //   onError: (err, variables, context) => {
  //     console.error("[DND] Mutation Failed! Rolling back.", err);
  //     if (context?.queryKey && context?.previousLectures) {
  //       queryClient.setQueryData(context.queryKey, context.previousLectures);
  //     }
  //   },
  //   onSettled: (data, error, variables, context) => {
  //     // Use the parsed moduleId for invalidation as well
  //     const parsedModuleId = isNaN(Number(variables.moduleId)) ? variables.moduleId : Number(variables.moduleId);
  //     const key = context?.queryKey || ['lectures', parsedModuleId];
      
  //     console.log("[DND] Mutation Settled. Triggering background refetch for:", key);
  //     queryClient.invalidateQueries({ queryKey: key });
  //   },
  // });

// Reorder Module Mutation
const reorderModuleMutation = useMutation({
    mutationFn: ({ moduleId, apiPosition }) =>
        reorderModulesAPI(moduleId, courseId, apiPosition),

    onMutate: async ({ moduleId, targetIndex }) => {
        const queryKey = ['courseModules', courseId];

        // 1. Cancel FIRST before setting data
        await queryClient.cancelQueries({ queryKey });

        // 2. Snapshot for rollback
        const previousModules = queryClient.getQueryData(queryKey);

        // 3. Optimistic update
        queryClient.setQueryData(queryKey, (old) => {
            if (!old) return old;
            const oldData = JSON.parse(JSON.stringify(old));
            const modulesArray =
                oldData?.data?.data?.modules ||
                oldData?.data?.modules ||
                oldData?.modules;

            if (!modulesArray || !Array.isArray(modulesArray)) return old;

            const currentIndex = modulesArray.findIndex(
                (m) => String(m.id) === String(moduleId)
            );
            if (currentIndex === -1) return old;

            const [movedModule] = modulesArray.splice(currentIndex, 1);
            modulesArray.splice(targetIndex, 0, movedModule);

            return oldData;
        });

        return { previousModules, queryKey };
    },

    // Update cache with authoritative server response — NO refetch needed
    onSuccess: (response) => {
        // console.log('RAW onSuccess response:', JSON.stringify(response?.data, null, 2));
    const modules = response?.data?.data?.modules || response?.data?.modules;
    // console.log('Extracted modules array:', modules);
        if (!modules) return;

        queryClient.setQueryData(['courseModules', courseId], (old) => {
            if (!old) return old;
            const oldData = JSON.parse(JSON.stringify(old));

            // Find and replace modules array wherever it lives
            if (oldData?.data?.data?.modules) {
                oldData.data.data.modules = modules;
            } else if (oldData?.data?.modules) {
                oldData.data.modules = modules;
            }

            return oldData;
        });
    },

    onError: (err, variables, context) => {
        if (context?.queryKey && context?.previousModules) {
            queryClient.setQueryData(context.queryKey, context.previousModules);
        }
    },

    // NO invalidateQueries here — onSuccess handles the cache update
});

// Reorder Lecture Mutation
const reorderLectureMutation = useMutation({
    mutationFn: ({ lectureId, apiPosition }) =>
        reorderLectureAPI(lectureId, apiPosition),

    onMutate: async ({ lectureId, targetIndex, moduleId }) => {
        const parsedModuleId = isNaN(Number(moduleId)) ? moduleId : Number(moduleId);
        const queryKey = ['lectures', parsedModuleId];

        // 1. Cancel FIRST
        await queryClient.cancelQueries({ queryKey });

        // 2. Snapshot
        const previousLectures = queryClient.getQueryData(queryKey);

        // 3. Optimistic update
        queryClient.setQueryData(queryKey, (old) => {
            if (!old) return old;
            const oldData = JSON.parse(JSON.stringify(old));
            const lecturesArray =
                oldData?.data?.data?.lectures ||
                oldData?.data?.lectures ||
                oldData?.lectures;

            if (!lecturesArray || !Array.isArray(lecturesArray)) return old;

            const currentIndex = lecturesArray.findIndex(
                (l) => String(l.id) === String(lectureId)
            );
            if (currentIndex === -1) return old;

            const [movedLecture] = lecturesArray.splice(currentIndex, 1);
            lecturesArray.splice(targetIndex, 0, movedLecture);

            return oldData;
        });

        return { previousLectures, queryKey };
    },

    // Update cache with server's authoritative lecture order
    onSuccess: (response, variables) => {
        const lectures = response?.data?.data?.lectures || response?.data?.lectures;
        const parsedModuleId = isNaN(Number(variables.moduleId))
            ? variables.moduleId
            : Number(variables.moduleId);

        if (!lectures) return;

        queryClient.setQueryData(['lectures', parsedModuleId], (old) => {
            if (!old) return old;
            const oldData = JSON.parse(JSON.stringify(old));

            if (oldData?.data?.data?.lectures) {
                oldData.data.data.lectures = lectures;
            } else if (oldData?.data?.lectures) {
                oldData.data.lectures = lectures;
            }

            return oldData;
        });
    },

    onError: (err, variables, context) => {
        if (context?.queryKey && context?.previousLectures) {
            queryClient.setQueryData(context.queryKey, context.previousLectures);
        }
    },

    // NO invalidateQueries here
});

  // Handle Drag & Drop ends
  const handleDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;
    
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'module') {
      const moduleId = draggableId.replace("module-", "");
      const targetIndex = destination.index; // 0-based
      const apiPosition = targetIndex + 1;   // 1-based
      reorderModuleMutation.mutate({ moduleId, targetIndex, apiPosition });
    } else if (type === 'lecture') {
      if (source.droppableId !== destination.droppableId) return;

      const lectureId = draggableId.replace("lecture-", "");
      const moduleId = source.droppableId.replace("module-", "").replace("-lectures", "");
      
      const targetIndex = destination.index; // 0-based
      const apiPosition = targetIndex + 1;   // 1-based
      
      reorderLectureMutation.mutate({ lectureId, targetIndex, apiPosition, moduleId });
    }
  };

  const openAddLectureModal = (moduleId) => {
    setSelectedModuleId(moduleId);
    setIsAddLectureModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-4">
        <ErrorAlert message={error?.response?.data?.message || 'Error loading course modules.'} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col items-start justify-between sm:flex-row sm:items-center">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-2xl font-bold text-gray-900">Course Curriculum</h2>
          <p className="text-sm text-gray-500">Manage your course modules and lectures</p>
        </div>
        <Button onClick={() => setIsAddModuleModalOpen(true)} className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Create New Module</span>
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {modules?.length > 0 ? (
          <Droppable droppableId="course-modules" type="module">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                {modules.map((module, index) => (
                  <Draggable key={module.id} draggableId={`module-${module.id}`} index={index}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps}>
                        <ModuleItem
                          module={module}
                          courseId={courseId}
                          dragHandleProps={provided.dragHandleProps}
                          onAddLecture={() => openAddLectureModal(module.id)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-16 text-center">
            <LayoutList className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No modules found</h3>
            <p className="mb-6 max-w-sm text-sm text-gray-500">
              Get started by creating your first module to structure your course content.
            </p>
            <Button onClick={() => setIsAddModuleModalOpen(true)}>Create New Module</Button>
          </div>
        )}
      </DragDropContext>

      {/* Add Modals */}
      <AddLectureModal
        isOpen={isAddLectureModalOpen}
        onClose={() => setIsAddLectureModalOpen(false)}
        moduleId={selectedModuleId}
        courseId={courseId}
      />
      <AddModuleModal
        isOpen={isAddModuleModalOpen}
        onClose={() => setIsAddModuleModalOpen(false)}
        courseId={courseId}
      />
    </div>
  );
};

export default ViewModules;