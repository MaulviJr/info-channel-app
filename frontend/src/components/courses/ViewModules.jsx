import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, LayoutList } from 'lucide-react';
import Button from '../common/Button';
import ErrorAlert from '../common/ErrorAlert';
import ModuleItem from './ModuleItem';
import AddLectureModal from './AddLectureModal';
import AddModuleModal from './AddModuleModal';
import { getModulesByCourseIdAPI } from '../../api/modules.api';

const ViewModules = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);

  // Fetch Course Modules
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['courseModules', courseId],
    queryFn: () => getModulesByCourseIdAPI(courseId),
    enabled: !!courseId, // Only run query if courseId exists
  });

    const modules = data?.data?.data?.modules || [];
  console.log('Modules for course', courseId, modules)
    // const modules = data.data.data.modules || [];
//   console.log('Modules for course', courseId, modules);
  const openAddLectureModal = (moduleId) => {
    setSelectedModuleId(moduleId);
    setIsModalOpen(true);
  };

  const closeAddLectureModal = () => {
    setIsModalOpen(false);
    setSelectedModuleId(null);
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
      {/* Header Section */}
      <div className="mb-6 flex flex-col items-start justify-between sm:flex-row sm:items-center">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-2xl font-bold text-gray-900">Course Curriculum</h2>
          <p className="text-sm text-gray-500">Manage your course modules and lectures</p>
        </div>
        <Button 
          onClick={() => setIsAddModuleModalOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create New Module</span>
        </Button>
      </div>

      {/* Modules List */}
      {modules?.length > 0 ? (
        <div className="space-y-6">
          {modules.map((module) => (
            <ModuleItem 
              key={module.id} 
              module={module} 
              onAddLecture={() => openAddLectureModal(module.id)} 
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <LayoutList className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">No modules found</h3>
          <p className="mb-6 max-w-sm text-sm text-gray-500">
            Get started by creating your first module to structure your course content.
          </p>
          <Button onClick={() => setIsAddModuleModalOpen(true)}>
            Create New Module
          </Button>
        </div>
      )}

      {/* Add Lecture Modal */}
      <AddLectureModal 
        isOpen={isModalOpen}
        onClose={closeAddLectureModal}
        moduleId={selectedModuleId}
        courseId={courseId}
      />

      {/* Add Module Modal */}
      <AddModuleModal
        isOpen={isAddModuleModalOpen}
        onClose={() => setIsAddModuleModalOpen(false)}
        courseId={courseId}
      />
    </div>
  );
};

export default ViewModules;