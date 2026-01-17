import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, Image, Button } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import socket from '../services/socket';
import api from '../services/api';

export default function GameScreen({ route, navigation }) {
    const { quizId, pin, isHost, mode } = route.params;
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isFinished, setIsFinished] = useState(false);
    const [gameUser, setGameUser] = useState(route.params?.user || null);
    const [classicAnswer, setClassicAnswer] = useState('');
    const [quizTitle, setQuizTitle] = useState('');
    const [quizSubject, setQuizSubject] = useState('');
    const [examDetails, setExamDetails] = useState([]); // Track results per question

    useEffect(() => {
        if (!gameUser) {
            AsyncStorage.getItem('user').then(data => {
                if (data) setGameUser(JSON.parse(data));
            });
        }
        fetchQuiz();
    }, []);

    const fetchQuiz = async () => {
        console.log('GameScreen: Fetching quiz with ID:', quizId);
        try {
            const res = await api.get(`/quizzes/${quizId}`);
            console.log('GameScreen: Quiz Data Received:', {
                id: res.data.id,
                title: res.data.title,
                questionsCount: res.data.questions?.length,
                questions: res.data.questions
            });

            if (!res.data.questions || res.data.questions.length === 0) {
                console.warn('GameScreen: Quiz has no questions!');
                Alert.alert('Xəta', 'Bu imtahanda sual yoxdur.');
                navigation.goBack();
                return;
            }

            setQuestions(res.data.questions);
            setQuizTitle(res.data.title);
            setQuizSubject(res.data.subject);
        } catch (err) {
            console.error('GameScreen: Fetch Error:', err.response?.data || err.message);
            Alert.alert('Xəta', 'İmtahan yüklənərkən xəta baş verdi: ' + (err.response?.data?.message || err.message), [
                { text: 'Geri Qayıt', onPress: () => navigation.goBack() }
            ]);
        }
    };

    // Timer logic
    useEffect(() => {
        if (isFinished || questions.length === 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [currentQuestionIndex, isFinished, questions]);

    const handleAnswer = (index) => {
        if (isFinished) return;

        if (mode === 'solo') {
            const currentQ = questions[currentQuestionIndex];
            const isCorrect = index === currentQ.correctIndex;
            let nextScore = score;

            const newDetails = [...examDetails, {
                question: currentQ.text,
                userAnswer: currentQ.options[index],
                correctAnswer: currentQ.options[currentQ.correctIndex],
                isCorrect: isCorrect
            }];
            setExamDetails(newDetails);

            if (isCorrect) {
                nextScore += 100;
                setScore(nextScore);
                Alert.alert('Doğru!', 'Əla! +100 xal');
            } else {
                Alert.alert('Yanlış', `Doğru cavab: ${currentQ.options[currentQ.correctIndex]}`);
            }
            nextQuestion(newDetails, nextScore);
        } else {
            if (isHost) return;
            socket.emit('submit_answer', { pin, answer: index, username: 'Me' });
            Alert.alert('Cavab Göndərildi', 'Digər oyunçular gözlənilir...');
        }
    };

    const nextQuestion = (updatedDetails = examDetails, updatedScore = score) => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setTimeLeft(30);
        } else {
            finishGame(updatedDetails, updatedScore);
        }
    };

    const finishGame = async (finalDetails = examDetails, finalScore = score) => {
        setIsFinished(true);
        const finalUserId = gameUser?._id || gameUser?.id;
        console.log('GameScreen: Finishing game. Final Score:', finalScore);

        if (mode === 'solo' && finalUserId) {
            try {
                await api.post('/auth/add-score', {
                    userId: finalUserId,
                    score: finalScore,
                    title: quizTitle,
                    subject: quizSubject,
                    quizId: quizId,
                    details: finalDetails
                });
                console.log('GameScreen: Score and details saved successfully');
            } catch (err) {
                console.error('GameScreen: Failed to save score:', err);
            }
        }
    };

    if (isFinished) {
        return (
            <LinearGradient colors={['#f3e5f5', '#fff']} style={[styles.container, styles.center]}>
                <Text style={styles.finishTitle}>İmtahan Bitdi! 🎉</Text>
                <Text style={styles.scoreText}>{score} Xal</Text>
                <Text style={styles.subText}>Nəticələriniz profilinizə əlavə edildi.</Text>
                <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Profile', { user: gameUser })}>
                    <Text style={styles.btnText}>Profilə Get</Text>
                </TouchableOpacity>
            </LinearGradient>
        );
    }

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return <View style={styles.center}><Text>Yüklənir...</Text></View>;

    return (
        <LinearGradient colors={['#f5f5f5', '#fff']} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.qCount}>Sual {currentQuestionIndex + 1}/{questions.length}</Text>
                <View style={styles.timerBox}>
                    <Text style={styles.timerText}>{timeLeft}s</Text>
                </View>
            </View>

            <View style={styles.card}>
                {currentQ.imageUrl && <Image source={{ uri: currentQ.imageUrl }} style={styles.questionImage} resizeMode="contain" />}
                <Text style={styles.questionText}>{currentQ.text}</Text>
            </View>

            {isHost ? (
                <View style={styles.hostControls}>
                    <Text style={styles.hostText}>Siz HOST-sunuz</Text>
                    <Button title="Növbəti Sual" onPress={() => { }} />
                </View>
            ) : (
                currentQ.questionType === 'classic' ? (
                    <View style={styles.classicContainer}>
                        <View style={styles.mathHelper}>
                            <TouchableOpacity style={styles.mathBtn} onPress={() => {
                                Alert.alert("Üst İndeks", "Rəqəm seçin:",
                                    [..."0123456789"].map(n => ({
                                        text: n,
                                        onPress: () => {
                                            const map = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
                                            setClassicAnswer(prev => prev + (map[n] || n));
                                        }
                                    })).concat([{ text: "Ləğv et", style: "cancel" }])
                                );
                            }}><Text>xⁿ</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.mathBtn} onPress={() => {
                                Alert.alert("Alt İndeks", "Rəqəm seçin:",
                                    [..."0123456789"].map(n => ({
                                        text: n,
                                        onPress: () => {
                                            const map = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '⁷', '8': '₈', '9': '₉' };
                                            setClassicAnswer(prev => prev + (map[n] || n));
                                        }
                                    })).concat([{ text: "Ləğv et", style: "cancel" }])
                                );
                            }}><Text>xₙ</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.mathBtn} onPress={() => setClassicAnswer(classicAnswer + '√')}><Text>√</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.mathBtn} onPress={() => setClassicAnswer(classicAnswer + 'π')}><Text>π</Text></TouchableOpacity>
                        </View>
                        <TextInput
                            placeholder="Cavabınızı yazın..."
                            value={classicAnswer}
                            onChangeText={setClassicAnswer}
                            style={styles.classicInput}
                        />
                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={() => {
                                const isCorrect = classicAnswer.toLowerCase().trim() === currentQ.correctAnswer.toLowerCase().trim();
                                let nextScore = score;

                                const newDetails = [...examDetails, {
                                    question: currentQ.text,
                                    userAnswer: classicAnswer,
                                    correctAnswer: currentQ.correctAnswer,
                                    isCorrect: isCorrect
                                }];
                                setExamDetails(newDetails);

                                if (isCorrect) {
                                    nextScore += 100;
                                    setScore(nextScore);
                                    Alert.alert('Doğru!', 'Əla! +100 xal');
                                } else {
                                    Alert.alert('Yanlış', `Doğru cavab: ${currentQ.correctAnswer}`);
                                }
                                setClassicAnswer('');
                                nextQuestion(newDetails, nextScore);
                            }}
                        >
                            <Text style={styles.btnText}>Cavabı Göndər</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.optionsGrid}>
                        {currentQ.options.map((opt, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.optionBtn, { backgroundColor: ['#e21b3c', '#1368ce', '#d89e00', '#26890c'][idx], borderColor: ['#e21b3c', '#1368ce', '#d89e00', '#26890c'][idx] }]}
                                onPress={() => handleAnswer(idx)}
                            >
                                <Text style={styles.optionText}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 30 },
    qCount: { fontSize: 18, fontWeight: 'bold', color: '#555' },
    timerBox: { backgroundColor: '#4a148c', padding: 10, borderRadius: 20, width: 60, alignItems: 'center' },
    timerText: { color: 'white', fontWeight: 'bold' },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 30, marginBottom: 30, elevation: 5 },
    questionText: { fontSize: 22, textAlign: 'center', fontWeight: 'bold', color: '#333' },
    optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    optionBtn: { width: '48%', height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderRadius: 15, elevation: 3, borderWidth: 2 },
    optionText: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
    finishTitle: { fontSize: 32, fontWeight: 'bold', color: '#4a148c', marginBottom: 20 },
    scoreText: { fontSize: 40, fontWeight: 'bold', color: '#2ecc71', marginBottom: 10 },
    subText: { fontSize: 18, color: 'gray', marginBottom: 30 },
    btn: { backgroundColor: '#4a148c', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
    btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    questionImage: { width: '100%', height: 200, marginBottom: 15 },
    classicContainer: { padding: 10 },
    classicInput: { backgroundColor: 'white', padding: 15, borderRadius: 10, fontSize: 18, marginBottom: 15, borderWidth: 1, borderColor: '#ccc' },
    submitBtn: { backgroundColor: '#4a148c', padding: 15, borderRadius: 10, alignItems: 'center' },
    mathHelper: { flexDirection: 'row', marginBottom: 10, backgroundColor: '#eee', borderRadius: 8, padding: 5, flexWrap: 'wrap' },
    mathBtn: { padding: 8, backgroundColor: 'white', borderRadius: 5, marginRight: 5, marginBottom: 5, minWidth: 40, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' }
});
