import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, LayoutList } from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';

import Button from '../common/Button';
import ErrorAlert from '../common/ErrorAlert';
import ModuleItem from './ModuleItem';
import AddLectureModal from './AddLectureModal';
import AddModuleModal from './AddModuleModal';
import { getModulesByCourseIdAPI, reorderModulesAPI } from '../../api/modules.api';
import { reorderLectureAPI } from '../../api/lectures.api';

const moveItemInArray = (items, itemId, destinationIndex) => {
  const nextItems = [...items];
  const currentIndex = nextItems.findIndex((item) => String(item.id) === String(itemId));

  if (currentIndex === -1) return items;

  const [movedItem] = nextItems.splice(currentIndex, 1);
  nextItems.splice(destinationIndex, 0, movedItem);

  return nextItems;
};

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
    mutationFn: ({ moduleId, newPosition }) => reorderModulesAPI(moduleId, courseId, newPosition),
    onMutate: ({ moduleId, destinationIndex }) => {
      const previousModules = queryClient.getQueryData(['courseModules', courseId]);

      queryClient.setQueryData(['courseModules', courseId], (old) => {
        if (!old?.data?.data?.modules) return old;
        const newModules = moveItemInArray(old.data.data.modules, moduleId, destinationIndex);
        if (newModules === old.data.data.modules) return old;
        return { ...old, data: { ...old.data, data: { ...old.data.data, modules: newModules } } };
      });

      void queryClient.cancelQueries({ queryKey: ['courseModules', courseId] });
      return { previousModules };
    },
    onError: (err, newOrder, context) => {
      if (context?.previousModules) {
        queryClient.setQueryData(['courseModules', courseId], context.previousModules);
      }
    },
  });

  // Reorder Lecture Mutation
  const reorderLectureMutation = useMutation({
    mutationFn: ({ lectureId, newPosition }) => reorderLectureAPI(lectureId, newPosition),
    onMutate: ({ lectureId, destinationIndex, moduleId }) => {
      const queryKey = ['lectures', moduleId]; 
      const previousLectures = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        if (!old?.data?.data?.lectures) return old;
        const newLectures = moveItemInArray(old.data.data.lectures, lectureId, destinationIndex);
        if (newLectures === old.data.data.lectures) return old;
        return { ...old, data: { ...old.data, data: { ...old.data.data, lectures: newLectures } } };
      });

      void queryClient.cancelQueries({ queryKey });
      return { previousLectures, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousLectures) {
        queryClient.setQueryData(context.queryKey, context.previousLectures);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lectures', variables.moduleId] });
    },
  });

  // Configure sensors - distance: 5 prevents clicks from registering as drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Handle Drag & Drop ends
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    if (active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    // Module Reordering
    if (activeData.type === 'module' && overData.type === 'module') {
      const oldIndex = modules.findIndex(m => `module-${m.id}` === active.id);
      const newIndex = modules.findIndex(m => `module-${m.id}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderModuleMutation.mutate({ 
          moduleId: active.id.replace("module-", ""),
          newPosition: newIndex + 1,
          destinationIndex: newIndex
        });
      }
    } 
    // Lecture Reordering
    else if (activeData.type === 'lecture' && overData.type === 'lecture') {
      // Prevent cross-module dragging
      if (activeData.moduleId !== overData.moduleId) return;

      const queryKey = ['lectures', activeData.moduleId];
      const lecturesData = queryClient.getQueryData(queryKey);
      const lectures = lecturesData?.data?.data?.lectures || [];

      const oldIndex = lectures.findIndex(l => `lecture-${l.id}` === active.id);
      const newIndex = lectures.findIndex(l => `lecture-${l.id}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderLectureMutation.mutate({ 
          lectureId: active.id.replace("lecture-", ""), 
          newPosition: newIndex + 1,
          destinationIndex: newIndex,
          moduleId: activeData.moduleId 
        });
      }
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {modules?.length > 0 ? (
          <SortableContext items={modules.map(m => `module-${m.id}`)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-6">
              {modules.map((module) => (
                <ModuleItem
                  key={module.id}
                  id={`module-${module.id}`}
                  module={module}
                  courseId={courseId}
                  onAddLecture={() => openAddLectureModal(module.id)}
                />
              ))}
            </div>
          </SortableContext>
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
      </DndContext>

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