// 1. Page elements and state
// URL: /dashboard/projects/2/interviews/1
const pathParts = window.location.pathname.split('/');
const projectId = pathParts[3];
const interviewId = pathParts[5];
const apiUrl = `/api/projects/${projectId}`;

const interviewMessage = document.getElementById('interview-message');
const questionSection = document.getElementById('question-section');
const questionNumber = document.getElementById('question-number');
const questionText = document.getElementById('question-text');
const answerForm = document.getElementById('answer-form');
const answerInput = document.getElementById('answer-text');
const answerPanel = document.getElementById('answer-panel');
const interviewProgress = document.getElementById('interview-progress');
const submitButton = document.getElementById('submit-answer');
const feedbackSection = document.getElementById('feedback-section');
const feedbackText = document.getElementById('feedback-text');
const previousButton = document.getElementById('previous-question');
const nextButton = document.getElementById('next-question');
const finishButton = document.getElementById('finish-interview');
const reattemptButton = document.getElementById('reattempt-question');
const prepareQuestionsButton = document.getElementById('prepare-interview-questions');
const interviewResults = document.getElementById('interview-results');
const interviewResultsList = document.getElementById('interview-results-list');

const generateFollowUpButton = document.getElementById('generate-follow-up');
const followUpSection = document.getElementById('follow-up-section');
const followUpContext = document.getElementById('follow-up-context');
const followUpQuestion = document.getElementById('follow-up-question');
const followUpMessage = document.getElementById('follow-up-message');
const followUpForm = document.getElementById('follow-up-form');
const followUpAnswer = document.getElementById('follow-up-answer');
const submitFollowUpButton = document.getElementById('submit-follow-up');
const skipFollowUpButton = document.getElementById('skip-follow-up');
const followUpFeedbackSection = document.getElementById('follow-up-feedback-section');
const followUpFeedback = document.getElementById('follow-up-feedback');

let questions = [];
let currentQuestionIndex = 0;
let interviewStatus = null;
let isBusy = false;
let isReattempting = false;

function getCurrentQuestion() {
    return questions[currentQuestionIndex];
}

function getLatestAttempt(question) {
    return question?.AnswerAttempts?.[0];
}

function rememberAttempt(question, attempt) {
    question.AnswerAttempts = [
        attempt,
        ...(question.AnswerAttempts || []).filter(saved => saved.id !== attempt.id)
    ];
}

function isQuestionFinished(question) {
    if (getLatestAttempt(question)?.feedbackStatus !== 'completed') return false;
    if (question.followUpStatus === 'not_needed') return true;
    if (question.followUpStatus !== 'generated') return false;

    const followUp = question.InterviewFollowUp;
    return Boolean(followUp && (
        followUp.status === 'skipped' ||
        (followUp.status === 'answered' && followUp.feedbackStatus === 'completed')
    ));
}

function setBusy(busy) {
    isBusy = busy;
    updateControls();
}

function showRequestError(error, target, fallback) {
    if (error.response?.status === 401) {
        window.location.href = '/api/auth';
        return;
    }

    target.textContent = error.response?.data?.message || fallback;
}

// 2. Display: these functions do not make API requests.

