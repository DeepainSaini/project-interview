const { Project, SummaryVersion, Interview,InterviewQuestion, AnswerAttempt,InterviewFollowUp } = require('../models');
const { generateInterviewQuestions } = require('../util/interviewAI');
const path = require('node:path');
const { Op } = require('sequelize');

const showInterviewPage = (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', 'views', 'interview.html')
    );
};

const getInterviews = async (req, res) => {
    const projectId = Number(req.params.id);

    if (!Number.isSafeInteger(projectId) || projectId < 1) {
        return res.status(400).json({
            message: 'Invalid project ID.'
        });
    }

    try {
        const project = await Project.findOne({
            where: {
                id: projectId,
                userId: req.session.userId
            }
        });

        if (!project) {
            return res.status(404).json({
                message: 'Project not found.'
            });
        }

        const interviews = await Interview.findAll({
            where: { projectId: project.id },
            attributes: [
                'id',
                'summaryVersionId',
                'status',
                'createdAt'
            ],
            order: [['id', 'DESC']]
        });

        return res.json({ interviews });
    } catch (error) {
        console.error('Loading interviews failed:', error.name);

        return res.status(500).json({
            message: 'Unable to load interviews.'
        });
    }
};

const startInterview = async (req, res) => {
    const projectId = Number(req.params.id);
    const summaryVersionId = Number(req.body.summaryVersionId);

    if (
        !Number.isSafeInteger(projectId) || projectId < 1 ||
        !Number.isSafeInteger(summaryVersionId) || summaryVersionId < 1
    ) {
        return res.status(400).json({
            message: 'Invalid project or summary ID.'
        });
    }

    try {
        const project = await Project.findOne({
            where: {
                id: projectId,
                userId: req.session.userId
            }
        });

        if (!project) {
            return res.status(404).json({
                message: 'Project not found.'
            });
        }

        const summary = await SummaryVersion.findOne({
            where: {
                id: summaryVersionId,
                projectId: project.id
            }
        });

        if (!summary || !summary.content.trim()) {
            return res.status(400).json({
                message: 'A saved, non-empty summary is required.'
            });
        }

        const interview = await Interview.create({
            projectId: project.id,
            summaryVersionId: summary.id,
            summaryContent: summary.content,
            status: 'in_progress'
        });

        return res.status(201).json({
            message: 'Interview started.',
            interview
        });
    } catch (error) {
        console.error('Starting interview failed:', error.name);

        return res.status(500).json({
            message: 'Unable to start interview.'
        });
    }
};

const generateQuestions = async (req, res) => {
    const projectId = Number(req.params.id);
    const interviewId = Number(req.params.interviewId);

    if (
        !Number.isSafeInteger(projectId) || projectId < 1 ||
        !Number.isSafeInteger(interviewId) || interviewId < 1
    ) {
        return res.status(400).json({
            message: 'Invalid project or interview ID.'
        });
    }

    try {
        const project = await Project.findOne({
            where: {
                id: projectId,
                userId: req.session.userId
            }
        });

        if (!project) {
            return res.status(404).json({
                message: 'Project not found.'
            });
        }

        const interview = await Interview.findOne({
            where: {
                id: interviewId,
                projectId: project.id
            }
        });

        if (!interview) {
            return res.status(404).json({
                message: 'Interview not found.'
            });
        }

        const existingQuestions = await InterviewQuestion.findAll({
            where: { interviewId: interview.id },
            order: [['position', 'ASC']]
        });

        if (existingQuestions.length > 0) {
            return res.json({
                message: 'Questions already generated.',
                questions: existingQuestions
            });
        }

        if (interview.status !== 'in_progress') {
            return res.status(400).json({
                message: 'This interview is already completed.'
            });
        }

        const questionTexts = await generateInterviewQuestions(
            interview.summaryContent
        );

        const questions = await InterviewQuestion.bulkCreate(
            questionTexts.map((questionText, index) => ({
                interviewId: interview.id,
                questionText,
                position: index + 1
            })),
            { validate: true }
        );

        return res.status(201).json({
            message: 'Questions generated and saved.',
            questions
        });
    } catch (error) {
        console.error('Generating questions failed:', {
            name: error.name,
            code: error.parent?.code
        });

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                message: 'Another request saved the questions. Retry to load them.'
            });
        }

        return res.status(500).json({
            message: 'Unable to generate questions. Please try again.'
        });
    }
};

