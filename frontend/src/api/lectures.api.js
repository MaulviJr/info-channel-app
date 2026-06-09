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
    formData.append('courseId', lectureData.courseId);
    formData.append('title', lectureData.title);
    // formData.append('description', lectureData.description);
    formData.append('video', videoFile);
    const response = await api.post(`/lectures/module/${moduleId}/create`, formData);
    return response;
}