const projectId = window.location.pathname.split('/').pop();

async function loadProject() {
  const message = document.getElementById('project-message');

  try {
    const response = await axios.get(`/api/projects/${projectId}`);
    const project = response.data.project;

    document.getElementById('project-title').textContent = project.title;

    document.getElementById('project-description').textContent =
      project.description || 'No description.';
  } catch (error) {
    if (error.response?.status === 401) {
      window.location.href = '/api/auth';
      return;
    }

    document.getElementById('project-title').textContent = 'Project';

    message.textContent =
      error.response?.data?.message || 'Unable to load project.';
  }
}

loadProject();

const notesInput = document.getElementById('notes');
const readmeInput = document.getElementById('readme');
const notesFields = document.getElementById('notes-fields');
const readmeFields = document.getElementById('readme-fields');

async function loadSources() {
  const message = document.getElementById('sources-message');

  try {
    const response = await axios.get(`/api/projects/${projectId}/sources`);

    notesInput.value = response.data.notes?.content || '';
    readmeInput.value = response.data.readme?.content || '';

    // A new project starts with its first input ready to edit.
    if (!response.data.notes && !response.data.readme) {
      document.getElementById('notes-panel').open = true;
    }

    notesFields.disabled = false;
    readmeFields.disabled = false;
    message.textContent = '';
  } catch (error) {
    if (error.response?.status === 401) {
      window.location.href = '/api/auth';
      return;
    }

    message.textContent = 'Unable to load saved text. Refresh to retry.';
  }
}


document.getElementById('notes-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const message = document.getElementById('notes-message');
  notesFields.disabled = true;
  message.textContent = 'Saving...';

  try {
    await axios.post(`/api/projects/${projectId}/sources`, {
      sourceType: 'notes',
      content: notesInput.value,
    });

    message.textContent = 'Notes saved.';
    await loadSourceHistory();
  } catch (error) {
    message.textContent =
      error.response?.data?.message || 'Unable to save notes.';
  } finally {
    notesFields.disabled = false;
  }
});


document.getElementById('readme-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const message = document.getElementById('readme-message');
  readmeFields.disabled = true;
  message.textContent = 'Saving...';

  try {
    await axios.post(`/api/projects/${projectId}/sources`, {
      sourceType: 'readme',
      content: readmeInput.value,
    });

    message.textContent = 'README saved.';
    await loadSourceHistory();
  } catch (error) {
    message.textContent =
      error.response?.data?.message || 'Unable to save README.';
  } finally {
    readmeFields.disabled = false;
  }
});

loadSources();

async function loadSourceHistory() {
  const list = document.getElementById('history-list');
  const message = document.getElementById('history-message');

  message.textContent = 'Loading history...';

  try {
    const response = await axios.get(
      `/api/projects/${projectId}/sources/history`
    );

    list.replaceChildren();

    response.data.history.forEach((version) => {
      const item = document.createElement('li');
      const label = document.createElement('p');
      const button = document.createElement('button');

      const savedAt = new Date(version.createdAt).toLocaleString();

      label.textContent =
        `${version.sourceType} — Snapshot #${version.id} — ${savedAt}`;

      button.type = 'button';
      button.textContent = 'View';

      button.addEventListener('click', () => {
        document.getElementById('history-preview').hidden = false;

        document.getElementById('history-title').textContent =
          `${version.sourceType} — Snapshot #${version.id}`;

        document.getElementById('history-content').textContent =
          version.content;
      });

      item.append(label, button);
      list.appendChild(item);
    });

    message.textContent =
      response.data.history.length === 0 ? 'No saved history yet.' : '';
  } catch (error) {
    if (error.response?.status === 401) {
      window.location.href = '/api/auth';
      return;
    }

    message.textContent = 'Unable to load history. Refresh to retry.';
  }
}

loadSourceHistory();


const summaryInput = document.getElementById('summary-content');
const summaryMessage = document.getElementById('summary-message');
const summaryStatus = document.getElementById('summary-status');
const generateButton = document.getElementById('generate-summary');
const saveSummaryButton = document.getElementById('save-summary');
let currentSummaryId = null;
let savedSummaryContent = '';


async function loadSummary() {
  summaryMessage.textContent = 'Loading summary...';

  try {
    const response = await axios.get(`/api/projects/${projectId}/summary`);
    const summary = response.data.summary;

    if (!summary) {
      summaryMessage.textContent = 'No summary yet. Generate one to begin.';
      return;
    }

    summaryInput.value = summary.content;
    savedSummaryContent = summary.content;
    currentSummaryId = summary.id;
    summaryInput.readOnly = false;
    saveSummaryButton.disabled = false;
    summaryStatus.textContent = `Status: ${summary.status}`;
    summaryMessage.textContent = '';
  } catch (error) {
    if (error.response?.status === 401) {
      window.location.href = '/api/auth';
      return;
    }

    summaryMessage.textContent = 'Unable to load summary.';
  }
}

