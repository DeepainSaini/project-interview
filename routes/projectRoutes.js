const express = require('express');
const { createProject, getProjects, getProject,saveSourceVersion, getLatestSources,getSourceHistory } = require('../controllers/projectController');
const { generateSummary, getLatestSummary, updateSummary, approveSummary } = require('../controllers/summaryController');
const { startInterview, generateQuestions, getInterview, finishInterview,getInterviews } = require('../controllers/interviewController');
const { submitAnswer, generateFeedback, generateFollowUp, skipFollowUp,answerFollowUp,generateFollowUpAnswerFeedback} = require('../controllers/answerController');
const { requireApiAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', requireApiAuth, createProject);
router.get('/', requireApiAuth, getProjects);
router.get('/:id', requireApiAuth, getProject);
router.post('/:id/sources', requireApiAuth, saveSourceVersion);
router.get('/:id/sources', requireApiAuth, getLatestSources);
router.get('/:id/sources/history', requireApiAuth, getSourceHistory);
router.post('/:id/summary', requireApiAuth, generateSummary);
router.get('/:id/summary', requireApiAuth, getLatestSummary);
router.patch('/:id/summary/:summaryId', requireApiAuth, updateSummary);
router.post('/:id/summary/:summaryId/approve',requireApiAuth,approveSummary);
router.post('/:id/interviews', requireApiAuth, startInterview);
router.post('/:id/interviews/:interviewId/questions',requireApiAuth,generateQuestions);
router.post('/:id/interviews/:interviewId/questions/:questionId/answers',requireApiAuth,submitAnswer);
router.post('/:id/answers/:attemptId/feedback',requireApiAuth,generateFeedback);
router.get('/:id/interviews/:interviewId',requireApiAuth,getInterview);
router.post('/:id/interviews/:interviewId/finish',requireApiAuth,finishInterview);
router.post('/:id/answers/:attemptId/follow-up',requireApiAuth,generateFollowUp);
router.post('/:id/follow-ups/:followUpId/skip',requireApiAuth,skipFollowUp);
router.post('/:id/follow-ups/:followUpId/answer',requireApiAuth,answerFollowUp);
router.post('/:id/follow-ups/:followUpId/feedback',requireApiAuth,generateFollowUpAnswerFeedback);
router.get('/:id/interviews', requireApiAuth, getInterviews);

module.exports = router;