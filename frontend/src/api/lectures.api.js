import api from './axios.js';

    // getLecturesForModule,
    // getLecture,
    // createLecture,
    // updateLecture,
    // reorderLecture,
    // deleteLecture

const getLecturesForModuleAPI = async (moduleId) => {
    const response = await api.get(`/lectures/module/${moduleId}`);
    return response;
}

const getLectureAPI = async (lectureId) => {
    const response = await api.get(`/lectures/${lectureId}`);
    return response;
}

// ... existing imports

const createLectureAPI = async (moduleId, lectureData) => {
    // lectureData now contains { courseId, title, videoUrl }
    const payload = {
        ...lectureData,
        moduleId
    };
    
    // Send standard JSON payload
    const response = await api.post(`/lectures/module/${moduleId}/create`, payload);
    return response;
}

// ... rest of the file stays the same
const updateLectureAPI = async (lectureId, title, position) => {
    // console.log(`API call to update lecture ${lectureId} with title "${title}" and position ${position}`);
    const response = await api.put(`/lectures/${lectureId}`, { title, position });
    return response;
}

const deleteLectureAPI = async (lectureId) => {
    const response = await api.delete(`/lectures/${lectureId}`);
    return response;
}

const reorderLectureAPI = async (lectureId, newPosition) => {
    // console.log(`API call to reorder lecture ${lectureId} to new position ${newPosition}`);
    const response = await api.put(`/lectures/reorder`, { lectureId, newPosition });
    return response;
}

export {
    getLecturesForModuleAPI,
    getLectureAPI,
    createLectureAPI,
    updateLectureAPI,
    deleteLectureAPI,
    reorderLectureAPI
}