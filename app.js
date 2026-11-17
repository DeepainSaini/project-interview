const express = require('express');
const path = require('node:path');
const db = require('./models');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const projectRoutes = require('./routes/projectRoutes');
const { sessionMiddleware, sessionStore } = require('./config/session');

const app = express();
app.set('trust proxy', 'loopback');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(sessionMiddleware);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/dashboard', dashboardRoutes);
app.get('/', (req, res) => {
  res.redirect('/api/auth');
});

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    await sessionStore.onReady();
    console.log('MySQL connected');

    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000');
    });
  } catch (error) {
    console.error('Server startup failed:', error.name);
    process.exit(1);
  }
};

startServer();
