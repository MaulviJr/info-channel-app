import api from './axios';
import axios from 'axios';

/**
 * ==========================================
 * AUTHENTICATION & PUBLIC ENDPOINTS
 * ==========================================
 */


const refreshTokenAPI = async () => {
    const response = await api.post('/users/refresh-token');
    return response;
};

/**
 * ==========================================
 * CURRENT USER (GENERAL) ENDPOINTS
 * ==========================================
 */


const getProfileStatusAPI = async () => {
    const response = await api.get('/users/profile/status');
    return response;
};

const getCurrentUserAPI = async () => {
    const response = await api.get('/users/me');
    return response;
};

const getProfileStatus = async () => {
    const response = await getProfileStatusAPI();
    return response.data;
};

/**
 * ==========================================
 * STUDENT ENDPOINTS
 * ==========================================
 */

const updateStudentProfileAPI = async (payload) => {
    // If uploading image, payload must be FormData
    const config = payload instanceof FormData 
        ? { headers: { 'Content-Type': 'multipart/form-data' } } 
        : {};
    const response = await api.put('/users/profile', payload, config);
    return response;
};

/**
 * ==========================================
 * TEACHER ENDPOINTS
 * ==========================================
 */

const getTeacherProfileAPI = async () => {
    const response = await api.get('/users/teacher/profile');
    return response;
};

const updateTeacherProfileAPI = async (payload) => {
    const response = await api.put('/users/teacher/profile', payload);
    return response;
};

const listTeacherCoursesAPI = async () => {
    const response = await api.get('/users/teacher/my-courses');
    return response;
};

const listCourseStudentsAPI = async (courseId, params = {}) => {
    const response = await api.get(`/users/teacher/my-courses/${courseId}/students`, { params });
    return response;
};

/**
 * ==========================================
 * ADMIN ENDPOINTS
 * ==========================================
 */

const createTeacherAPI = async (payload) => {
    const response = await api.post('/users/admin/create-teacher', payload);
    return response;
};

const createAdminAPI = async (payload) => {
    const response = await api.post('/users/admin/create-admin', payload);
    return response;
};

const listAllUsersAPI = async (params = {}) => {
    // params can include { role: 'student', limit: 10, offset: 0 }
    const response = await api.get('/users/admin/users', { params });
    return response;
};

const getUserByIdAPI = async (userId) => {
    const response = await api.get(`/users/admin/users/${userId}`);
    return response;
};

const updateUserStatusAPI = async (userId, statusPayload) => {
    const response = await api.patch(`/users/admin/users/${userId}/status`, statusPayload);
    return response;
};

const deleteUserAPI = async (userId) => {
    const response = await api.delete(`/users/admin/users/${userId}`);
    return response;
};

const listStudentsWithProfileStatusAPI = async (params = {}) => {
    const response = await api.get('/users/admin/students', { params });
    return response;
};

export { 
    // Auth & Public

    refreshTokenAPI,

    // Current User

    getProfileStatusAPI,
    getProfileStatus,
    getCurrentUserAPI,

    // Student
    updateStudentProfileAPI,

    // Teacher
    getTeacherProfileAPI,
    updateTeacherProfileAPI,
    listTeacherCoursesAPI,
    listCourseStudentsAPI,

    // Admin
    createTeacherAPI,
    createAdminAPI,
    listAllUsersAPI,
    getUserByIdAPI,
    updateUserStatusAPI,
    deleteUserAPI,
    listStudentsWithProfileStatusAPI
};