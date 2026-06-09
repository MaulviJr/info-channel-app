import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import FormInput from '../common/FormInput';
import LoadingButton from '../common/LoadingButton';
import ErrorAlert from '../common/ErrorAlert';
// Adjust the import path if necessary based on where you put createModuleAPI
import { createModuleAPI } from '../../api/modules.api';

const AddModuleModal = ({ isOpen, onClose, courseId }) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [localError, setLocalError] = useState('');

  const { mutate: createModule, isPending, isError, error } = useMutation({
    // We pass title as an object just to keep the mutationFn signature clean
    mutationFn: ({ title }) => createModuleAPI(courseId, title),
    onSuccess: () => {
      // Invalidate the course modules query to refresh the list automatically
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      handleClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    console.log('Creating', title);
    if (!title.trim()) {
      setLocalError('Please provide a module title.');
      return;
    }

    createModule({ title: title.trim() });
  };

  const handleClose = () => {
    setTitle('');
    setLocalError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Create New Module</h2>
          <button onClick={handleClose} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {(isError || localError) && (
          <div className="mb-4">
            <ErrorAlert message={localError || error?.response?.data?.message || 'Failed to create module'} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Module Title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Section 1: Getting Started"
            required
            autoFocus
          />

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <LoadingButton
              type="submit"
              isLoading={isPending}
              idleText="Create Module"
              loadingText="Creating..."
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Module
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddModuleModal;