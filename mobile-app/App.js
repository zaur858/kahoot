import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import TeacherDashboard from './src/screens/TeacherDashboard';
import AdminDashboard from './src/screens/AdminDashboard';
import CreateQuizScreen from './src/screens/CreateQuizScreen';
import GameLobbyScreen from './src/screens/GameLobbyScreen';
import GameScreen from './src/screens/GameScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import QuizResultsScreen from './src/screens/QuizResultsScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';

// Student Screens
import SubjectsScreen from './src/screens/SubjectsScreen';
import GradesScreen from './src/screens/GradesScreen';
import QuizListScreen from './src/screens/QuizListScreen';
import StudentGameEntry from './src/screens/StudentDashboard';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Stack for Lessons flow
function LessonStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Subjects" component={SubjectsScreen} />
            <Stack.Screen name="Grades" component={GradesScreen} />
            <Stack.Screen name="QuizList" component={QuizListScreen} />
        </Stack.Navigator>
    );
}

// Student Tab Navigator
function StudentTabs({ route }) {
    const user = route.params?.user;
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 0,
                    elevation: 5,
                    height: 60,
                    paddingBottom: 5
                },
                tabBarActiveTintColor: '#4a148c',
                tabBarInactiveTintColor: 'gray',
                tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' }
            }}
        >
            <Tab.Screen
                name="Profil"
                component={ProfileScreen}
                initialParams={{ user }}
                options={{ tabBarLabel: '👤 Profil' }}
            />
            <Tab.Screen
                name="Dərslər"
                component={LessonStack}
                options={{ tabBarLabel: '📚 Dərslər' }}
            />
            <Tab.Screen
                name="Oyun"
                component={StudentGameEntry}
                initialParams={{ user }}
                options={{ tabBarLabel: '🎮 Oyun' }}
            />
            <Tab.Screen
                name="Liderlik"
                component={LeaderboardScreen}
                options={{ tabBarLabel: '🏆 Liderlik' }}
            />
        </Tab.Navigator>
    );
}

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [initialUser, setInitialUser] = useState(null);

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const savedUser = await AsyncStorage.getItem('user');
            if (savedUser) {
                setInitialUser(JSON.parse(savedUser));
            }
        } catch (e) {
            console.error('Failed to load session');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4a148c" />
                <Text style={{ marginTop: 10 }}>Başladılır...</Text>
            </View>
        );
    }

    // Determine initial route
    let initialRoute = 'Login';
    if (initialUser) {
        if (initialUser.role === 'admin') initialRoute = 'AdminDashboard';
        else if (initialUser.role === 'teacher') initialRoute = 'TeacherDashboard';
        else initialRoute = 'StudentDashboard';
    }

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="TeacherDashboard" component={TeacherDashboard} initialParams={{ user: initialUser }} />
                <Stack.Screen name="AdminDashboard" component={AdminDashboard} initialParams={{ user: initialUser }} />
                <Stack.Screen name="StudentDashboard" component={StudentTabs} initialParams={{ user: initialUser }} />

                <Stack.Screen name="CreateQuiz" component={CreateQuizScreen} />
                <Stack.Screen name="GameLobby" component={GameLobbyScreen} />
                <Stack.Screen name="Game" component={GameScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="QuizResults" component={QuizResultsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
