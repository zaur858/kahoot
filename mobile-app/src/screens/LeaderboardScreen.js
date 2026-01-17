import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

export default function LeaderboardScreen() {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaders();
    }, []);

    const fetchLeaders = async () => {
        try {
            const res = await api.get('/auth/leaderboard');
            setLeaders(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item, index }) => {
        const isTop3 = index < 3;
        return (
            <View style={[styles.card, isTop3 && styles.topCard]}>
                <Text style={[styles.rank, isTop3 && styles.topRank]}>{index + 1}</Text>
                {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: ['#FFD700', '#C0C0C0', '#CD7F32'][index] || '#4a148c' }]}>
                        <Text style={styles.avatarText}>{item.username.charAt(0)}</Text>
                    </View>
                )}
                <View style={styles.info}>
                    <Text style={styles.name}>{item.username}</Text>
                    <Text style={styles.level}>Level {item.level}</Text>
                </View>
                <Text style={styles.xp}>{item.totalXP} XP</Text>
            </View>
        );
    };

    return (
        <LinearGradient colors={['#4a148c', '#1a237e']} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Liderlər Lövhəsi 🏆</Text>
                <Text style={styles.subtitle}>Sənin Rəqiblərin</Text>
            </View>

            {loading ? <ActivityIndicator size="large" color="white" /> : (
                <FlatList
                    data={leaders}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 50 },
    header: { marginBottom: 30, alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', color: 'white' },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)' },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 20, marginBottom: 15, elevation: 3 },
    topCard: { backgroundColor: '#f3e5f5', borderWidth: 1, borderColor: '#ce93d8' },
    rank: { fontSize: 20, fontWeight: 'bold', color: '#999', width: 30 },
    topRank: { color: '#4a148c', fontSize: 24 },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
    avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
    info: { flex: 1 },
    name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    level: { fontSize: 12, color: '#666' },
    xp: { fontSize: 18, fontWeight: 'bold', color: '#4a148c' }
});
