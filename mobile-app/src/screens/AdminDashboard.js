import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function AdminDashboard({ navigation, route }) {
    const [users, setUsers] = useState([]);
    const [pendingTeachers, setPendingTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'all'
    const currentUser = route.params?.user;

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'pending') {
                const res = await api.get('/auth/pending');
                setPendingTeachers(res.data);
            } else {
                const res = await api.get(`/auth/users?search=${search}`);
                setUsers(res.data);
            }
        } catch (err) {
            Alert.alert('Xəta', 'Məlumat alınamadı');
        } finally {
            setLoading(false);
        }
    };

    const approveUser = async (userId) => {
        console.log('Frontend: Approving user with ID:', userId);
        try {
            const res = await api.post('/auth/approve', { userId });
            console.log('Frontend: Approve response:', res.data);
            Alert.alert('Uğurlu', 'Müəllim təsdiqləndi');
            fetchData();
        } catch (err) {
            console.error('Frontend: Approve error:', err.response?.data || err.message);
            Alert.alert('Xəta', 'Təsdiqləmə uğursuz oldu: ' + (err.response?.data?.message || err.message));
        }
    };

    const deleteUser = (userId, name) => {
        console.log('Frontend: Deleting user:', name, 'ID:', userId);
        Alert.alert(
            'İstifadəçini Sil',
            `${name} adlı istifadəçini silmək istədiyinizə əminsiniz?`,
            [
                { text: 'Xeyr', style: 'cancel' },
                {
                    text: 'Bəli, Sil', style: 'destructive', onPress: async () => {
                        try {
                            const res = await api.delete(`/auth/users/${userId}`);
                            console.log('Frontend: Delete response:', res.data);
                            fetchData();
                        } catch (err) {
                            console.error('Frontend: Delete error:', err.response?.data || err.message);
                            Alert.alert('Xəta', 'Silinmə baş tutmadı: ' + (err.response?.data?.message || err.message));
                        }
                    }
                }
            ]
        );
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('user');
        navigation.replace('Login');
    };

    const renderUser = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.userInfo}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <View style={[styles.badge, { backgroundColor: item.role === 'teacher' ? '#e8eaf6' : '#e0f2f1' }]}>
                    <Text style={[styles.role, { color: item.role === 'teacher' ? '#3f51b5' : '#00796b' }]}>
                        {item.role === 'teacher' ? 'Müəllim' : item.role === 'admin' ? 'Admin' : 'Məktəbli'}
                    </Text>
                </View>
            </View>
            <View style={styles.actions}>
                {activeTab === 'pending' ? (
                    <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => {
                            const id = item.id || item._id;
                            console.log('Approve requested for:', id);
                            if (!id) {
                                Alert.alert('Xəta', 'İstifadəçi ID-si tapılmadı! (Məlumat tam deyil)');
                                return;
                            }
                            approveUser(id);
                        }}
                    >
                        <Text style={styles.btnText}>Təsdiqlə</Text>
                    </TouchableOpacity>
                ) : (
                    item.role !== 'admin' && (
                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => {
                                const id = item.id || item._id;
                                console.log('Delete requested for:', id);
                                if (!id) {
                                    Alert.alert('Xəta', 'İstifadəçi ID-si tapılmadı! (Məlumat tam deyil)');
                                    return;
                                }
                                deleteUser(id, item.username);
                            }}
                        >
                            <Text style={styles.btnText}>Sil</Text>
                        </TouchableOpacity>
                    )
                )}
            </View>
        </View>
    );

    return (
        <LinearGradient colors={['#0d47a1', '#1565c0']} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Admin Paneli 🛡️</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Çıxış</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                    onPress={() => setActiveTab('pending')}
                >
                    <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Təsdiq Gözləyənlər</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                    onPress={() => setActiveTab('all')}
                >
                    <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>İstifadəçilər</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'all' && (
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="İstifadəçi axtar..."
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={fetchData}
                    />
                </View>
            )}

            <View style={styles.content}>
                {loading ? <ActivityIndicator size="large" color="white" style={{ marginTop: 50 }} /> : (
                    <FlatList
                        data={activeTab === 'pending' ? pendingTeachers : users}
                        keyExtractor={(item) => (item.id || item._id).toString()}
                        renderItem={renderUser}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>Tapılmadı.</Text>
                        }
                        contentContainerStyle={{ paddingBottom: 50 }}
                    />
                )}
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 50 },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
    logoutText: { color: 'white', fontWeight: 'bold' },

    tabBar: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    activeTab: { backgroundColor: 'white' },
    tabText: { color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' },
    activeTabText: { color: '#0d47a1' },

    searchContainer: { marginHorizontal: 20, marginBottom: 15 },
    searchInput: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, color: 'white', fontSize: 16 },

    content: { flex: 1, backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
    card: { flexDirection: 'row', backgroundColor: '#f8f9fa', borderRadius: 15, padding: 15, marginBottom: 15, alignItems: 'center', elevation: 2 },
    userInfo: { flex: 1 },
    username: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    email: { fontSize: 13, color: '#666', marginTop: 2 },
    badge: { alignSelf: 'flex-start', marginTop: 5, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    role: { fontSize: 11, fontWeight: 'bold' },

    actions: { marginLeft: 10 },
    approveBtn: { backgroundColor: '#4caf50', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
    deleteBtn: { backgroundColor: '#ef5350', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },

    emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontStyle: 'italic' }
});
