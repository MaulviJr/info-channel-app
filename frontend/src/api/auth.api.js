import api from './axios';

const login = async (email, password) => {
    try {
        const response = await api.post('/users/login', { email, password });
        return response.data;
    } catch (error) {
        throw error;
    }
};


const register = async (formData) => {
    try {
        const response = await api.post('/users/register', formData, {
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const logout = async () => {
    try {
        const response = await api.post('/users/logout');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export { login, register, logout };