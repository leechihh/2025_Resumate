// frontend/src/api/axios.js
import axios from 'axios';

const api = axios.create({
    // 設定後端的基本網址
    baseURL: 'http://127.0.0.1:8000/api/',
    timeout: 60000, // 超時設定
    headers: {
        'Content-Type': 'application/json',
    }
});

export default api;