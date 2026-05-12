import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  timeout: 5000,
//   headers: { "X-Custom-Header": "foobar" },
    withCredentials: true,
});

export default api;