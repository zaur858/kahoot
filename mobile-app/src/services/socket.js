import io from 'socket.io-client';
import { Platform } from 'react-native';

const getSocketUrl = () => {
    if (Platform.OS === 'web') return 'http://localhost:3000';
    if (Platform.OS === 'android') return 'http://10.0.2.2:3000'; // Emulator
    return 'http://localhost:3000';
}

const SOCKET_URL = getSocketUrl();

export const socket = io(SOCKET_URL, {
    autoConnect: false,
});
