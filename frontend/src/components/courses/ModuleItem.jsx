import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Video, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import Button from '../common/Button';
import EditModuleModal from './EditModuleModal.jsx'
import EditLectureModal from './EditLectureModal.jsx'
import { getLecturesForModuleAPI, deleteLectureAPI } from '../../api/lectures.api.js';
import { deleteModuleAPI } from '../../api/modules.api.js';

const ModuleItem = ({ module, courseId, dragHandleProps, onAddLecture }) => {
  const queryClient = useQueryClient();
 
  // Modal States
  const [isEditModuleOpen, setIsEditModuleOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);

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
    <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Module Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-4">
        <div className="flex items-center">
          <div {...dragHandleProps} className="mr-3 cursor-grab text-gray-400 hover:text-gray-700">
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
            onClick={() => {
              setIsEditModuleOpen(true);
              
            }}
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
          <Droppable droppableId={`module-${module.id}-lectures`} type="lecture">
            {(provided) => (
              <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                {lectures.map((lecture, index) => (
                  <Draggable key={lecture.id} draggableId={`lecture-${lecture.id}`} index={index}>
                    {(provided, snapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center justify-between rounded-md border border-gray-100 p-3 transition-colors ${snapshot.isDragging ? 'bg-blue-50 shadow-md' : 'bg-gray-50 hover:bg-gray-100'}`}
                      >
                        <div className="flex items-center">
                          <div {...provided.dragHandleProps} className="mr-3 cursor-grab text-gray-400 hover:text-gray-700">
                            <GripVertical className="h-5 w-5" />
                          </div>
                          <Video className="mr-3 h-5 w-5 text-blue-500" />
                          <span className="font-medium text-gray-700">{lecture.title}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={() => setEditingLecture(lecture)}
                            className="rounded p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteLecture(lecture.id)}
                            disabled={deleteLectureMutation.isPending}
                            className="rounded p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
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

export default ModuleItem;