const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('student', 'teacher', 'admin'), defaultValue: 'student' },
    isApproved: { type: DataTypes.BOOLEAN, defaultValue: false },
    avatar: { type: DataTypes.TEXT, defaultValue: null },
    examResults: {
        type: DataTypes.TEXT,
        defaultValue: '[]',
        get() {
            const rawValue = this.getDataValue('examResults');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('examResults', JSON.stringify(value));
        }
    },
    badges: {
        type: DataTypes.TEXT,
        defaultValue: '[]',
        get() {
            const rawValue = this.getDataValue('badges');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('badges', JSON.stringify(value));
        }
    },
    averageScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalXP: { type: DataTypes.INTEGER, defaultValue: 0 },
    level: { type: DataTypes.INTEGER, defaultValue: 1 },
    streakCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastActive: { type: DataTypes.DATE, defaultValue: null }
});

User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    values._id = values.id; // Compatibility shim
    return values;
};

const Quiz = sequelize.define('Quiz', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.TEXT,
    teacherId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    questions: {
        type: DataTypes.TEXT,
        defaultValue: '[]',
        get() {
            const rawValue = this.getDataValue('questions');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('questions', JSON.stringify(value));
        }
    },
    subject: { type: DataTypes.STRING, defaultValue: 'Digər' },
    grade: { type: DataTypes.STRING, defaultValue: '1' },
    type: { type: DataTypes.ENUM('exam', 'game'), defaultValue: 'exam' }
});

Quiz.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    values._id = values.id; // Compatibility shim
    return values;
};

// Associations
Quiz.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

// Static methods for compatibility
Quiz.findWithFilter = async function ({ subject, grade, type }) {
    let where = {};
    if (subject) where.subject = subject;
    if (grade) where.grade = grade;
    if (type) where.type = type;

    const quizzes = await Quiz.findAll({
        where,
        include: [{ model: User, as: 'teacher', attributes: ['username'] }]
    });
    return quizzes;
};

Quiz.getUniqueSubjects = async function () {
    const examQuizzes = await Quiz.findAll({ where: { type: 'exam' } });
    const unique = [...new Set(examQuizzes.map(q => q.subject))];
    const defaults = ['Riyaziyyat', 'Azərbaycan Dili', 'İngilis Dili', 'Tarix', 'Coğrafiya', 'Biologiya', 'Kimya', 'Fizika'];
    return [...new Set([...defaults, ...unique])];
};

// Aliases for Mongoose compatibility
User.findById = (id) => User.findByPk(id);
Quiz.findById = (id) => Quiz.findByPk(id);

module.exports = { User, Quiz, sequelize };
