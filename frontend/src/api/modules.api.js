import api from './axios.js';

    // getModulesByCourseId,
    // createModule,
    // updateModule,
    // deleteModule,
    // reorderModules

const getModulesByCourseIdAPI = async (courseId) => {
    const response = await api.get(`/modules/course/${courseId}`);
    return response;
}

const createModuleAPI = async (courseId, title) => {
    const response = await api.post(`/modules/course/${courseId}/create`, { title});
    return response;
}

const updateModuleAPI = async (moduleId, title, position) => {
    const response = await api.put(`/modules/${moduleId}`, { title, position });
    return response;
}

const deleteModuleAPI = async (moduleId) => {
    const response = await api.delete(`/modules/${moduleId}`);
    return response;
}

const reorderModulesAPI = async (moduleId, newPosition) => {
    const response = await api.put(`/modules/reorder`, { moduleId, newPosition });
    return response;
}


export {
    getModulesByCourseIdAPI,
    createModuleAPI,
    updateModuleAPI,
    deleteModuleAPI,
    reorderModulesAPI
}
