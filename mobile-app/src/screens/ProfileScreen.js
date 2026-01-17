import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, FlatList, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function ProfileScreen({ navigation, route }) {
    const [user, setUser] = useState(route.params?.user || {});
    const [selectedExam, setSelectedExam] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    // Mock Data if not present
    const badges = user.badges || [];
    const examResults = user.examResults || [];
    const averageScore = user.averageScore || 0;
    const currentLevel = user.level || 1;
    const currentXP = user.totalXP || 0;
    const xpProgress = currentXP % 1000; // Assuming 1000 XP per level
    const xpPercent = xpProgress / 10; // (xpProgress / 1000) * 100

    // Subject Performance for Radar Chart
    const getSubjectAverages = () => {
        const subjects = {};
        examResults.forEach(r => {
            if (!subjects[r.subject]) subjects[r.subject] = { total: 0, count: 0 };
            subjects[r.subject].total += Number(r.score);
            subjects[r.subject].count += 1;
        });
        const labels = Object.keys(subjects);
        const data = labels.map(l => Math.round(subjects[l].total / subjects[l].count));
        return { labels, data };
    };

    const { labels, data } = getSubjectAverages();
    const radarChartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({
        type: 'radar',
        data: {
            labels: labels.length > 0 ? labels : ['Məlumat yoxdur'],
            datasets: [{
                label: 'Fənn üzrə Nailiyyət',
                data: data.length > 0 ? data : [0],
                backgroundColor: 'rgba(74, 20, 140, 0.2)',
                borderColor: 'rgb(74, 20, 140)',
                pointBackgroundColor: 'rgb(74, 20, 140)',
            }]
        },
        options: {
            scale: {
                ticks: { beginAtZero: true, max: 100, stepSize: 20 }
            },
            legend: { display: false }
        }
    }))}`;

    useEffect(() => {
        const loadUser = async () => {
            let currentUser = user;
            if (!currentUser.id && !currentUser._id) {
                const saved = await AsyncStorage.getItem('user');
                if (saved) {
                    currentUser = JSON.parse(saved);
                    setUser(currentUser);
                }
            }
            if (currentUser.id || currentUser._id) {
                refreshProfile(currentUser);
            }
        };
        loadUser();
    }, []);

    const refreshProfile = async (currentUser = user) => {
        try {
            const userId = currentUser.id || currentUser._id;
            if (userId) {
                const res = await api.get(`/auth/user/${userId}`);
                setUser(res.data);
            }
        } catch (err) {
            console.log("Could not refresh profile", err);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].base64);
        }
    };

    const uploadImage = async (base64) => {
        try {
            const avatarData = `data:image/jpeg;base64,${base64}`;
            await api.post('/auth/update-profile', { userId: user._id || user.id, avatar: avatarData });
            Alert.alert('Uğurlu', 'Profil şəkli yeniləndi!');
            refreshProfile();
        } catch (err) {
            Alert.alert('Xəta', 'Şəkil yüklənə bilmədi');
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('user');
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    // Compact Info Header
    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                {user.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                    <LinearGradient colors={['#ff9a9e', '#fad0c4']} style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{user.username?.charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                )}
                <View style={styles.editIcon}>
                    <Text style={{ fontSize: 12 }}>📷</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.headerInfo}>
                <Text style={styles.username}>{user.username}</Text>
                <Text style={styles.email}>{user.email}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{user.role === 'student' ? 'Məktəbli' : 'Müəllim'}</Text>
                </View>
            </View>
        </View>
    );

    // Gamification Section
    const renderStats = () => (
        <View style={styles.statsWrapper}>
            <View style={styles.streakCard}>
                <LinearGradient colors={['#FF512F', '#DD2476']} style={styles.streakGradient}>
                    <Text style={styles.streakEmoji}>🔥</Text>
                    <View>
                        <Text style={styles.streakCountText}>{user.streakCount || 1} GÜN</Text>
                        <Text style={styles.streakLabelText}>Davamlılıq Seriyası</Text>
                    </View>
                </LinearGradient>
            </View>

            <View style={styles.levelRow}>
                <View style={styles.levelBadge}>
                    <Text style={styles.levelNum}>{currentLevel}</Text>
                    <Text style={styles.levelLabel}>SEVİYYƏ</Text>
                </View>
                <View style={styles.xpContainer}>
                    <View style={styles.xpHeader}>
                        <Text style={styles.xpText}>{currentXP} XP</Text>
                        <Text style={styles.xpToNext}>{1000 - xpProgress} XP sonrakı səviyyəyə</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${xpPercent}%` }]} />
                    </View>
                </View>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{averageScore}</Text>
                    <Text style={styles.statLabel}>Ortalama</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{examResults.length}</Text>
                    <Text style={styles.statLabel}>İmtahan</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{badges.length}</Text>
                    <Text style={styles.statLabel}>Rozet</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.dailyRewardBtn} onPress={() => Alert.alert("Təbriklər!", "Gündəlik bonus olaraq +50 XP qazandınız! 🎁")}>
                <Text style={styles.dailyRewardText}>🎁 Gündəlik Bonusunu Al</Text>
            </TouchableOpacity>
        </View>
    );

    const renderRadar = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fənn Analitikası 🎯</Text>
            {labels.length > 0 ? (
                <View style={styles.chartContainer}>
                    <Image source={{ uri: radarChartUrl }} style={styles.radarImage} resizeMode="contain" />
                    <View style={styles.analysisBox}>
                        <Text style={styles.analysisText}>
                            {data[data.indexOf(Math.min(...data))] < 50
                                ? `💡 Məsləhət: ${labels[data.indexOf(Math.min(...data))]} fənninə daha çox vaxt ayır.`
                                : "🚀 Əla! Bütün fənlərdə nəticələriniz stabil və yaxşıdır."}
                        </Text>
                    </View>
                </View>
            ) : (
                <Text style={styles.emptyText}>Analitika üçün ən azı bir imtahan nəticəsi lazımdır.</Text>
            )}
        </View>
    );

    // Badges List
    const renderBadges = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Qazanılan Mükafatlar 🏆</Text>
            {badges.length === 0 ? (
                <Text style={styles.emptyText}>Hələ heç bir rozet qazanılmayıb. Çalışmağa davam!</Text>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                    {badges.map((badge, index) => (
                        <View key={index} style={styles.badgeItem}>
                            <Text style={{ fontSize: 30 }}>{badge.split(' ')[0]}</Text>
                            <Text style={styles.badgeName}>{badge.substring(2)}</Text>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );

    // Exam Results List
    const renderExams = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Akademik Nəticələr 📊</Text>
            {examResults.length === 0 ? (
                <Text style={styles.emptyText}>Hələ heç bir imtahana girilməyib.</Text>
            ) : (
                examResults.map((exam, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.examItem}
                        onPress={() => {
                            setSelectedExam(exam);
                            setModalVisible(true);
                        }}
                    >
                        <View>
                            <Text style={styles.examTitle}>{exam.title}</Text>
                            <Text style={styles.examDate}>{new Date(exam.date).toLocaleDateString()} {new Date(exam.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                        <View style={[styles.scoreBadge, { backgroundColor: exam.score >= 50 ? '#c8e6c9' : '#ffcdd2' }]}>
                            <Text style={[styles.scoreText, { color: exam.score >= 50 ? '#2e7d32' : '#c62828' }]}>
                                {exam.score}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))
            )}
        </View>
    );

    return (
        <LinearGradient colors={['#f3e5f5', '#fff']} style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {renderHeader()}
                {renderStats()}
                {renderRadar()}
                {renderBadges()}
                {renderExams()}

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Çıxış Et</Text>
                </TouchableOpacity>

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{selectedExam?.title}</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Text style={styles.closeBtn}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.modalBody}>
                                {selectedExam?.details && selectedExam.details.length > 0 ? (
                                    selectedExam.details.map((detail, idx) => (
                                        <View key={idx} style={styles.reviewItem}>
                                            <Text style={styles.reviewQ}>{idx + 1}. {detail.question}</Text>
                                            <Text style={[styles.reviewA, { color: detail.isCorrect ? '#2e7d32' : '#c62828' }]}>
                                                Sizin cavab: {detail.userAnswer} {detail.isCorrect ? '✅' : '❌'}
                                            </Text>
                                            {!detail.isCorrect && (
                                                <Text style={styles.correctA}>Doğru cavab: {detail.correctAnswer}</Text>
                                            )}
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptyText}>Bu imtahan üçün ətraflı məlumat yoxdur.</Text>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 25, paddingTop: 50, backgroundColor: 'white', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1 },
    avatarContainer: { marginRight: 20 },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
    avatarImage: { width: 80, height: 80, borderRadius: 40 },
    avatarText: { fontSize: 30, color: 'white', fontWeight: 'bold' },
    editIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 10, padding: 3, elevation: 2 },
    headerInfo: { flex: 1 },
    username: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    email: { fontSize: 14, color: 'gray', marginBottom: 5 },
    roleBadge: { backgroundColor: '#e1bee7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
    roleText: { color: '#4a148c', fontSize: 12, fontWeight: 'bold' },

    statsWrapper: { margin: 20 },
    levelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: 'white', padding: 15, borderRadius: 20, elevation: 3 },
    levelBadge: { width: 60, height: 60, borderRadius: 15, backgroundColor: '#4a148c', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    levelNum: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    levelLabel: { fontSize: 8, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' },
    xpContainer: { flex: 1 },
    xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    xpText: { fontWeight: 'bold', color: '#4a148c' },
    xpToNext: { fontSize: 10, color: 'gray' },
    progressBarBg: { height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#4a148c' },

    statsContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, backgroundColor: 'white', borderRadius: 20, elevation: 3 },
    statBox: { alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#4a148c' },
    statLabel: { fontSize: 12, color: 'gray' },
    statDivider: { width: 1, backgroundColor: '#eee' },

    section: { marginTop: 20, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    chartContainer: { backgroundColor: 'white', borderRadius: 20, padding: 15, elevation: 2, alignItems: 'center' },
    radarImage: { width: '100%', height: 250 },
    analysisBox: { marginTop: 15, padding: 10, backgroundColor: '#f3e5f5', borderRadius: 10, width: '100%' },
    analysisText: { fontSize: 13, color: '#4a148c', fontStyle: 'italic', textAlign: 'center' },

    emptyText: { color: 'gray', fontStyle: 'italic', fontSize: 12, textAlign: 'center', marginTop: 10 },

    badgeItem: { alignItems: 'center', marginRight: 15, backgroundColor: 'white', padding: 10, borderRadius: 12, elevation: 2, minWidth: 80 },
    badgeName: { fontSize: 10, fontWeight: 'bold', marginTop: 5, color: '#555' },

    examItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, marginBottom: 10, borderRadius: 12, elevation: 1 },
    examTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    examDate: { fontSize: 12, color: 'gray' },
    scoreBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    scoreText: { fontWeight: 'bold' },

    logoutBtn: { backgroundColor: '#ff5252', padding: 15, borderRadius: 15, margin: 20, alignItems: 'center', elevation: 3, marginTop: 40 },
    logoutText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    streakCard: { marginBottom: 15, borderRadius: 20, overflow: 'hidden', elevation: 5 },
    streakGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    streakEmoji: { fontSize: 40, marginRight: 15 },
    streakCountText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    streakLabelText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 'bold' },

    dailyRewardBtn: { backgroundColor: '#FFD700', padding: 15, borderRadius: 15, marginTop: 15, alignItems: 'center', elevation: 3 },
    dailyRewardText: { color: '#4a148c', fontWeight: 'bold', fontSize: 16 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '80%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#4a148c' },
    closeBtn: { fontSize: 24, color: '#999', padding: 5 },
    modalBody: { flex: 1 },
    reviewItem: { marginBottom: 20, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 10 },
    reviewQ: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    reviewA: { fontSize: 14, fontWeight: 'bold' },
    correctA: { fontSize: 14, color: '#2e7d32', marginTop: 3, fontStyle: 'italic' }
});