// All button visibility, disabled states, and read-only rules live here.
function updateControls() {
    const question = getCurrentQuestion();
    const attempt = getLatestAttempt(question);
    const followUp = question?.InterviewFollowUp;
    const active = interviewStatus === 'in_progress' && Boolean(question);
    const mainFinished = attempt?.feedbackStatus === 'completed';
    const editingAnswer = isReattempting || !attempt;
    const showSavedFollowUp = active && !isReattempting && Boolean(followUp);
    const canRespondToFollowUp = active && mainFinished && !isReattempting;
    const lastQuestion = currentQuestionIndex === questions.length - 1;

    questionSection.hidden = !active;
    interviewResults.hidden = interviewStatus !== 'completed';
    prepareQuestionsButton.hidden =
        interviewStatus !== 'in_progress' || questions.length > 0;
    prepareQuestionsButton.disabled = isBusy;

    [
        previousButton, nextButton, finishButton,
        reattemptButton, generateFollowUpButton
    ].forEach(button => {
        button.disabled = isBusy || !active;
    });

    answerInput.readOnly = isBusy || !editingAnswer;
    submitButton.disabled = isBusy || !active || (!editingAnswer && mainFinished);
    submitButton.textContent = editingAnswer
        ? (isReattempting ? 'Submit revised answer' : 'Submit answer')
        : (mainFinished ? 'Answer submitted' : 'Retry feedback');
    feedbackSection.hidden = !active || isReattempting || !mainFinished;

    previousButton.hidden = !active || currentQuestionIndex === 0;
    nextButton.hidden =
        !active || isReattempting || !isQuestionFinished(question) || lastQuestion;
    finishButton.hidden =
        !active || isReattempting || !lastQuestion || !questions.every(isQuestionFinished);
    reattemptButton.hidden = !active || isReattempting || !mainFinished;
    generateFollowUpButton.hidden =
        !active || isReattempting || !mainFinished || question.followUpStatus !== 'pending';

    followUpSection.hidden = !showSavedFollowUp;
    followUpForm.hidden = !showSavedFollowUp || followUp.status === 'skipped';
    followUpFeedbackSection.hidden =
        !showSavedFollowUp || followUp.feedbackStatus !== 'completed';
    followUpAnswer.readOnly =
        isBusy || !canRespondToFollowUp || followUp?.status !== 'pending';

    const followUpPending = followUp?.status === 'pending';
    const feedbackNeedsRetry =
        followUp?.status === 'answered' && followUp.feedbackStatus !== 'completed';

    skipFollowUpButton.hidden = !followUpPending;
    skipFollowUpButton.disabled = isBusy || !canRespondToFollowUp || !followUpPending;
    submitFollowUpButton.disabled =
        isBusy || !canRespondToFollowUp || (!followUpPending && !feedbackNeedsRetry);
    submitFollowUpButton.textContent = followUpPending
        ? 'Submit follow-up answer'
        : (feedbackNeedsRetry ? 'Retry follow-up feedback' : 'Follow-up answer submitted');
}

function showFollowUp(question) {
    const followUp = question.InterviewFollowUp;
    // Keep the next action visible without a wall of main-answer feedback above it.
    if (followUp) feedbackSection.open = false;
    followUpFeedbackSection.open = followUp?.feedbackStatus === 'completed';
    followUpContext.textContent = followUp
        ? `Based on answer attempt #${followUp.answerAttemptId}` : '';
    followUpQuestion.textContent = followUp?.questionText || '';
    followUpAnswer.value = followUp?.answerText || '';
    followUpFeedback.textContent = followUp?.feedback || '';
    followUpMessage.textContent = '';

    if (followUp?.status === 'skipped') {
        followUpMessage.textContent = 'You skipped this follow-up.';
    } else if (followUp?.status === 'answered' && followUp.feedbackStatus !== 'completed') {
        followUpMessage.textContent = 'Your follow-up answer is saved. Retry its feedback.';
    }
}

function showQuestion() {
    const question = getCurrentQuestion();
    if (!question) return;

    const attempt = getLatestAttempt(question);
    isReattempting = false;
    questionNumber.textContent =
        `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    interviewProgress.max = questions.length;
    interviewProgress.value = currentQuestionIndex + 1;
    answerPanel.open = !attempt || attempt.feedbackStatus !== 'completed';
    feedbackSection.open = attempt?.feedbackStatus === 'completed';
    questionText.textContent = question.questionText;
    answerInput.value = attempt?.answerText || '';
    feedbackText.textContent = attempt?.feedback || '';
    generateFollowUpButton.textContent = 'Check for follow-up';
    interviewMessage.textContent = attempt && attempt.feedbackStatus !== 'completed'
        ? 'Your answer is saved. Click Retry feedback to generate feedback.' : '';

    showFollowUp(question);
    updateControls();
}

function showCompletedInterview() {
    interviewResultsList.replaceChildren();

    questions.forEach(question => {
        const item = document.createElement('details');
        item.className = 'result-question';
        const heading = document.createElement('summary');
        heading.textContent = `Question ${question.position}: ${question.questionText}`;
        item.appendChild(heading);
        const resultBody = document.createElement('div');
        resultBody.className = 'result-body';

        function addText(label, content) {
            const title = document.createElement('h4');
            title.textContent = label;
            const text = document.createElement('p');
            text.textContent = content;
            text.style.whiteSpace = 'pre-wrap';
            resultBody.append(title, text);
        }

        const attempt = getLatestAttempt(question);
        addText('Your latest answer', attempt?.answerText || 'No saved answer.');
        addText('Feedback', attempt?.feedback || 'No saved feedback.');

        const earlierAttempts = (question.AnswerAttempts || []).slice(1);
        if (earlierAttempts.length > 0) {
            const history = document.createElement('details');
            const summary = document.createElement('summary');
            summary.textContent = `Earlier attempts (${earlierAttempts.length})`;
            history.appendChild(summary);

            earlierAttempts.forEach(previousAttempt => {
                const heading = document.createElement('h4');
                const content = document.createElement('p');

                heading.textContent =
                    `Attempt #${previousAttempt.id} — ` +
                    new Date(previousAttempt.createdAt).toLocaleString();
                content.textContent =
                    `Answer:\n${previousAttempt.answerText}\n\n` +
                    `Feedback:\n${previousAttempt.feedback || 'No saved feedback.'}`;
                content.style.whiteSpace = 'pre-wrap';

                history.append(heading, content);
            });

            resultBody.appendChild(history);
        }

        const followUp = question.InterviewFollowUp;
        if (followUp) {
            addText(
                `Follow-up based on answer attempt #${followUp.answerAttemptId}`,
                followUp.questionText
            );
            if (followUp.status === 'skipped') {
                addText('Follow-up status', 'Skipped');
            } else {
                addText('Your follow-up answer', followUp.answerText || 'No saved answer.');
                addText('Follow-up feedback', followUp.feedback || 'No saved feedback.');
            }
        }

        item.appendChild(resultBody);
        interviewResultsList.appendChild(item);
    });

    interviewMessage.textContent = 'Interview completed. Select a question to review your answers and feedback.';
    updateControls();
}

