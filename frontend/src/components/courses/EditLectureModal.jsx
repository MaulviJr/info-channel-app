import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import Button from '../common/Button';
import FormInput from '../common/FormInput';
import { updateLectureAPI } from '../../api/lectures.api';

const EditLectureModal = ({ isOpen, onClose, lecture, moduleId }) => {
  const [title, setTitle] = useState(lecture.title || '');
  const queryClient = useQueryClient();

  const updateLectureMutation = useMutation({
    mutationFn: (data) => updateLectureAPI(lecture.id, data.title, lecture.position), 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures', moduleId] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    updateLectureMutation.mutate({ title });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Edit Lecture Title</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <FormInput
              label="Lecture Title"
              type="text"
              id="lecture-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Setting up your environment"
              required
            />
            {/* Note: If you want to support re-uploading videos, that logic requires FormData and would be added here */}
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateLectureMutation.isPending || !title.trim()}
            >
              {updateLectureMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLectureModal;