import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

const SUBJECT_ICONS = {
    'Riyaziyyat': '📐',
    'Azərbaycan Dili': '🇦🇿',
    'İngilis Dili': '🇬🇧',
    'Tarix': '📜',
    'Coğrafiya': '🌍',
    'Biologiya': '🧬',
    'Kimya': '🧪',
    'Fizika': '⚡',
    'Digər': '🎓'
};

const GRADIENTS = [
    ['#8e44ad', '#9b59b6'], ['#2980b9', '#3498db'],
    ['#27ae60', '#2ecc71'], ['#d35400', '#e67e22'],
    ['#c0392b', '#e74c3c'], ['#16a085', '#1abc9c'],
    ['#263238', '#455a64']
];

export default function SubjectsScreen({ navigation }) {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/quizzes/subjects');
            setSubjects(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#f5f5f5', '#ffffff']} style={styles.container}>
            <View style={styles.headerBox}>
                <Text style={styles.header}>Fənnini Seç 🎯</Text>
                <Text style={styles.subHeader}>Öyrənməyə və bal toplamağa başla</Text>
            </View>

            {loading ? <ActivityIndicator size="large" color="#4a148c" style={{ marginTop: 50 }} /> : (
                <FlatList
                    data={subjects}
                    numColumns={2}
                    keyExtractor={(item) => item}
                    contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 50 }}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity
                            style={styles.cardContainer}
                            onPress={() => navigation.navigate('Grades', { subject: { name: item } })}
                        >
                            <LinearGradient
                                colors={GRADIENTS[index % GRADIENTS.length]}
                                style={styles.card}
                            >
                                <Text style={styles.icon}>{SUBJECT_ICONS[item] || '📚'}</Text>
                                <Text style={styles.cardText}>{item}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                />
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerBox: { padding: 30, paddingTop: 60, alignItems: 'center' },
    header: { fontSize: 32, fontWeight: 'bold', color: '#4a148c' },
    subHeader: { fontSize: 14, color: '#666', marginTop: 5 },

    cardContainer: { flex: 1, margin: 10, height: 160, borderRadius: 25, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
    card: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 25, padding: 15 },
    icon: { fontSize: 40, marginBottom: 10 },
    cardText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }
});
