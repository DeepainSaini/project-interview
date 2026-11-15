const loginSection = document.getElementById('login-section');
const signupSection = document.getElementById('signup-section');

document.getElementById('show-signup').addEventListener('click', () => {
  loginSection.hidden = true;
  signupSection.hidden = false;
});

document.getElementById('show-login').addEventListener('click', () => {
  signupSection.hidden = true;
  loginSection.hidden = false;
});

// Signup
const signupForm = document.getElementById('signup-form');

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const message = document.getElementById('signup-message');
  const button = signupForm.querySelector('button[type="submit"]');

  button.disabled = true;
  message.textContent = 'Creating account...';

  try {
    const response = await axios.post('/api/auth/register', {
      name: document.getElementById('signup-name').value.trim(),
      email: document.getElementById('signup-email').value.trim(),
      password: document.getElementById('signup-password').value,
    });

    message.textContent = response.data.message + ' You can now log in.';
    signupForm.reset();
  } catch (error) {
    message.textContent =
      error.response?.data?.message || 'Signup failed. Please try again.';
  } finally {
    document.getElementById('signup-password').value = '';
    button.disabled = false;
  }
});

// Login
const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const message = document.getElementById('login-message');
  const button = loginForm.querySelector('button[type="submit"]');

  button.disabled = true;
  message.textContent = 'Logging in...';

  try {
    const response = await axios.post('/api/auth/login', {
      email: document.getElementById('login-email').value.trim(),
      password: document.getElementById('login-password').value,
    });

    message.textContent = response.data.message;
    loginForm.reset();
    window.location.href = '/dashboard';
  } catch (error) {
    message.textContent =
      error.response?.data?.message || 'Login failed. Please try again.';
  } finally {
    document.getElementById('login-password').value = '';
    button.disabled = false;
  }
});