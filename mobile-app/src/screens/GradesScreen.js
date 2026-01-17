import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

export default function GradesScreen({ route, navigation }) {
    const { subject } = route.params;
    const grades = Array.from({ length: 11 }, (_, i) => i + 1);

    const selectGrade = (grade) => {
        navigation.navigate('QuizList', { subject, grade });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>{subject.name}</Text>
            <Text style={styles.subHeader}>Sinif Seçimi</Text>

            <FlatList
                data={grades}
                numColumns={3}
                keyExtractor={(item) => String(item)}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => selectGrade(item)}
                    >
                        <View style={styles.circle}>
                            <Text style={styles.cardText}>{item}</Text>
                        </View>
                        <Text style={styles.classLabel}>Sinif</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 40, backgroundColor: '#fff' },
    header: { fontSize: 30, fontWeight: 'bold', textAlign: 'center', color: '#4a148c' },
    subHeader: { fontSize: 18, textAlign: 'center', marginBottom: 30, color: 'gray' },
    card: { flex: 1, margin: 10, height: 100, alignItems: 'center', justifyContent: 'center' },
    circle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#f3e5f5', justifyContent: 'center', alignItems: 'center', marginBottom: 5, borderWidth: 2, borderColor: '#4a148c' },
    cardText: { fontSize: 28, fontWeight: 'bold', color: '#4a148c' },
    classLabel: { color: '#666', fontSize: 14 }
});
