import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function StudentDashboard({ navigation, route }) {
    const [user, setUser] = useState(route.params?.user || {});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        refreshUser();
    }, []);

    const refreshUser = async () => {
        try {
            const userId = user.id || user._id;
            if (userId) {
                const res = await api.get(`/auth/user/${userId}`);
                setUser(res.data);
            }
        } catch (err) {
            console.log(err);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('user');
        navigation.replace('Login');
    };

    const categories = [
        { id: 'live', title: 'Canlı Oyun', icon: '🎮', color: ['#4a148c', '#7b1fa2'], screen: 'GameLobby' },
        { id: 'study', title: 'İmtahanlar', icon: '📚', color: ['#1976d2', '#2196f3'], screen: 'Subjects' },
        { id: 'leaderboard', title: 'Liderlik', icon: '🏆', color: ['#fbc02d', '#f9a825'], screen: 'Liderlik' },
        { id: 'profile', title: 'Profil', icon: '👤', color: ['#43a047', '#66bb6a'], screen: 'Profile' },
    ];

    return (
        <ScrollView style={styles.container}>
            <LinearGradient colors={['#4a148c', '#1a237e']} style={styles.topSection}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Salam,</Text>
                        <Text style={styles.usernameText}>{user.username} 👋</Text>
                    </View>
                    <View style={styles.streakBadge}>
                        <Text style={styles.streakEmoji}>🔥</Text>
                        <Text style={styles.streakText}>{user.streakCount || 1} Gün</Text>
                    </View>
                </View>

                <View style={styles.xpCard}>
                    <View style={styles.xpInfo}>
                        <Text style={styles.levelText}>Səviyyə {user.level || 1}</Text>
                        <Text style={styles.xpTotalText}>{user.totalXP || 0} XP</Text>
                    </View>
                    <View style={styles.progressBg}>
                        <View style={[styles.progressFill, { width: `${(user.totalXP % 1000) / 10}%` }]} />
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Nə etmək istəyirsən?</Text>
                <View style={styles.grid}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={styles.gridItem}
                            onPress={() => navigation.navigate(cat.screen, { user })}
                        >
                            <LinearGradient colors={cat.color} style={styles.iconContainer}>
                                <Text style={styles.catIcon}>{cat.icon}</Text>
                            </LinearGradient>
                            <Text style={styles.catTitle}>{cat.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>🚪 Hesabdan Çıx</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    topSection: { padding: 30, paddingTop: 60, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 10 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    greeting: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
    usernameText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    streakBadge: { backgroundColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
    streakEmoji: { fontSize: 18, marginRight: 5 },
    streakText: { color: 'white', fontWeight: 'bold' },

    xpCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 20 },
    xpInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    levelText: { color: 'white', fontWeight: 'bold' },
    xpTotalText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    progressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#ffeb3b', borderRadius: 4 },

    content: { padding: 25 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridItem: { width: '47%', backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    iconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    catIcon: { fontSize: 28 },
    catTitle: { fontSize: 14, fontWeight: 'bold', color: '#444' },

    logoutBtn: { marginTop: 20, alignItems: 'center', padding: 15 },
    logoutText: { color: '#ef5350', fontWeight: 'bold' }
});
