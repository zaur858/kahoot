import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

export default function QuizResultsScreen({ route, navigation }) {
    const { quizId, quizTitle } = route.params;
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedResult, setSelectedResult] = useState(null);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const res = await api.get(`/quizzes/${quizId}/results`);
            console.log('FrontEnd: Results fetched:', res.data.length, 'records. Sample ID:', res.data[0]?.studentId);
            setResults(res.data);
        } catch (err) {
            console.error('FrontEnd: Fetch results error:', err);
        } finally {
            setLoading(false);
        }
    };

    const awardBadge = async (userId, badgeType) => {
        console.log('FrontEnd: Awarding badge - UserID:', userId, 'Type:', badgeType);
        if (!userId) {
            Alert.alert('Xəta', 'Şagird ID-si tapılmadı. Zəhmət olmasa tətbiqi yeniləyin.');
            return;
        }

        try {
            const res = await api.post('/auth/award-badge', { userId, badgeType });
            console.log('FrontEnd: Award badge success:', res.data);
            Alert.alert('Uğurlu', res.data.message || 'Rozet başarıyla verildi!');
        } catch (err) {
            console.error('FrontEnd: Award badge error:', err.response?.data || err.message);
            Alert.alert('Xəta', err.response?.data?.message || 'Rozet verilərkən şəbəkə xətası baş verdi.');
        }
    };

    const renderResultItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => setSelectedResult(item)}>
            <View style={styles.cardHeader}>
                <Text style={styles.studentName}>{item.studentName}</Text>
                <Text style={[styles.score, { color: item.score >= 50 ? '#4caf50' : '#f44336' }]}>
                    {item.score}%
                </Text>
            </View>
            <Text style={styles.date}>{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}</Text>
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={['#4a148c', '#7b1fa2']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>⬅ Geri</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{quizTitle}</Text>
                <Text style={styles.subtitle}>Nəticələr</Text>
            </View>

            {loading ? <ActivityIndicator size="large" color="white" /> : (
                <FlatList
                    data={results}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderResultItem}
                    ListEmptyComponent={<Text style={styles.emptyText}>Hələ heç bir nəticə yoxdur.</Text>}
                />
            )}

            <Modal visible={!!selectedResult} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{selectedResult?.studentName} - Detallı Baxış</Text>
                        <ScrollView style={{ maxHeight: 400 }}>
                            {selectedResult?.details?.map((q, idx) => (
                                <View key={idx} style={styles.detailItem}>
                                    <Text style={styles.questionText}>{idx + 1}. {q.question || q.questionTitle}</Text>
                                    <Text style={styles.answerText}>
                                        Məktəblinin cavabı: <Text style={{ fontWeight: 'bold', color: q.isCorrect ? '#4caf50' : '#f44336' }}>{q.userAnswer}</Text>
                                    </Text>
                                    {!q.isCorrect && <Text style={styles.correctText}>Doğru cavab: {q.correctAnswer}</Text>}
                                </View>
                            ))}

                            <View style={styles.badgeSection}>
                                <Text style={styles.badgeLabel}>Rozet Ver:</Text>
                                <View style={styles.badgeRow}>
                                    <TouchableOpacity style={styles.badgeBtn} onPress={() => awardBadge(selectedResult.studentId || selectedResult.id || selectedResult._id, 'çalışqan')}>
                                        <Text style={styles.badgeBtnText}>🥉 Çalışqan</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.badgeBtn} onPress={() => awardBadge(selectedResult.studentId || selectedResult.id || selectedResult._id, 'savadlı')}>
                                        <Text style={styles.badgeBtnText}>🥈 Savadlı</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.badgeBtn} onPress={() => awardBadge(selectedResult.studentId || selectedResult.id || selectedResult._id, 'dahi')}>
                                        <Text style={styles.badgeBtnText}>🥇 Dahi</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>

                        <TouchableOpacity onPress={() => setSelectedResult(null)} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>Bağla</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 40 },
    header: { marginBottom: 20 },
    backBtn: { marginBottom: 10 },
    backText: { color: 'white', fontSize: 16 },
    title: { fontSize: 24, color: 'white', fontWeight: 'bold' },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)' },
    card: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    studentName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    score: { fontSize: 20, fontWeight: 'bold' },
    date: { color: '#888', fontSize: 12, marginTop: 5 },
    emptyText: { color: 'white', textAlign: 'center', marginTop: 50, fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: 'white', width: '90%', maxHeight: '80%', borderRadius: 20, padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#4a148c' },
    detailItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    questionText: { fontWeight: 'bold', marginBottom: 5 },
    answerText: { marginBottom: 3 },
    correctText: { color: '#4caf50', fontStyle: 'italic' },
    closeBtn: { backgroundColor: '#4a148c', padding: 15, borderRadius: 12, marginTop: 20, alignItems: 'center' },
    closeBtnText: { color: 'white', fontWeight: 'bold' },
    badgeSection: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
    badgeLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    badgeRow: { flexDirection: 'row', justifyContent: 'space-between' },
    badgeBtn: { backgroundColor: '#f3e5f5', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e1bee7', flex: 1, marginHorizontal: 2, alignItems: 'center' },
    badgeBtnText: { fontSize: 13, fontWeight: 'bold', color: '#4a148c' }
});
