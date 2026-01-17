import axios from 'axios';
import { Platform } from 'react-native';

const getBaseUrl = () => {
    if (Platform.OS === 'web') return 'http://localhost:3000/api';
    if (Platform.OS === 'android') return 'http://10.0.2.2:3000/api'; // Emulator
    return 'http://localhost:3000/api'; // iOS or other
}

const API_URL = getBaseUrl();

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
