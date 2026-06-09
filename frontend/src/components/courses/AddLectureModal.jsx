import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import FormInput from '../common/FormInput';
import LoadingButton from '../common/LoadingButton';
import ErrorAlert from '../common/ErrorAlert';
// Assume this API exists. Adjust path if necessary.
import {createLectureAPI} from '../../api/lectures.api';

const AddLectureModal = ({ isOpen, onClose, moduleId, courseId }) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [localError, setLocalError] = useState('');

  const { mutate: uploadLecture, isPending, isError, error } = useMutation({
    mutationFn: (formData) => createLectureAPI(moduleId, formData,videoFile),
    onSuccess: () => {
      // Invalidate the specific module's lectures to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['lectures', moduleId] });
      handleClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');

    if (!title.trim() || !videoFile) {
      setLocalError('Please provide both a title and a video file.');
      return;
    }

    // Using FormData for file uploads
    const formData = new FormData();
    formData.append('courseId', courseId);
    // formData.append('moduleId', moduleId);
    formData.append('title', title);
    // formData.append('video', videoFile);
    // console.log('Submitting lecture with title:', formData.get('title'), 'and video file:', formData.get('video'), formData);
    uploadLecture(formData);
  };

  const handleClose = () => {
    setTitle('');
    setVideoFile(null);
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
            <ErrorAlert message={localError || error?.response?.data?.message || 'Failed to upload lecture'} />
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

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Video File</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            {videoFile && <p className="mt-1 text-xs text-gray-500">Selected: {videoFile.name}</p>}
          </div>

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
//   type="submit"
  isLoading={isPending}
  idleText="Upload Lecture"
  loadingText="Uploading..."
  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
/>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLectureModal;