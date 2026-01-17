import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function TeacherDashboard({ navigation, route }) {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const user = route.params?.user;

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchQuizzes();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchQuizzes = async () => {
        try {
            const res = await api.get(`/quizzes?search=${search}`);
            setQuizzes(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const deleteQuiz = (quizId) => {
        Alert.alert(
            'İmtahanı Sil',
            'Bu imtahanı və bütün nəticələrini silmək istədiyinizə əminsiniz?',
            [
                { text: 'Xeyr', style: 'cancel' },
                {
                    text: 'Bəli, Sil', style: 'destructive', onPress: async () => {
                        try {
                            await api.delete(`/quizzes/${quizId}`);
                            fetchQuizzes();
                        } catch (err) {
                            Alert.alert('Xəta', 'Silinmə baş tutmadı');
                        }
                    }
                }
            ]
        );
    };

    const startLiveGame = (quizId) => {
        navigation.navigate('GameLobby', { quizId, isHost: true });
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('user');
        navigation.replace('Login');
    };

    return (
        <LinearGradient colors={['#4a148c', '#1a237e']} style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.welcomeText}>Müəllim Paneli 🏛️</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Çıxış</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate('CreateQuiz', { user })}
            >
                <LinearGradient colors={['#ffffff', '#f3e5f5']} style={styles.createBtnGradient}>
                    <Text style={styles.createBtnText}>+ Yeni İmtahan/Oyun Yarat</Text>
                </LinearGradient>
            </TouchableOpacity>

            <View style={styles.searchBar}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="İmtahan axtar..."
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={fetchQuizzes}
                />
            </View>

            {loading ? <ActivityIndicator size="large" color="white" /> : (
                <FlatList
                    data={quizzes}
                    keyExtractor={(item) => (item.id || item._id).toString()}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <Text style={styles.cardSubInfo}>{item.subject} • {item.grade}. Sinif</Text>
                                </View>
                                <View style={[styles.badge, item.type === 'game' ? styles.badgeGame : styles.badgeExam]}>
                                    <Text style={styles.badgeText}>{item.type === 'game' ? 'Oyun' : 'İmtahan'}</Text>
                                </View>
                            </View>

                            <Text style={styles.cardInfo} numberOfLines={2}>{item.description}</Text>

                            <View style={styles.actionRow}>
                                {item.type === 'game' && (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: '#ff9800' }]}
                                        onPress={() => startLiveGame(item.id || item._id)}
                                    >
                                        <Text style={styles.actionBtnText}>▶ Başlat</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#4a148c' }]}
                                    onPress={() => navigation.navigate('QuizResults', { quizId: item.id || item._id, quizTitle: item.title })}
                                >
                                    <Text style={styles.actionBtnText}>📊 Nəticələr</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#ef5350' }]}
                                    onPress={() => deleteQuiz(item.id || item._id)}
                                >
                                    <Text style={styles.actionBtnText}>🗑️</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    contentContainerStyle={{ paddingBottom: 50 }}
                />
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 50 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    welcomeText: { fontSize: 22, color: 'white', fontWeight: 'bold' },
    logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 10 },
    logoutText: { color: 'white', fontWeight: 'bold' },

    createBtn: { marginBottom: 20, elevation: 8, borderRadius: 15, overflow: 'hidden' },
    createBtnGradient: { padding: 18, alignItems: 'center' },
    createBtnText: { color: '#4a148c', fontSize: 18, fontWeight: 'bold' },

    searchBar: { marginBottom: 20 },
    searchInput: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 12, color: 'white', fontSize: 16 },

    card: { backgroundColor: 'white', borderRadius: 20, padding: 18, marginBottom: 15, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    cardSubInfo: { color: '#888', fontSize: 12, marginTop: 2 },

    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeGame: { backgroundColor: '#f3e5f5' },
    badgeExam: { backgroundColor: '#e8eaf6' },
    badgeText: { fontSize: 11, fontWeight: 'bold', color: '#4a148c' },

    cardInfo: { color: '#666', fontSize: 13, marginBottom: 15, lineHeight: 18 },

    actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
    actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginHorizontal: 4 },
    actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 }
});
