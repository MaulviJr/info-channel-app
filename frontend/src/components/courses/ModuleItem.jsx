import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, Video } from 'lucide-react';
import Button from '../common/Button';
// Assume this API exists
import {getLecturesForModuleAPI} from '../../api/lectures.api.js';

const ModuleItem = ({ module, onAddLecture }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['lectures', module.id],
    queryFn: () => getLecturesForModuleAPI(module.id),
  });
  const lectures = data?.data?.data?.lectures || [];
  
  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Module Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-800">{module.title}</h3>
        <Button 
          onClick={onAddLecture} 
          className="flex items-center space-x-2 text-sm"
          variant="outline"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Lecture</span>
        </Button>
      </div>

      {/* Lectures List */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex animate-pulse flex-col space-y-3">
            <div className="h-10 rounded bg-gray-100 w-full"></div>
            <div className="h-10 rounded bg-gray-100 w-full"></div>
          </div>
        ) : isError ? (
          <p className="text-sm text-red-500">Failed to load lectures for this module.</p>
        ) : lectures?.length > 0 ? (
          <ul className="space-y-3">
            {lectures.map((lecture) => (
              <li 
                key={lecture.id} 
                className="flex items-center rounded-md border border-gray-100 bg-gray-50 p-3 transition-colors hover:bg-gray-100"
              >
                <Video className="mr-3 h-5 w-5 text-blue-500" />
                <span className="font-medium text-gray-700">{lecture.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-md border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm text-gray-500">No lectures have been added to this module yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleItem;