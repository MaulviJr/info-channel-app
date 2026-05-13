import api from './axios';

const loginAPI = async (credentials) => {
    const response = await api.post('/users/login', credentials);
    return response;
};

const registerAPI = async (payload) => {
    const response = await api.post('/users/register', payload);
    return response;
};

const logoutAPI = async () => {
    const response = await api.post('/users/logout');
    return response;
};

const getMeAPI = async () => {
    const response = await api.get('/users/me');
    return response;
};

export { loginAPI, registerAPI, logoutAPI, getMeAPI };