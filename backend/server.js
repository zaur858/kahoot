require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection
const { sequelize, User, Quiz } = require('./models');

async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        console.log('📡 Database connection established.');

        try {
            await sequelize.sync({ alter: true });
            console.log('✅ SQLite Database Synced (Alter)');
        } catch (syncErr) {
            console.warn('⚠️ Sync Alter failed (likely data conflict), attempting standard sync...');
            await sequelize.sync();
        }

        const userCount = await User.count();
        const quizCount = await Quiz.count();
        console.log(`📊 Current Data: ${userCount} users, ${quizCount} quizzes`);
    } catch (err) {
        console.error('❌ Database Initialization Error:', err);
    }
}

initializeDatabase();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/quizzes', require('./routes/quiz'));

// Socket.io Logic (Live Game)
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_game', ({ pin, username }) => {
        socket.join(pin);
        console.log(`${username} joined room ${pin}`);
        io.to(pin).emit('player_joined', { username, socketId: socket.id });
    });

    socket.on('start_game', (pin) => {
        io.to(pin).emit('game_started');
    });

    socket.on('submit_answer', ({ pin, answer, username }) => {
        io.to(pin).emit('answer_received', { username, answer });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
