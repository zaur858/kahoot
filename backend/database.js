const { Sequelize } = require('sequelize');
const path = require('path');

// Ensure database file is in the absolute 'backend' directory
const dbPath = path.resolve(__dirname, 'database.sqlite');
console.log('📦 Database Path:', dbPath);

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
    retry: {
        match: [
            /SQLITE_BUSY/
        ],
        max: 5
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

module.exports = sequelize;