// Generate and save a new draft.
generateButton.addEventListener('click', async () => {
  generateButton.disabled = true;
  saveSummaryButton.disabled = true;
  summaryInput.readOnly = true;
  summaryMessage.textContent = 'Generating summary. This may take a moment...';

  try {
    const response = await axios.post(
      `/api/projects/${projectId}/summary`
    );

    const summary = response.data.summary;

    summaryInput.value = summary.content;
    savedSummaryContent = summary.content;
    currentSummaryId = summary.id;
    summaryInput.readOnly = false;
    saveSummaryButton.disabled = false;
    summaryStatus.textContent = `Status: ${summary.status}`;
    summaryMessage.textContent = 'New draft generated and saved.';
  } catch (error) {
    if (error.response?.status === 401) {
      window.location.href = '/api/auth';
      return;
    }

    summaryMessage.textContent =
      error.response?.data?.message || 'Unable to generate summary.';
  } finally {
    generateButton.disabled = false;
    saveSummaryButton.disabled = currentSummaryId === null;
    summaryInput.readOnly = currentSummaryId === null;
  }
});

loadSummary();


saveSummaryButton.addEventListener('click', async () => {
  if (currentSummaryId === null) return;

  saveSummaryButton.disabled = true;
  generateButton.disabled = true;
  summaryInput.readOnly = true;
  summaryMessage.textContent = 'Saving changes...';

  try {
    const response = await axios.patch(
      `/api/projects/${projectId}/summary/${currentSummaryId}`,
      {
        content: summaryInput.value,
      }
    );

    summaryStatus.textContent = `Status: ${response.data.summary.status}`;
    summaryMessage.textContent = 'Summary changes saved.';
    savedSummaryContent = response.data.summary.content;
  } catch (error) {
    if (error.response?.status === 401) {
      window.location.href = '/api/auth';
      return;
    }

    summaryMessage.textContent =
      error.response?.data?.message || 'Unable to save changes.';
  } finally {
    saveSummaryButton.disabled = false;
    generateButton.disabled = false;
    summaryInput.readOnly = false;
  }
});

const startInterviewButton = document.getElementById('start-interview');
const interviewsMessage = document.getElementById('interviews-message');
const interviewsList = document.getElementById('interviews-list');

// Only a newly created interview needs question generation before opening.
const openInterview = async (interview, prepareQuestions = false) => {
    if (prepareQuestions && interview.status === 'in_progress') {
        await axios.post(
            `/api/projects/${projectId}/interviews/${interview.id}/questions`,
            {},
            { timeout: 75000 }
        );
    }

    window.location.href =
        `/dashboard/projects/${projectId}/interviews/${interview.id}`;
};

const loadInterviews = async () => {
    interviewsMessage.textContent = 'Loading interviews...';

    try {
        const response = await axios.get(
            `/api/projects/${projectId}/interviews`
        );

        interviewsList.replaceChildren();

        response.data.interviews.forEach(interview => {
            const item = document.createElement('li');
            const label = document.createElement('p');
            const link = document.createElement('a');

            const date = new Date(interview.createdAt).toLocaleString();

            label.textContent =
                `Interview #${interview.id} | ${interview.status} | ` +
                `Summary #${interview.summaryVersionId} | ${date}`;

            link.href =
                `/dashboard/projects/${projectId}/interviews/${interview.id}`;
            link.textContent =
                interview.status === 'completed' ? 'Review interview' : 'Resume';

            item.append(label, link);
            interviewsList.appendChild(item);
        });

        interviewsMessage.textContent =
            response.data.interviews.length === 0 ? 'No interviews yet.' : '';
    } catch (error) {
        if (error.response?.status === 401) {
            window.location.href = '/api/auth';
            return;
        }

        interviewsMessage.textContent = 'Unable to load interviews.';
    }
};

startInterviewButton.addEventListener('click', async () => {
    if (startInterviewButton.disabled) return;

    if (currentSummaryId === null) {
        interviewsMessage.textContent =
            'Generate and save a summary first.';
        return;
    }

    if (generateButton.disabled || saveSummaryButton.disabled) {
        interviewsMessage.textContent =
            'Wait for the summary operation to finish.';
        return;
    }

    if (summaryInput.value !== savedSummaryContent) {
        interviewsMessage.textContent =
            'Save your summary changes before starting.';
        return;
    }

    startInterviewButton.disabled = true;
    generateButton.disabled = true;
    saveSummaryButton.disabled = true;
    summaryInput.readOnly = true;

    interviewsMessage.textContent =
        'Starting interview and generating questions...';

    let createdInterview = null;

    try {
        const response = await axios.post(
            `/api/projects/${projectId}/interviews`,
            {
                summaryVersionId: currentSummaryId
            }
        );

        createdInterview = response.data.interview;

        await openInterview(createdInterview, true);
    } catch (error) {
        if (error.response?.status === 401) {
            window.location.href = '/api/auth';
            return;
        }

        if (createdInterview) {
            await loadInterviews();

            interviewsMessage.textContent =
                `Interview #${createdInterview.id} was created, but questions ` +
                'could not be loaded. Use Resume below to retry.';
        } else {
            interviewsMessage.textContent =
                error.response?.data?.message ||
                'Unable to start interview.';
        }
    } finally {
        startInterviewButton.disabled = false;
        generateButton.disabled = false;
        saveSummaryButton.disabled = currentSummaryId === null;
        summaryInput.readOnly = currentSummaryId === null;
    }
});

loadInterviews();

// Browser Back can restore an old page, including outdated interview statuses.
window.addEventListener('pageshow', (event) => {
    if (event.persisted) return loadInterviews();
});
