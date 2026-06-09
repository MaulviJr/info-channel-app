import api from './axios.js';

const completeLectureAPI = async (lectureId) => {
    const response = await api.post(`/progress/lecture/${lectureId}/complete`, { lectureId });
    return response;
}

const getCourseProgressAPI = async (courseId) => {
    const response = await api.get(`/progress/course/${courseId}`);
    return response;
}