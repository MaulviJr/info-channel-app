import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import FormInput from '../common/FormInput';
import LoadingButton from '../common/LoadingButton';
import ErrorAlert from '../common/ErrorAlert';
import { createLectureAPI } from '../../api/lectures.api';

const AddLectureModal = ({ isOpen, onClose, moduleId, courseId }) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState(''); // Changed to empty string
  const [localError, setLocalError] = useState('');

  const { mutate: uploadLecture, isPending, isError, error } = useMutation({
    mutationFn: (lectureData) => createLectureAPI(moduleId, lectureData), // Simplified
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures', moduleId] });
      handleClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');

    if (!title.trim() || !videoUrl.trim()) {
      setLocalError('Please provide both a title and a video URL.');
      return;
    }

    // Send a plain JSON object instead of FormData
    uploadLecture({
      courseId,
      title: title.trim(),
      videoUrl: videoUrl.trim()
    });
  };

  const handleClose = () => {
    setTitle('');
    setVideoUrl('');
    setLocalError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Add New Lecture</h2>
          <button onClick={handleClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {(isError || localError) && (
          <div className="mb-4">
            <ErrorAlert message={localError || error?.response?.data?.message || 'Failed to add lecture'} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Lecture Title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Introduction to React"
            required
          />

          {/* Changed from File Input to Text/URL Input */}
          <FormInput
            label="Video URL"
            name="videoUrl"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="e.g., https://youtube.com/... or https://vimeo.com/..."
            required
          />

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <LoadingButton
              isLoading={isPending}
              idleText="Add Lecture"
              loadingText="Saving..."
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLectureModal;