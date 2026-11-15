const logoutButton = document.getElementById('logout-button');

logoutButton.addEventListener('click', async () => {
  logoutButton.disabled = true;

  try {
    await axios.post('/api/auth/logout');
    window.location.href = '/api/auth';
  } catch (error) {
    document.getElementById('logout-message').textContent =
      error.response?.data?.message || 'Could not log out. Try again.';

    logoutButton.disabled = false;
  }
});

const projectForm = document.getElementById('project-form');
const projectMessage = document.getElementById('project-message');
const projectsMessage = document.getElementById('projects-message');
const projectsList = document.getElementById('projects-list');

async function loadProjects() {
  projectsMessage.textContent = 'Loading projects...';

  try {
    const response = await axios.get('/api/projects');

    projectsList.replaceChildren();

    response.data.projects.forEach((project) => {
      const item = document.createElement('li');

      const title = document.createElement('h3');
      title.textContent = project.title;

      const description = document.createElement('p');
      description.textContent = project.description || 'No description.';

      const link = document.createElement('a');
      link.href = `/dashboard/projects/${project.id}`;
      link.textContent = 'Open project';

      item.append(title, description, link);
      projectsList.appendChild(item);
    });

    projectsMessage.textContent =
      response.data.projects.length === 0
        ? 'No projects yet. Create a project above to start practising.'
        : '';
  } catch (error) {
    if (error.response?.status === 401) {
      window.location.href = '/api/auth';
      return;
    }

    projectsMessage.textContent = 'Unable to load projects. Refresh to retry.';
  }
}

projectForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const button = projectForm.querySelector('button');
  button.disabled = true;
  projectMessage.textContent = 'Creating project...';

  try {
    await axios.post('/api/projects', {
      title: document.getElementById('title').value.trim(),
      description: document.getElementById('description').value.trim(),
    });

    projectForm.reset();
    projectMessage.textContent = 'Project created.';
    await loadProjects();
  } catch (error) {
    if (error.response?.status === 401) {
      window.location.href = '/api/auth';
      return;
    }

    projectMessage.textContent =
      error.response?.data?.message || 'Unable to create project.';
  } finally {
    button.disabled = false;
  }
});

loadProjects();
