const express = require('express');
const { requireAuth } = require('../middlewares/authMiddleware');
const { showDashboard, showProject } = require('../controllers/dashboardController');
const {showInterviewPage} = require('../controllers/interviewController');

const router = express.Router();

router.get('/', requireAuth, showDashboard);
router.get('/projects/:id', requireAuth, showProject);
router.get('/projects/:id/interviews/:interviewId',requireAuth,showInterviewPage);


module.exports = router;