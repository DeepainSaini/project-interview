require('dotenv').config();
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const dbConfig = require('./config')[process.env.NODE_ENV || 'development'];

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in .env.');
}

const sessionStore = new MySQLStore({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  createDatabaseTable: false,
});

sessionStore.on('error', () => {
  console.error('MySQL session store error.');
});

const sessionMiddleware = session({
  name: 'project_interview.sid',
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
  },
});

module.exports = { sessionMiddleware, sessionStore };
