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

const createLectureAPI = async (moduleId, lectureData, videoFile) => {
    const formData = new FormData();
    // console.log('Creating lecture with data:', lectureData.get('title'), 'courseId:', lectureData.get('courseId'), 'moduleId:', moduleId, 'videoFile:', videoFile);


    formData.append('courseId', lectureData.get('courseId'));
    formData.append('title', lectureData.get('title'));
    formData.append('moduleId', moduleId);
    // formData.append('description', lectureData.description);
    formData.append('video', videoFile);
    const response = await api.post(`/lectures/module/${moduleId}/create`, formData);
    // console.log('Create Lecture Response:', response);
    return response;
}

const updateLectureAPI = async (lectureId, title, position) => {
    console.log(`API call to update lecture ${lectureId} with title "${title}" and position ${position}`);
    const response = await api.put(`/lectures/${lectureId}`, { title, position });
    return response;
}

const deleteLectureAPI = async (lectureId) => {
    const response = await api.delete(`/lectures/${lectureId}`);
    return response;
}

const reorderLectureAPI = async (lectureId, newPosition) => {
    console.log(`API call to reorder lecture ${lectureId} to new position ${newPosition}`);
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