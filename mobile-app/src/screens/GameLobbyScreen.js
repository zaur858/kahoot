import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { socket } from '../services/socket';

export default function GameLobbyScreen({ route, navigation }) {
    const { isHost, quizId, pin: studentPin, username } = route.params;
    const [players, setPlayers] = useState([]);
    const [pin, setPin] = useState(studentPin || '');

    useEffect(() => {
        socket.connect();

        if (isHost) {
            // Generate random PIN for host
            const newPin = Math.floor(100000 + Math.random() * 900000).toString();
            setPin(newPin);
            socket.emit('join_game', { pin: newPin, username: 'HOST' });
        } else {
            socket.emit('join_game', { pin: studentPin, username });
        }

        socket.on('player_joined', (player) => {
            setPlayers((prev) => [...prev, player]);
        });

        socket.on('game_started', () => {
            navigation.navigate('Game', { isHost, quizId, pin });
        });

        return () => {
            socket.off('player_joined');
            socket.off('game_started');
        };
    }, []);

    const startGame = () => {
        socket.emit('start_game', pin);
        navigation.navigate('Game', { isHost, quizId, pin });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Oyun PIN: {pin}</Text>
            <Text style={styles.subHeader}>{isHost ? 'Oyunçular gözlənilir...' : 'Oyunun başlaması gözlənilir...'}</Text>

            <FlatList
                data={players}
                keyExtractor={(item) => item.socketId}
                renderItem={({ item }) => (
                    <Text style={styles.player}>{item.username}</Text>
                )}
            />

            {isHost && (
                <Button title="Oyunu Başlat" onPress={startGame} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, alignItems: 'center' },
    header: { fontSize: 32, fontWeight: 'bold', marginBottom: 20 },
    subHeader: { fontSize: 18, marginBottom: 20 },
    player: { fontSize: 20, padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee', width: '100%', textAlign: 'center' }
});
