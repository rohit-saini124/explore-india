// SQLite database connection (better-sqlite3)
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'explore-india.db'));
db.pragma('journal_mode = WAL');

module.exports = db;