const {Project,Interview,InterviewQuestion,AnswerAttempt,InterviewFollowUp,sequelize} = require('../models');
const { generateAnswerFeedback, generateFollowUpQuestion,generateFollowUpFeedback } = require('../util/interviewAI');

const submitAnswer = async (req, res) => {
    const projectId = Number(req.params.id);
    const interviewId = Number(req.params.interviewId);
    const questionId = Number(req.params.questionId);
    const { answerText } = req.body;

    const validIds = [projectId, interviewId, questionId].every(
        id => Number.isSafeInteger(id) && id > 0
    );

    if (!validIds) {
        return res.status(400).json({
            message: 'Invalid project, interview, or question ID.'
        });
    }

    if (
        typeof answerText !== 'string' ||
        !answerText.trim()
    ) {
        return res.status(400).json({
            message: 'Please enter an answer.'
        });
    }

    if (Buffer.byteLength(answerText, 'utf8') > 65535) {
        return res.status(400).json({
            message: 'Your answer is too long.'
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

        const question = await InterviewQuestion.findOne({
            where: {
                id: questionId,
                interviewId: interview.id
            }
        });

        if (!question) {
            return res.status(404).json({
                message: 'Question not found.'
            });
        }

        const attempt = await AnswerAttempt.create({
            interviewQuestionId: question.id,
            answerText,
            feedbackStatus: 'pending'
        });

        return res.status(201).json({
            message: 'Answer saved.',
            attempt
        });
    } catch (error) {
        console.error('Saving answer failed:', {
            name: error.name,
            code: error.parent?.code
        });

        return res.status(500).json({
            message: 'Unable to save your answer.'
        });
    }
};


const generateFeedback = async (req, res) => {
    const projectId = Number(req.params.id);
    const attemptId = Number(req.params.attemptId);

    if (
        !Number.isSafeInteger(projectId) || projectId < 1 ||
        !Number.isSafeInteger(attemptId) || attemptId < 1
    ) {
        return res.status(400).json({
            message: 'Invalid project or answer attempt ID.'
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

        const attempt = await AnswerAttempt.findByPk(attemptId);

        if (!attempt) {
            return res.status(404).json({
                message: 'Answer attempt not found.'
            });
        }

        const question = await InterviewQuestion.findByPk(
            attempt.interviewQuestionId
        );

        const interview = question
            ? await Interview.findOne({
                where: {
                    id: question.interviewId,
                    projectId: project.id
                }
            })
            : null;

        if (!interview) {
            return res.status(404).json({
                message: 'Answer attempt not found in this project.'
            });
        }

        if (attempt.feedbackStatus === 'completed') {
            return res.json({
                message: 'Feedback already generated.',
                attempt
            });
        }

        let feedback;

        try {
            feedback = await generateAnswerFeedback(
                interview.summaryContent,
                question.questionText,
                attempt.answerText
            );
        } catch {
            await attempt.update({
                feedbackStatus: 'failed'
            });

            return res.status(502).json({
                message: 'Feedback generation failed. Your answer is saved. Please retry.'
            });
        }

        await attempt.update({
            feedback,
            feedbackStatus: 'completed'
        });

        return res.json({
            message: 'Feedback generated and saved.',
            attempt
        });
    } catch (error) {
        console.error('Saving feedback failed:', {
            name: error.name,
            code: error.parent?.code
        });

        return res.status(500).json({
            message: 'Unable to process feedback. Please retry.'
        });
    }
};

const generateFollowUp = async (req, res) => {
    const projectId = Number(req.params.id);
    const attemptId = Number(req.params.attemptId);

    if (
        !Number.isSafeInteger(projectId) || projectId < 1 ||
        !Number.isSafeInteger(attemptId) || attemptId < 1
    ) {
        return res.status(400).json({
            message: 'Invalid project or answer attempt ID.'
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

        const attempt = await AnswerAttempt.findByPk(attemptId);

        if (!attempt) {
            return res.status(404).json({
                message: 'Answer attempt not found.'
            });
        }

        const question = await InterviewQuestion.findByPk(
            attempt.interviewQuestionId
        );

        const interview = question
            ? await Interview.findOne({
                where: {
                    id: question.interviewId,
                    projectId: project.id
                }
            })
            : null;

        if (!interview) {
            return res.status(404).json({
                message: 'Answer attempt not found in this project.'
            });
        }

        if (question.followUpStatus !== 'pending') {
            const followUp = await InterviewFollowUp.findOne({
                where: { interviewQuestionId: question.id }
            });

            return res.json({
                followUpStatus: question.followUpStatus,
                followUp
            });
        }

        if (interview.status === 'completed') {
            return res.status(400).json({
                message: 'Cannot generate a new follow-up for a completed interview.'
            });
        }

        if (attempt.feedbackStatus !== 'completed') {
            return res.status(400).json({
                message: 'Generate feedback for this answer first.'
            });
        }

        let followUpText;

        try {
            followUpText = await generateFollowUpQuestion(
                interview.summaryContent,
                question.questionText,
                attempt.answerText,
                attempt.feedback
            );
        } catch {
            return res.status(502).json({
                message: 'Follow-up generation failed. Please retry.'
            });
        }

        const result = await sequelize.transaction(async transaction => {
            const savedQuestion = await InterviewQuestion.findByPk(
                question.id,
                {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                }
            );

            // Another request may have saved a decision meanwhile.
            if (savedQuestion.followUpStatus !== 'pending') {
                const followUp = await InterviewFollowUp.findOne({
                    where: { interviewQuestionId: question.id },
                    transaction
                });

                return {
                    followUpStatus: savedQuestion.followUpStatus,
                    followUp
                };
            }

            if (followUpText === null) {
                await savedQuestion.update(
                    { followUpStatus: 'not_needed' },
                    { transaction }
                );

                return {
                    followUpStatus: 'not_needed',
                    followUp: null
                };
            }

            const followUp = await InterviewFollowUp.create(
                {
                    interviewQuestionId: question.id,
                    answerAttemptId: attempt.id,
                    questionText: followUpText,
                    status: 'pending'
                },
                { transaction }
            );

            await savedQuestion.update(
                { followUpStatus: 'generated' },
                { transaction }
            );

            return {
                followUpStatus: 'generated',
                followUp
            };
        });

        return res.json(result);
    } catch (error) {
        console.error('Saving follow-up failed:', {
            name: error.name,
            code: error.parent?.code
        });

        return res.status(500).json({
            message: 'Unable to process follow-up. Please retry.'
        });
    }
};

const skipFollowUp = async (req, res) => {
    const projectId = Number(req.params.id);
    const followUpId = Number(req.params.followUpId);

    if (
        !Number.isSafeInteger(projectId) || projectId < 1 ||
        !Number.isSafeInteger(followUpId) || followUpId < 1
    ) {
        return res.status(400).json({
            message: 'Invalid project or follow-up ID.'
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

        const followUp = await InterviewFollowUp.findByPk(followUpId);

        if (!followUp) {
            return res.status(404).json({
                message: 'Follow-up not found.'
            });
        }

        const question = await InterviewQuestion.findByPk(
            followUp.interviewQuestionId
        );

        const interview = question
            ? await Interview.findOne({
                where: {
                    id: question.interviewId,
                    projectId: project.id
                }
            })
            : null;

        if (!interview) {
            return res.status(404).json({
                message: 'Follow-up not found in this project.'
            });
        }

        await InterviewFollowUp.update(
            { status: 'skipped' },
            {
                where: {
                    id: followUp.id,
                    status: 'pending'
                }
            }
        );

        await followUp.reload();

        if (followUp.status === 'answered') {
            return res.status(409).json({
                message: 'An answered follow-up cannot be skipped.'
            });
        }

        return res.json({
            message: 'Follow-up skipped.',
            followUp
        });
    } catch (error) {
        console.error('Skipping follow-up failed:', {
            name: error.name,
            code: error.parent?.code
        });

        return res.status(500).json({
            message: 'Unable to skip follow-up.'
        });
    }
};

const answerFollowUp = async (req, res) => {
    const projectId = Number(req.params.id);
    const followUpId = Number(req.params.followUpId);
    const { answerText } = req.body;

    if (
        !Number.isSafeInteger(projectId) || projectId < 1 ||
        !Number.isSafeInteger(followUpId) || followUpId < 1
    ) {
        return res.status(400).json({
            message: 'Invalid project or follow-up ID.'
        });
    }

    if (
        typeof answerText !== 'string' ||
        !answerText.trim()
    ) {
        return res.status(400).json({
            message: 'Please enter an answer.'
        });
    }

    if (Buffer.byteLength(answerText, 'utf8') > 65535) {
        return res.status(400).json({
            message: 'Your answer is too long.'
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

        const followUp = await InterviewFollowUp.findByPk(followUpId);

        if (!followUp) {
            return res.status(404).json({
                message: 'Follow-up not found.'
            });
        }

        const question = await InterviewQuestion.findByPk(
            followUp.interviewQuestionId
        );

        const interview = question
            ? await Interview.findOne({
                where: {
                    id: question.interviewId,
                    projectId: project.id
                }
            })
            : null;

        if (!interview) {
            return res.status(404).json({
                message: 'Follow-up not found in this project.'
            });
        }

        const [updatedCount] = await InterviewFollowUp.update(
            {
                answerText,
                status: 'answered',
                feedbackStatus: 'pending'
            },
            {
                where: {
                    id: followUp.id,
                    status: 'pending'
                }
            }
        );

        if (updatedCount === 0) {
            return res.status(409).json({
                message: 'This follow-up has already been answered or skipped.'
            });
        }

        await followUp.reload();

        return res.json({
            message: 'Follow-up answer saved.',
            followUp
        });
    } catch (error) {
        console.error('Saving follow-up answer failed:', {
            name: error.name,
            code: error.parent?.code
        });

        return res.status(500).json({
            message: 'Unable to save follow-up answer.'
        });
    }
};

const generateFollowUpAnswerFeedback = async (req, res) => {
    const projectId = Number(req.params.id);
    const followUpId = Number(req.params.followUpId);

    if (
        !Number.isSafeInteger(projectId) || projectId < 1 ||
        !Number.isSafeInteger(followUpId) || followUpId < 1
    ) {
        return res.status(400).json({
            message: 'Invalid project or follow-up ID.'
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

        const followUp = await InterviewFollowUp.findByPk(followUpId);

        if (!followUp) {
            return res.status(404).json({
                message: 'Follow-up not found.'
            });
        }

        const question = await InterviewQuestion.findByPk(
            followUp.interviewQuestionId
        );

        const interview = question
            ? await Interview.findOne({
                where: {
                    id: question.interviewId,
                    projectId: project.id
                }
            })
            : null;

        if (!interview) {
            return res.status(404).json({
                message: 'Follow-up not found in this project.'
            });
        }

        if (followUp.status !== 'answered') {
            return res.status(400).json({
                message: 'Answer the follow-up before generating feedback.'
            });
        }

        if (followUp.feedbackStatus === 'completed') {
            return res.json({
                message: 'Follow-up feedback already generated.',
                followUp
            });
        }

        const mainAttempt = await AnswerAttempt.findOne({
            where: {
                id: followUp.answerAttemptId,
                interviewQuestionId: question.id
            }
        });

        if (!mainAttempt) {
            return res.status(404).json({
                message: 'Original answer attempt not found.'
            });
        }

        let feedback;

        try {
            feedback = await generateFollowUpFeedback(
                interview.summaryContent,
                question.questionText,
                mainAttempt.answerText,
                followUp.questionText,
                followUp.answerText
            );
        } catch {
            await followUp.update({
                feedbackStatus: 'failed'
            });

            return res.status(502).json({
                message: 'Feedback generation failed. Your answer is saved. Please retry.'
            });
        }

        await followUp.update({
            feedback,
            feedbackStatus: 'completed'
        });

        return res.json({
            message: 'Follow-up feedback generated and saved.',
            followUp
        });
    } catch (error) {
        console.error('Saving follow-up feedback failed:', {
            name: error.name,
            code: error.parent?.code
        });

        return res.status(500).json({
            message: 'Unable to process follow-up feedback.'
        });
    }
};

module.exports = { submitAnswer, generateFeedback, generateFollowUp, skipFollowUp,answerFollowUp, generateFollowUpAnswerFeedback };