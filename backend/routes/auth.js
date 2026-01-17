const express = require('express');
const router = express.Router();
const { User } = require('../models');
const bcrypt = require('bcryptjs');

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const isApproved = role !== 'teacher'; // Students and admins are approved by default
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role,
            isApproved
        });

        let message = 'Hesab yaradıldı!';
        if (role === 'teacher') message += ' (Admin təsdiqi gözlənilir)';

        res.status(201).json({ message, userId: newUser.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Hardcoded Admin
        if (email === 'admin' && password === 'admin') {
            return res.json({
                message: 'Admin girişi',
                user: { id: 'admin', _id: 'admin', username: 'Admin', role: 'admin', isApproved: true }
            });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Yanlış e-poçt və ya şifrə' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Yanlış e-poçt və ya şifrə' });
        }

        if (!user.isApproved) {
            return res.status(403).json({ message: 'Hesabınız təsdiqlənməyib. Admin təsdiqini gözləyin.' });
        }

        // --- Streak Logic ---
        const now = new Date();
        const lastActive = user.lastActive ? new Date(user.lastActive) : null;
        let bonusXP = 0;

        if (!lastActive) {
            user.streakCount = 1;
        } else {
            const diffTime = Math.abs(now - lastActive);
            const diffDays = diffTime / (1000 * 60 * 60 * 24);

            if (diffDays >= 1 && diffDays < 2) {
                user.streakCount += 1;
                bonusXP = user.streakCount * 50; // Bonus for consistency
                user.totalXP += bonusXP;
            } else if (diffDays >= 2) {
                user.streakCount = 1;
            }
        }
        user.lastActive = now;
        await user.save();
        // --------------------

        res.json({
            message: 'Giriş uğurludur',
            user: {
                id: user.id,
                _id: user.id,
                username: user.username,
                role: user.role,
                streakCount: user.streakCount,
                bonusXP
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Pending Teachers
router.get('/pending', async (req, res) => {
    try {
        const users = await User.findAll({ where: { role: 'teacher', isApproved: false } });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Approve User
router.post('/approve', async (req, res) => {
    try {
        const { userId } = req.body;
        console.log('Backend: Received approval request for ID:', userId);
        const user = await User.findByPk(userId);
        if (!user) {
            console.error('Backend: User not found for ID:', userId);
            return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
        }

        user.isApproved = true;
        await user.save();
        console.log('Backend: User approved successfully:', userId);
        res.json({ message: 'İstifadəçi təsdiqləndi' });
    } catch (err) {
        console.error('Backend: Approve error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Update Profile
router.post('/update-profile', async (req, res) => {
    try {
        const { userId, avatar } = req.body;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.avatar = avatar;
        await user.save();
        res.json({ message: 'Profil şəkli yeniləndi', avatar: user.avatar });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Score (with Quiz Analytics support)
router.post('/add-score', async (req, res) => {
    try {
        const { userId, score, subject, title, details, quizId } = req.body;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Update examResults array
        const results = [...user.examResults, {
            score: Number(score),
            subject,
            title,
            details,
            quizId, // New: track which quiz was taken
            username: user.username, // Helpful for simplified analytics
            date: new Date()
        }];
        user.examResults = results;

        // Recalculate Average
        const total = results.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
        user.averageScore = Math.round(total / results.length);

        // XP & Level Logic (New)
        const earnedXP = Math.round(score * 10);
        user.totalXP += earnedXP;
        user.level = Math.floor(user.totalXP / 1000) + 1;

        // Note: Badges are now awarded manually by teachers via /award-badge

        await user.save();
        res.json({ message: 'Nəticə əlavə edildi', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Award Badge (Teacher)
router.post('/award-badge', async (req, res) => {
    try {
        const { userId, badgeType } = req.body;
        console.log('Backend: Badge Award Request Received:', { userId, badgeType });

        if (!userId || !badgeType) {
            console.warn('Backend: Missing userId or badgeType');
            return res.status(400).json({ message: 'Eksik məlumat: userId və ya badgeType' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            console.error('Backend: User not found with ID:', userId);
            return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
        }

        console.log('Backend: Found user for badge:', user.username);

        // Badge mapping (with emojis)
        const badgeMap = {
            'çalışqan': '🥉 Çalışqan',
            'savadlı': '🥈 Savadlı',
            'dahi': '🥇 Dahi'
        };

        const badgeName = badgeMap[badgeType.toLowerCase()];
        if (!badgeName) {
            console.warn('Backend: Invalid badgeType:', badgeType);
            return res.status(400).json({ message: 'Yanlış rozet növü' });
        }

        const currentBadges = [...user.badges];
        if (!currentBadges.includes(badgeName)) {
            currentBadges.push(badgeName);
            user.badges = currentBadges;
            await user.save();
            console.log('Backend: Badge awarded successfully:', badgeName, 'to user:', user.username);
            res.json({ message: `${badgeName} rozeti verildi!`, user });
        } else {
            console.log('Backend: Badge already exists:', badgeName, 'for user:', user.username);
            res.status(400).json({ message: 'Bu rozet artıq verilib' });
        }
    } catch (err) {
        console.error('Backend: Award Badge Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Get User Detail
router.get('/user/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const topStudents = await User.findAll({
            where: { role: 'student' },
            order: [['totalXP', 'DESC']],
            limit: 10,
            attributes: ['username', 'totalXP', 'level', 'avatar']
        });
        res.json(topStudents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Users (Admin)
router.get('/users', async (req, res) => {
    try {
        const { search } = req.query;
        let where = {};
        if (search) {
            const { Op } = require('sequelize');
            where = {
                [Op.or]: [
                    { username: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } }
                ]
            };
        }
        const users = await User.findAll({ where, order: [['createdAt', 'DESC']] });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete User (Admin)
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        console.log('Backend: Received delete request for ID:', userId);
        const user = await User.findByPk(userId);
        if (!user) {
            console.error('Backend: User not found for deletion:', userId);
            return res.status(404).json({ message: 'Tapılmadı' });
        }
        await user.destroy();
        console.log('Backend: User deleted successfully:', userId);
        res.json({ message: 'İstifadəçi silindi' });
    } catch (err) {
        console.error('Backend: Delete error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
