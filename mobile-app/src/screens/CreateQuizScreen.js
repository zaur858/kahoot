import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function CreateQuizScreen({ navigation, route }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('Riyaziyyat');
    const [grade, setGrade] = useState('5');
    const [type, setType] = useState('exam'); // 'exam' or 'game'
    const [questions, setQuestions] = useState([]);
    const [showGraphInput, setShowGraphInput] = useState(false);
    const [graphFunc, setGraphFunc] = useState('');

    const [currentQ, setCurrentQ] = useState({
        text: '',
        questionType: 'choice', // 'choice' or 'classic'
        options: ['', '', '', ''],
        correctIndex: 0,
        correctAnswer: '',
        imageUrl: null
    });

    const [user, setUser] = useState(route.params?.user || null);

    useEffect(() => {
        if (!user) {
            AsyncStorage.getItem('user').then(data => {
                if (data) setUser(JSON.parse(data));
            });
        }
    }, []);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
            base64: true
        });
        if (!result.canceled) {
            setCurrentQ({ ...currentQ, imageUrl: `data:image/jpeg;base64,${result.assets[0].base64}` });
        }
    };

    const generateGraph = () => {
        try {
            if (!graphFunc) return Alert.alert('Xəta', 'Funksiyanı daxil edin');

            let processed = graphFunc.toLowerCase()
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/abs/g, 'Math.abs')
                .replace(/pi/g, 'Math.PI')
                .replace(/(\d)x/g, '$1*x')
                .replace(/\^/g, '**');

            const evalFunc = new Function('x', `try { return ${processed}; } catch(e) { return null; }`);

            const dataPoints = [];
            for (let x = -10; x <= 10; x += 0.2) {
                const y = evalFunc(x);
                if (y !== null && isFinite(y)) {
                    dataPoints.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
                }
            }

            const chartConfig = {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: `y = ${graphFunc}`,
                        data: dataPoints,
                        showLine: true,
                        fill: false,
                        borderColor: '#4a148c',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4
                    }]
                },
                options: {
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'center',
                            min: -10,
                            max: 10,
                            grid: { color: 'rgba(0,0,0,0.1)' }
                        },
                        y: {
                            type: 'linear',
                            position: 'center',
                            min: -10,
                            max: 10,
                            grid: { color: 'rgba(0,0,0,0.1)' }
                        }
                    }
                }
            };

            const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=600&height=500&backgroundColor=white&version=3`;
            setCurrentQ({ ...currentQ, imageUrl: chartUrl, questionType: 'choice' });
            setShowGraphInput(false);
            setGraphFunc('');
            Alert.alert('Uğurlu', 'Koordinat oxları "+" şəklində olan qrafik yaradıldı!');
        } catch (e) {
            Alert.alert('Xəta', 'Düstur səhvdir. (Örnək: x**2, sin(x))');
        }
    };

    const addScript = (targetField, scriptType) => {
        const superMap = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
        const subMap = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '⁷', '8': '₈', '9': '₉' };

        Alert.alert(
            "Riyazi Simvol",
            "Üst/Alt rəqəmi seçin:",
            [..."0123"].map(num => ({
                text: num,
                onPress: () => {
                    const char = scriptType === 'super' ? superMap[num] : subMap[num];
                    if (targetField === 'text') setCurrentQ(prev => ({ ...prev, text: prev.text + char }));
                    else setCurrentQ(prev => ({ ...prev, correctAnswer: prev.correctAnswer + char }));
                }
            })).concat([{ text: "Bağla", style: "cancel" }])
        );
    };

    const addQuestion = () => {
        if (!currentQ.text) return Alert.alert('Xəta', 'Sual mətni daxil edin');
        setQuestions([...questions, currentQ]);
        setCurrentQ({
            text: '',
            questionType: 'choice',
            options: ['', '', '', ''],
            correctIndex: 0,
            correctAnswer: '',
            imageUrl: null
        });
    };

    const saveQuiz = async () => {
        try {
            const teacherId = user?._id || user?.id;

            if (!teacherId || teacherId === 'admin') {
                Alert.alert('Xəta', 'Müəllim məlumatı tapılmadı və ya Admin olaraq imtahan yaradıla bilməz.');
                return;
            }

            console.log('Saving quiz:', { title, type, questionsCount: questions.length });
            await api.post('/quizzes', { title, description, subject, grade, type, questions, teacherId });
            Alert.alert('Uğurlu', `${type === 'exam' ? 'İmtahan' : 'Oyun'} uğurla yaradıldı!`);
            navigation.goBack();
        } catch (err) {
            console.error('Quiz save error:', err.response?.data || err.message);
            Alert.alert('Xəta', 'İmtahan yadda saxlanılmadı: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>İmtahan Yarat</Text>

            <Text style={styles.label}>İmtahan Tipi:</Text>
            <View style={styles.row}>
                <TouchableOpacity
                    style={[styles.typeBtn, type === 'exam' && styles.typeBtnActive]}
                    onPress={() => setType('exam')}
                >
                    <Text style={[styles.typeText, type === 'exam' && styles.typeTextActive]}>📝 İmtahan (Dərs)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.typeBtn, type === 'game' && styles.typeBtnActive]}
                    onPress={() => setType('game')}
                >
                    <Text style={[styles.typeText, type === 'game' && styles.typeTextActive]}>🎮 Oyun (Canlı)</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
                {type === 'exam' ? 'Məktəblilər bu imtahanı istədikləri vaxt həll edə biləcəklər.' : 'Bu imtahan yalnız siz Canlı Oyun başlatdıqda oynanılacaq.'}
            </Text>

            <TextInput placeholder="İmtahan Başlığı" value={title} onChangeText={setTitle} style={styles.input} />
            <TextInput placeholder="Fənn (Məs: Riyaziyyat)" value={subject} onChangeText={setSubject} style={styles.input} />
            <TextInput placeholder="Sinif (Məs: 5)" value={grade} onChangeText={setGrade} keyboardType="numeric" style={styles.input} />

            <View style={styles.typeRow}>
                <TouchableOpacity
                    style={[styles.smallTypeBtn, currentQ.questionType === 'choice' && styles.typeBtnActive]}
                    onPress={() => setCurrentQ({ ...currentQ, questionType: 'choice' })}
                >
                    <Text style={[styles.smallTypeText, currentQ.questionType === 'choice' && styles.typeTextActive]}>Şıqlı</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.smallTypeBtn, currentQ.questionType === 'classic' && styles.typeBtnActive]}
                    onPress={() => setCurrentQ({ ...currentQ, questionType: 'classic' })}
                >
                    <Text style={[styles.smallTypeText, currentQ.questionType === 'classic' && styles.typeTextActive]}>Klassik</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.mediaRow}>
                <TouchableOpacity style={styles.mediaBtn} onPress={pickImage}>
                    <Text style={styles.mediaBtnText}>📷 Şəkil</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaBtn} onPress={() => setShowGraphInput(!showGraphInput)}>
                    <Text style={styles.mediaBtnText}>📈 Qrafik</Text>
                </TouchableOpacity>
            </View>

            {showGraphInput && (
                <View style={styles.graphInputContainer}>
                    <TextInput
                        placeholder="Məsələn: x*x + 2*x"
                        value={graphFunc}
                        onChangeText={setGraphFunc}
                        style={styles.graphInput}
                    />
                    <TouchableOpacity style={styles.graphExecBtn} onPress={generateGraph}>
                        <Text style={styles.graphExecText}>Çək</Text>
                    </TouchableOpacity>
                </View>
            )}

            {currentQ.imageUrl && <Image source={{ uri: currentQ.imageUrl }} style={styles.previewImage} resizeMode="contain" />}

            <View style={styles.mathHelper}>
                <TouchableOpacity style={styles.mathBtn} onPress={() => addScript('text', 'super')}><Text style={{ fontSize: 10 }}>xⁿ (Üst)</Text></TouchableOpacity>
                <TouchableOpacity style={styles.mathBtn} onPress={() => addScript('text', 'sub')}><Text style={{ fontSize: 10 }}>xₙ (Alt)</Text></TouchableOpacity>
                <TouchableOpacity style={styles.mathBtn} onPress={() => setCurrentQ({ ...currentQ, text: currentQ.text + '√' })}><Text>√</Text></TouchableOpacity>
                <TouchableOpacity style={styles.mathBtn} onPress={() => setCurrentQ({ ...currentQ, text: currentQ.text + 'π' })}><Text>π</Text></TouchableOpacity>
                <TouchableOpacity style={styles.mathBtn} onPress={() => setCurrentQ({ ...currentQ, text: currentQ.text + '≠' })}><Text>≠</Text></TouchableOpacity>
                <TouchableOpacity style={styles.mathBtn} onPress={() => setCurrentQ({ ...currentQ, text: currentQ.text + '≈' })}><Text>≈</Text></TouchableOpacity>
            </View>
            <TextInput
                placeholder="Sual Mətni..."
                value={currentQ.text}
                onChangeText={(t) => setCurrentQ({ ...currentQ, text: t })}
                style={[styles.input, { height: 80 }]}
                multiline
            />

            {currentQ.questionType === 'choice' ? (
                <>
                    {currentQ.options.map((opt, idx) => (
                        <TextInput
                            key={idx}
                            placeholder={`Variant ${idx + 1}`}
                            value={opt}
                            onChangeText={(t) => {
                                const newOpts = [...currentQ.options];
                                newOpts[idx] = t;
                                setCurrentQ({ ...currentQ, options: newOpts });
                            }}
                            style={styles.inputSmall}
                        />
                    ))}
                    <TextInput
                        placeholder="Doğru Cavab İndeksi (0-3)"
                        value={String(currentQ.correctIndex)}
                        onChangeText={(t) => setCurrentQ({ ...currentQ, correctIndex: parseInt(t) || 0 })}
                        keyboardType="numeric"
                        style={styles.inputSmall}
                    />
                </>
            ) : (
                <>
                    <View style={styles.mathHelper}>
                        <TouchableOpacity style={styles.mathBtn} onPress={() => addScript('correctAnswer', 'super')}><Text style={{ fontSize: 10 }}>xⁿ</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.mathBtn} onPress={() => addScript('correctAnswer', 'sub')}><Text style={{ fontSize: 10 }}>xₙ</Text></TouchableOpacity>
                    </View>
                    <TextInput
                        placeholder="Doğru cavabı daxil edin..."
                        value={currentQ.correctAnswer}
                        onChangeText={(t) => setCurrentQ({ ...currentQ, correctAnswer: t })}
                        style={styles.input}
                    />
                </>
            )}

            <TouchableOpacity style={styles.addBtn} onPress={addQuestion}>
                <Text style={styles.addBtnText}>+ Sualı Əlavə Et</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 20, marginBottom: 40 }}>
                <Text style={{ textAlign: 'center', marginBottom: 10 }}>Cəmi Suallar: {questions.length}</Text>
                <TouchableOpacity style={styles.saveBtn} onPress={saveQuiz}>
                    <Text style={styles.saveBtnText}>💾 İmtahanı Yadda Saxla</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#4a148c', textAlign: 'center' },
    label: { fontWeight: 'bold', marginTop: 10, marginBottom: 5, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 10, borderRadius: 8, fontSize: 16 },
    inputSmall: { borderWidth: 1, borderColor: '#eee', padding: 10, marginBottom: 5, borderRadius: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    typeBtn: { flex: 1, padding: 15, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
    typeBtnActive: { backgroundColor: '#4a148c', borderColor: '#4a148c' },
    typeText: { fontSize: 16, fontWeight: 'bold', color: '#666' },
    typeTextActive: { color: 'white' },
    helperText: { fontSize: 12, color: 'gray', marginBottom: 15, textAlign: 'center', fontStyle: 'italic' },
    typeRow: { flexDirection: 'row', marginBottom: 15 },
    smallTypeBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center', marginHorizontal: 2 },
    smallTypeText: { fontWeight: 'bold', color: '#666' },
    mediaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    mediaBtn: { flex: 0.48, backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, alignItems: 'center' },
    mediaBtnText: { color: '#4a148c', fontWeight: 'bold' },
    previewImage: { width: '100%', height: 180, borderRadius: 10, marginBottom: 10, backgroundColor: 'white' },
    graphInputContainer: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
    graphInput: { flex: 1, borderWidth: 1, borderColor: '#4a148c', padding: 10, borderRadius: 8, marginRight: 10 },
    graphExecBtn: { backgroundColor: '#4a148c', padding: 12, borderRadius: 8 },
    graphExecText: { color: 'white', fontWeight: 'bold' },
    mathHelper: { flexDirection: 'row', marginBottom: 5, backgroundColor: '#f0f0f0', borderRadius: 8, padding: 5, flexWrap: 'wrap' },
    mathBtn: { padding: 6, backgroundColor: 'white', borderRadius: 4, marginRight: 5, marginBottom: 5, minWidth: 35, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
    addBtn: { backgroundColor: '#e1bee7', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    addBtnText: { color: '#4a148c', fontWeight: 'bold', fontSize: 16 },
    saveBtn: { backgroundColor: '#4a148c', padding: 15, borderRadius: 10, alignItems: 'center' },
    saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});