const getInterview = async (req, res) => {
    const projectId = Number(req.params.id);
    const interviewId = Number(req.params.interviewId);

    if (
        !Number.isSafeInteger(projectId) || projectId < 1 ||
        !Number.isSafeInteger(interviewId) || interviewId < 1
    ) {
        return res.status(400).json({
            message: 'Invalid project or interview ID.'
        });
    }

    try {
        const project = await Project.findOne({
            where: {
                id: projectId,
                userId: req.session.userId
            }
        });

        if (!project) {
            return res.status(404).json({
                message: 'Project not found.'
            });
        }

        const interview = await Interview.findOne({
            where: {
                id: interviewId,
                projectId: project.id
            }
        });

        if (!interview) {
            return res.status(404).json({
                message: 'Interview not found.'
            });
        }

        const questions = await InterviewQuestion.findAll({
            where: {
                interviewId: interview.id
            },
            order: [['position', 'ASC']],
            include: [
                {
                    model: AnswerAttempt,
                    separate: true,
                    order: [['id', 'DESC']]
                },
                {
                    model: InterviewFollowUp
                }
            ]
        });

        return res.json({
            interview,
            questions
        });
    } catch (error) {
        console.error('Loading interview failed:', {
            name: error.name,
            code: error.parent?.code
        });

        return res.status(500).json({
            message: 'Unable to load interview.'
        });
    }
};

const finishInterview = async (req, res) => {
    const projectId = Number(req.params.id);
    const interviewId = Number(req.params.interviewId);

    if (
        !Number.isSafeInteger(projectId) || projectId < 1 ||
        !Number.isSafeInteger(interviewId) || interviewId < 1
    ) {
        return res.status(400).json({
            message: 'Invalid project or interview ID.'
        });
    }

    try {
        const project = await Project.findOne({
            where: {
                id: projectId,
                userId: req.session.userId
            }
        });

        if (!project) {
            return res.status(404).json({
                message: 'Project not found.'
            });
        }

        const interview = await Interview.findOne({
            where: {
                id: interviewId,
                projectId: project.id
            }
        });

        if (!interview) {
            return res.status(404).json({
                message: 'Interview not found.'
            });
        }

        if (interview.status === 'completed') {
            return res.json({
                message: 'Interview already completed.',
                interview
            });
        }

        const questions = await InterviewQuestion.findAll({
            where: {
                interviewId: interview.id
            },
            attributes: ['id', 'followUpStatus'],
            include: [
                {
                    model: InterviewFollowUp
                }
            ]
        });

        if (questions.length !== 5) {
            return res.status(400).json({
                message: 'The interview must have five saved questions.'
            });
        }

        const answeredQuestionCount = await AnswerAttempt.count({
            where: {
                interviewQuestionId: {
                    [Op.in]: questions.map(question => question.id)
                },
                feedbackStatus: 'completed'
            },
            distinct: true,
            col: 'interviewQuestionId'
        });

        if (answeredQuestionCount !== questions.length) {
            return res.status(400).json({
                message: 'Answer all five questions and generate their feedback first.'
            });
        }

        const followUpsFinished = questions.every(question => {
            if (question.followUpStatus === 'not_needed') {
                return true;
            }

            if (question.followUpStatus !== 'generated') {
                return false;
            }

            const followUp = question.InterviewFollowUp;

            if (!followUp) {
                return false;
            }

            return followUp.status === 'skipped' ||
                (
                    followUp.status === 'answered' &&
                    followUp.feedbackStatus === 'completed'
                );
        });

        if (!followUpsFinished) {
            return res.status(400).json({
                message:
                    'Generate each follow-up decision, then answer or skip any offered follow-ups. Answered follow-ups also need feedback.'
            });
        }

        await interview.update({
            status: 'completed'
        });

        return res.json({
            message: 'Interview completed.',
            interview
        });
    } catch (error) {
        console.error('Finishing interview failed:', {
            name: error.name,
            code: error.parent?.code
        });

        return res.status(500).json({
            message: 'Unable to finish interview.'
        });
    }
};

module.exports = 
{ 
    startInterview, 
    generateQuestions,
    getInterview, 
    showInterviewPage, 
    finishInterview,
    getInterviews 
};