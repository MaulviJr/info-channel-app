import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Video, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import Button from '../common/Button';
import EditModuleModal from './EditModuleModal.jsx';
import EditLectureModal from './EditLectureModal.jsx';
import { getLecturesForModuleAPI, deleteLectureAPI } from '../../api/lectures.api.js';
import { deleteModuleAPI } from '../../api/modules.api.js';

// Extracted Lecture Component for Dnd-Kit Sortable
const SortableLecture = ({ lecture, moduleId, onEdit, onDelete, isDeleting }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `lecture-${lecture.id}`,
    data: { type: 'lecture', moduleId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: isDragging ? 'relative' : 'static',
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-md border border-gray-100 p-3 transition-colors ${
        isDragging ? 'bg-blue-50 shadow-md opacity-90' : 'bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center">
        {/* Drag Handle explicitly separated */}
        <div {...attributes} {...listeners} className="mr-3 cursor-grab text-gray-400 hover:text-gray-700 active:cursor-grabbing">
          <GripVertical className="h-5 w-5" />
        </div>
        <Video className="mr-3 h-5 w-5 text-blue-500" />
        <span className="font-medium text-gray-700">{lecture.title}</span>
      </div>

      <div className="flex items-center space-x-1">
        <button 
          onClick={onEdit}
          className="rounded p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button 
          onClick={onDelete}
          disabled={isDeleting}
          className="rounded p-1.5 text-gray-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
};

const ModuleItem = ({ module, courseId, id, onAddLecture }) => {
  const queryClient = useQueryClient();
  const [isEditModuleOpen, setIsEditModuleOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);

  // Dnd-kit sortable for the Module Wrapper
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { type: 'module' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: isDragging ? 'relative' : 'static',
  };

  // Fetch Lectures
  const { data, isLoading, isError } = useQuery({
    queryKey: ['lectures', module.id],
    queryFn: () => getLecturesForModuleAPI(module.id),
  });
  const lectures = data?.data?.data?.lectures || [];

  // Delete Mutations
  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId) => deleteModuleAPI(moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
    },
  });

  const deleteLectureMutation = useMutation({
    mutationFn: (lectureId) => deleteLectureAPI(lectureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures', module.id] });
    },
  });

  const handleDeleteModule = () => {
    if (window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      deleteModuleMutation.mutate(module.id);
    }
  };

  const handleDeleteLecture = (lectureId) => {
    if (window.confirm('Are you sure you want to delete this lecture?')) {
      deleteLectureMutation.mutate(lectureId);
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`mb-6 overflow-hidden rounded-lg border border-gray-200 shadow-sm ${
        isDragging ? 'bg-blue-50/50 opacity-90' : 'bg-white'
      }`}
    >
      {/* Module Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-4">
        <div className="flex items-center">
          <div {...attributes} {...listeners} className="mr-3 cursor-grab text-gray-400 hover:text-gray-700 active:cursor-grabbing">
            <GripVertical className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{module.title}</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={onAddLecture} className="flex items-center space-x-1 px-3 py-1.5 text-sm" variant="outline">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Add Lecture</span>
          </Button>
          <button 
            onClick={() => setIsEditModuleOpen(true)}
            className="rounded p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            title="Edit Module"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button 
            onClick={handleDeleteModule}
            disabled={deleteModuleMutation.isPending}
            className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete Module"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Lectures List */}
      <div className="p-4 sm:p-6 bg-white">
        {isLoading ? (
          <div className="flex animate-pulse flex-col space-y-3">
            <div className="h-10 w-full rounded bg-gray-100"></div>
            <div className="h-10 w-full rounded bg-gray-100"></div>
          </div>
        ) : isError ? (
          <p className="text-sm text-red-500">Failed to load lectures for this module.</p>
        ) : lectures?.length > 0 ? (
          <SortableContext items={lectures.map(l => `lecture-${l.id}`)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-3">
              {lectures.map((lecture) => (
                <SortableLecture
                  key={lecture.id}
                  lecture={lecture}
                  moduleId={module.id}
                  onEdit={() => setEditingLecture(lecture)}
                  onDelete={() => handleDeleteLecture(lecture.id)}
                  isDeleting={deleteLectureMutation.isPending}
                />
              ))}
            </ul>
          </SortableContext>
        ) : (
          <div className="rounded-md border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm text-gray-500">No lectures have been added to this module yet.</p>
          </div>
        )}
      </div>

      {/* Edit Modals */}
      {isEditModuleOpen && (
        <EditModuleModal
          isOpen={isEditModuleOpen}
          onClose={() => setIsEditModuleOpen(false)}
          module={module}
          courseId={courseId}
        />
      )}
      {editingLecture && (
        <EditLectureModal
          isOpen={!!editingLecture}
          onClose={() => setEditingLecture(null)}
          lecture={editingLecture}
          moduleId={module.id}
        />
      )}
    </div>
  );
};

export default React.memo(ModuleItem);