// 3. Actions: each function handles one user action and its API requests.

async function loadInterview() {
    setBusy(true);
    try {
        const response = await axios.get(`${apiUrl}/interviews/${interviewId}`);
        interviewStatus = response.data.interview.status;
        questions = response.data.questions;
        isReattempting = false;

        if (interviewStatus === 'completed') {
            showCompletedInterview();
        } else if (questions.length === 0) {
            interviewMessage.textContent =
                'No questions are saved yet. Click Generate interview questions to prepare them.';
        } else {
            currentQuestionIndex = questions.findIndex(question => !isQuestionFinished(question));
            if (currentQuestionIndex === -1) currentQuestionIndex = questions.length - 1;
            showQuestion();
        }
    } catch (error) {
        showRequestError(error, interviewMessage, 'Unable to load interview.');
    } finally {
        setBusy(false);
    }
}

async function prepareQuestions() {
    if (isBusy || prepareQuestionsButton.hidden) return;
    setBusy(true);
    interviewMessage.textContent = 'Generating questions. This may take a moment...';

    try {
        await axios.post(
            `${apiUrl}/interviews/${interviewId}/questions`, {}, { timeout: 75000 }
        );
        await loadInterview();
    } catch (error) {
        showRequestError(error, interviewMessage, 'Unable to generate questions. Please retry.');
    } finally {
        setBusy(false);
    }
}

async function submitMainAnswer(event) {
    event.preventDefault();
    if (isBusy || submitButton.disabled) return;

    const question = getCurrentQuestion();
    if (!question) return;
    if (!answerInput.value.trim()) {
        interviewMessage.textContent = 'Please enter your answer.';
        return;
    }

    let attempt = isReattempting ? null : getLatestAttempt(question);
    let checkFollowUp = false;
    setBusy(true);

    try {
        // Retry feedback for a saved attempt; create a row only for a new answer.
        if (!attempt) {
            interviewMessage.textContent = 'Saving your answer...';
            const response = await axios.post(
                `${apiUrl}/interviews/${interviewId}/questions/${question.id}/answers`,
                { answerText: answerInput.value }
            );
            attempt = response.data.attempt;
            rememberAttempt(question, attempt);
            isReattempting = false;
        }

        interviewMessage.textContent = 'Answer saved. Generating feedback...';
        const response = await axios.post(`${apiUrl}/answers/${attempt.id}/feedback`);
        rememberAttempt(question, response.data.attempt);
        showQuestion();
        checkFollowUp = question.followUpStatus === 'pending';
    } catch (error) {
        if (attempt) showQuestion();
        showRequestError(error, interviewMessage, attempt
            ? 'Your answer is saved. Click Retry feedback to try again.'
            : 'Unable to save answer.');
    } finally {
        setBusy(false);
    }

    // A failed follow-up request must not be reported as failed main feedback.
    if (checkFollowUp) await requestFollowUp();
}

