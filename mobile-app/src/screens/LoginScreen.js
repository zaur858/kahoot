import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('student');
    const [isRegister, setIsRegister] = useState(false);

    const handleAuth = async () => {
        try {
            if (isRegister) {
                const res = await api.post('/auth/register', { username, email, password, role });
                Alert.alert('Uğurlu', 'Hesab yaradıldı! Giriş edə bilərsiniz. (Müəllimsinizsə təsdiq gözləməlisiniz)');
                setIsRegister(false);
            } else {
                const res = await api.post('/auth/login', { email, password });
                const user = res.data.user;

                // Save session
                await AsyncStorage.setItem('user', JSON.stringify(user));

                Alert.alert('Uğurlu', `Xoş gəldiniz, ${user.username}!`);

                // Navigate based on role
                if (user.role === 'admin') {
                    navigation.replace('AdminDashboard', { user });
                } else if (user.role === 'teacher') {
                    navigation.replace('TeacherDashboard', { user });
                } else {
                    navigation.replace('StudentDashboard', { user });
                }
            }
        } catch (error) {
            Alert.alert('Xəta', error.response?.data?.message || 'Bir xəta baş verdi');
        }
    };

    return (
        <LinearGradient
            colors={['#4a148c', '#7b1fa2']}
            style={styles.container}
        >
            <View style={styles.card}>
                <Text style={styles.title}>Legend</Text>

                {isRegister && (
                    <TextInput
                        placeholder="İstifadəçi Adı"
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholderTextColor="#999"
                    />
                )}

                <TextInput
                    placeholder="Email"
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    placeholderTextColor="#999"
                />

                <TextInput
                    placeholder="Şifrə"
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor="#999"
                />

                {isRegister && (
                    <View style={styles.roleContainer}>
                        <TouchableOpacity
                            style={[styles.roleBtn, role === 'student' && styles.roleBtnActive]}
                            onPress={() => setRole('student')}
                        >
                            <Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>Məktəbli</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.roleBtn, role === 'teacher' && styles.roleBtnActive]}
                            onPress={() => setRole('teacher')}
                        >
                            <Text style={[styles.roleText, role === 'teacher' && styles.roleTextActive]}>Müəllim</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity style={styles.mainBtn} onPress={handleAuth}>
                    <Text style={styles.mainBtnText}>{isRegister ? "Qeydiyyat" : "Giriş"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setIsRegister(!isRegister)}
                    style={styles.switchBtn}
                >
                    <Text style={styles.switchBtnText}>
                        {isRegister ? "Artıq hesabınız var? Giriş edin" : "Hesabınız yoxdur? Qeydiyyatdan keçin"}
                    </Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 30, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10 },
    title: { fontSize: 40, fontWeight: 'bold', color: '#4a148c', textAlign: 'center', marginBottom: 30, letterSpacing: 2 },
    input: { backgroundColor: '#f3f3f3', borderRadius: 10, padding: 15, marginBottom: 15, fontSize: 16 },
    roleContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#f3f3f3', borderRadius: 10, padding: 5 },
    roleBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
    roleBtnActive: { backgroundColor: '#fff', elevation: 2 },
    roleText: { color: 'gray', fontWeight: 'bold' },
    roleTextActive: { color: '#4a148c' },
    mainBtn: { backgroundColor: '#4a148c', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    mainBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    switchBtn: { marginTop: 20, alignItems: 'center' },
    switchBtnText: { color: '#666', fontSize: 14 }
});
