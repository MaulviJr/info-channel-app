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
  const reorderModuleMutation = useMutation({
    mutationFn: ({ moduleId, newPosition }) => reorderModulesAPI(moduleId,courseId, newPosition),
    onMutate: async ({ moduleId, newPosition }) => {
      await queryClient.cancelQueries({ queryKey: ['courseModules', courseId] });
      const previousModules = queryClient.getQueryData(['courseModules', courseId]);

      // Optimistically update the UI
      queryClient.setQueryData(['courseModules', courseId], (old) => {
        if (!old?.data?.data?.modules) return old;
        const newModules = [...old.data.data.modules];
        const currentIndex = newModules.findIndex((m) => String(m.id) === String(moduleId));
        if (currentIndex === -1) return old;

        const [movedModule] = newModules.splice(currentIndex, 1);
        newModules.splice(newPosition, 0, movedModule);

        return { ...old, data: { ...old.data, data: { ...old.data.data, modules: newModules } } };
      });
      return { previousModules };
    },
    onError: (err, newOrder, context) => {
      // Rollback on error
      queryClient.setQueryData(['courseModules', courseId], context.previousModules);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
    },
  });

  // Reorder Lecture Mutation
  const reorderLectureMutation = useMutation({
    mutationFn: ({ lectureId, newPosition }) => reorderLectureAPI(lectureId, newPosition),
    onMutate: async ({ lectureId, newPosition, moduleId }) => {
      const queryKey = ['lectures', parseInt(moduleId, 10)];
      await queryClient.cancelQueries({ queryKey });
      const previousLectures = queryClient.getQueryData(queryKey);

      // Optimistically update the UI
      queryClient.setQueryData(queryKey, (old) => {
        if (!old?.data?.data?.lectures) return old;
        const newLectures = [...old.data.data.lectures];
        const currentIndex = newLectures.findIndex((l) => String(l.id) === String(lectureId));
        if (currentIndex === -1) return old;

        const [movedLecture] = newLectures.splice(currentIndex, 1);
        newLectures.splice(newPosition, 0, movedLecture);

        return { ...old, data: { ...old.data, data: { ...old.data.data, lectures: newLectures } } };
      });
      return { previousLectures, queryKey };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(context.queryKey, context.previousLectures);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lectures', parseInt(variables.moduleId, 10)] });
    },
  });

  // Handle Drag & Drop ends
  const handleDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;
    console.log('Drag Ended:', { destination, source, draggableId, type });
    // Dropped outside a valid zone
    if (!destination) return;

    // Dropped in the same exact spot
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'module') {
      const moduleId = draggableId.replace("module-", ""); // Extracts ID from "module-123"
 
      reorderModuleMutation.mutate({ moduleId,courseId, newPosition: destination.index +1});
    } else if (type === 'lecture') {
      // Enforce the rule: No cross-module dragging
      if (source.droppableId !== destination.droppableId) return;

      const lectureId = draggableId.replace("lecture-", ""); // Extracts ID from "lecture-123"

      const moduleId = source.droppableId.replace("module-", "")
  .replace("-lectures", ""); // Extracts Module ID from "module-123-lectures"
      
      reorderLectureMutation.mutate({ lectureId, newPosition: destination.index+1, moduleId });
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