async function requestFollowUp() {
    const question = getCurrentQuestion();
    const attempt = getLatestAttempt(question);
    if (
        isBusy || isReattempting || interviewStatus !== 'in_progress' ||
        question?.followUpStatus !== 'pending' || attempt?.feedbackStatus !== 'completed'
    ) return;

    setBusy(true);
    interviewMessage.textContent = 'Checking for a follow-up...';
    try {
        const response = await axios.post(`${apiUrl}/answers/${attempt.id}/follow-up`);
        question.followUpStatus = response.data.followUpStatus;
        question.InterviewFollowUp = response.data.followUp;
        showFollowUp(question);
        interviewMessage.textContent = question.followUpStatus === 'not_needed'
            ? 'No follow-up needed for this question.' : 'A follow-up is ready below.';
    } catch (error) {
        generateFollowUpButton.textContent = 'Retry follow-up generation';
        showRequestError(error, interviewMessage, 'Unable to generate follow-up. Please retry.');
    } finally {
        setBusy(false);
    }
}

async function submitFollowUpAnswer(event) {
    event.preventDefault();
    if (isBusy || submitFollowUpButton.disabled) return;

    const question = getCurrentQuestion();
    const followUp = question?.InterviewFollowUp;
    if (!followUp) return;
    if (followUp.status === 'pending' && !followUpAnswer.value.trim()) {
        followUpMessage.textContent = 'Please enter your follow-up answer.';
        return;
    }

    setBusy(true);
    try {
        if (followUp.status === 'pending') {
            followUpMessage.textContent = 'Saving your follow-up answer...';
            const response = await axios.post(
                `${apiUrl}/follow-ups/${followUp.id}/answer`,
                { answerText: followUpAnswer.value }
            );
            question.InterviewFollowUp = response.data.followUp;
        }

        followUpMessage.textContent = 'Answer saved. Generating feedback...';
        const response = await axios.post(`${apiUrl}/follow-ups/${followUp.id}/feedback`);
        question.InterviewFollowUp = response.data.followUp;
        showFollowUp(question);
        followUpMessage.textContent = 'Follow-up feedback saved.';
    } catch (error) {
        // Keep an unsaved draft intact; restore the saved answer on feedback failure.
        const saved = question.InterviewFollowUp.status === 'answered';
        if (saved) showFollowUp(question);
        showRequestError(error, followUpMessage, saved
            ? 'Your follow-up answer is saved. Click Retry follow-up feedback.'
            : 'Unable to save your answer. Please retry.');
    } finally {
        setBusy(false);
    }
}

async function skipFollowUp() {
    if (isBusy || skipFollowUpButton.disabled) return;
    const question = getCurrentQuestion();
    const followUp = question?.InterviewFollowUp;
    if (!followUp || followUp.status !== 'pending') return;

    setBusy(true);
    followUpMessage.textContent = 'Skipping follow-up...';
    try {
        const response = await axios.post(`${apiUrl}/follow-ups/${followUp.id}/skip`);
        question.InterviewFollowUp = response.data.followUp;
        showFollowUp(question);
    } catch (error) {
        showRequestError(error, followUpMessage, 'Unable to skip follow-up. Please retry.');
    } finally {
        setBusy(false);
    }
}

async function finishInterview() {
    if (isBusy || finishButton.disabled || finishButton.hidden) return;
    setBusy(true);
    interviewMessage.textContent = 'Finishing interview...';
    try {
        await axios.post(`${apiUrl}/interviews/${interviewId}/finish`);
        interviewStatus = 'completed';
        showCompletedInterview();
    } catch (error) {
        showRequestError(error, interviewMessage, 'Unable to finish interview.');
    } finally {
        setBusy(false);
    }
}

function showPreviousQuestion() {
    if (isBusy || previousButton.hidden || currentQuestionIndex === 0) return;
    currentQuestionIndex--;
    showQuestion();
}

function showNextQuestion() {
    if (isBusy || nextButton.hidden || currentQuestionIndex >= questions.length - 1) return;
    currentQuestionIndex++;
    showQuestion();
    answerInput.focus();
}

function startReattempt() {
    if (isBusy || reattemptButton.hidden) return;
    isReattempting = true;
    answerPanel.open = true;
    interviewMessage.textContent = 'Improve your answer and submit it as a new attempt.';
    updateControls();
    answerInput.focus();
}

// 4. Connect the controls, then load the saved interview.
answerForm.addEventListener('submit', submitMainAnswer);
followUpForm.addEventListener('submit', submitFollowUpAnswer);
generateFollowUpButton.addEventListener('click', requestFollowUp);
skipFollowUpButton.addEventListener('click', skipFollowUp);
prepareQuestionsButton.addEventListener('click', prepareQuestions);
finishButton.addEventListener('click', finishInterview);
previousButton.addEventListener('click', showPreviousQuestion);
nextButton.addEventListener('click', showNextQuestion);
reattemptButton.addEventListener('click', startReattempt);

document.getElementById('back-to-project').href = `/dashboard/projects/${projectId}`;
loadInterview();
