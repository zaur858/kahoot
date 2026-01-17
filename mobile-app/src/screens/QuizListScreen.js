import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../services/api';

export default function QuizListScreen({ route, navigation }) {
    const { subject, grade } = route.params;
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            // Filter by subject, grade AND type='exam'
            const res = await api.get(`/quizzes?subject=${subject.name}&grade=${grade}&type=exam`);
            setQuizzes(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const startQuiz = (quizId) => {
        const user = route.params?.user;
        // Direct navigation to Game Screen for Self-Paced Exams
        navigation.navigate('Game', { quizId, isHost: false, mode: 'solo', user });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>{subject.name} - {grade}. Sinif</Text>

            {loading ? <ActivityIndicator size="large" color="#4a148c" /> : (
                quizzes.length === 0 ? (
                    <Text style={styles.emptyText}>Bu kateqoriyada imtahan tapılmadı.</Text>
                ) : (
                    <FlatList
                        data={quizzes}
                        keyExtractor={(item) => (item.id || item._id).toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.card} onPress={() => startQuiz(item.id || item._id)}>
                                <View style={styles.iconCircle}>
                                    <Text style={styles.iconText}>📝</Text>
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.title}>{item.title}</Text>
                                    <Text style={styles.desc}>{item.description}</Text>
                                    <Text style={styles.info}>{item.questions.length} Sual</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#4a148c', textAlign: 'center' },
    card: { flexDirection: 'row', padding: 15, backgroundColor: 'white', marginBottom: 12, borderRadius: 12, elevation: 2, alignItems: 'center' },
    iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f3e5f5', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    iconText: { fontSize: 24 },
    textContainer: { flex: 1 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    desc: { color: 'gray', marginBottom: 5, fontSize: 14 },
    info: { fontWeight: 'bold', color: '#4a148c', fontSize: 12 },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray', fontStyle: 'italic' }
});
