import api from './axios.js';

const listCoursesAPI = async (params = {}) => {
    // params can include { page: 1, limit: 10 }
    const response = await api.get('/courses', { params });
    return response;
};

const listAllCoursesForStaffAPI = async (params = {}) => {
    const response = await api.get('/courses/all', { params });
    return response;
};

const getCourseByIdAPI = async (courseId) => {
    const response = await api.get(`/courses/${courseId}`);
    return response;
};

const createCourseAPI = async (payload) => {
    const response = await api.post('/courses/create-course', payload);
    return response;
};

const updateCourseAPI = async (courseId, payload) => {
    const response = await api.put(`/courses/${courseId}`, payload);
    return response;
};

const deleteCourseAPI = async (courseId) => {
    const response = await api.delete(`/courses/${courseId}`);
    return response;
};

const toggleCoursePublishAPI = async (courseId) => {
    const response = await api.patch(`/courses/${courseId}/publish`);
    return response;
};

export {
    listCoursesAPI,
    listAllCoursesForStaffAPI,
    getCourseByIdAPI,
    createCourseAPI,
    updateCourseAPI,
    deleteCourseAPI,
    toggleCoursePublishAPI
}