import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import Button from '../common/Button';
import FormInput from '../common/FormInput';
import { updateModuleAPI } from '../../api/modules.api';

const EditModuleModal = ({ isOpen, onClose, module, courseId }) => {
  const [title, setTitle] = useState(module.title || '');
  const queryClient = useQueryClient();
    console.log(`EditModuleModal initialized with module: ${module.title} (ID: ${module.id}) and courseId: ${courseId}`);
  const updateModuleMutation = useMutation({
    mutationFn: (data) => updateModuleAPI(module.id, data.title, module.position), // assuming position remains same on title update
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    updateModuleMutation.mutate({ title });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Edit Module</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <FormInput
              label="Module Title"
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Introduction to React"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateModuleMutation.isPending || !title.trim()}
            >
              {updateModuleMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModuleModal;