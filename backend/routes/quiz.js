const express = require('express');
const router = express.Router();
const { Quiz, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get Unique Subjects
router.get('/subjects', async (req, res) => {
    try {
        const subjects = await Quiz.getUniqueSubjects();
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Quiz
router.post('/', async (req, res) => {
    try {
        const { title, description, teacherId, questions, subject, grade, type } = req.body;
        const newQuiz = await Quiz.create({ title, description, teacherId, questions, subject, grade, type });
        res.status(201).json(newQuiz);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Quizzes (with search/filter)
router.get('/', async (req, res) => {
    try {
        const { search, subject, type, grade } = req.query;
        let where = {};
        if (search) {
            where.title = { [Op.like]: `%${search}%` };
        }
        if (subject) where.subject = subject;
        if (grade) where.grade = grade;
        if (type) where.type = type;

        const quizzes = await Quiz.findAll({
            where,
            include: [{ model: User, as: 'teacher', attributes: ['username'] }]
        });
        res.json(quizzes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Single Quiz
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Backend: Fetching single quiz:', id);

        const quiz = await Quiz.findByPk(id, {
            include: [{ model: User, as: 'teacher', attributes: ['username'] }]
        });

        if (!quiz) {
            console.error('Backend: Quiz not found:', id);
            return res.status(404).json({ message: 'Quiz tapılmadı' });
        }

        console.log('Backend: Quiz found:', quiz.title, 'Questions:', quiz.questions?.length);
        res.json(quiz);
    } catch (err) {
        console.error('Backend: Quiz Fetch Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Delete Quiz
router.delete('/:id', async (req, res) => {
    try {
        const quiz = await Quiz.findByPk(req.params.id);
        if (!quiz) return res.status(404).json({ message: 'Quiz tapılmadı' });
        await quiz.destroy();
        res.json({ message: 'Quiz silindi' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Quiz Results (Analytics)
router.get('/:id/results', async (req, res) => {
    try {
        const quizId = req.params.id;
        const teacherId = req.query.teacherId; // Mocked auth for now

        const quiz = await Quiz.findByPk(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz tapılmadı' });

        // Simple check: Only owner should see results (if teacherId provided)
        if (teacherId && quiz.teacherId !== teacherId) {
            return res.status(403).json({ message: 'Bu imtahanın nəticələrinə baxmaq icazəniz yoydur' });
        }

        // Find all students who have this quizId in their examResults
        const students = await User.findAll({ where: { role: 'student' } });

        const results = [];
        students.forEach(student => {
            student.examResults.forEach(res => {
                if (res.quizId === quizId) {
                    results.push({
                        studentId: student.id, // NEW: Needed for awarding badges
                        studentName: student.username,
                        score: res.score,
                        date: res.date,
                        details: res.details
                    });
                }
            });
        });

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
