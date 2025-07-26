document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const userId = document.getElementById('userId').value.trim();
  const password = document.getElementById('password').value;
  const msg = document.getElementById('loginMessage');
  msg.textContent = '';
  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password })
    });
    if (!res.ok) {
      const text = await res.text();
      msg.textContent = text || 'Login failed';
      msg.style.color = '#d32f2f';
      return;
    }
    const data = await res.json();
    localStorage.setItem('edunest_jwt', data.token);
    msg.textContent = 'Login successful! Redirecting...';
    msg.style.color = '#388e3c';
    setTimeout(() => {
      window.location.href = '/client/views/dashboard.html';
    }, 1000);
  } catch (err) {
    msg.textContent = 'Network error';
    msg.style.color = '#d32f2f';
  }
});

// Forgot password modal logic
const forgotLink = document.getElementById('forgotPasswordLink');
const forgotModal = document.getElementById('forgotModal');
const closeModal = document.getElementById('closeModal');
if (forgotLink && forgotModal && closeModal) {
  forgotLink.onclick = function(e) {
    e.preventDefault();
    forgotModal.style.display = 'flex';
  };
  closeModal.onclick = function() {
    forgotModal.style.display = 'none';
  };
  window.onclick = function(event) {
    if (event.target === forgotModal) forgotModal.style.display = 'none';
  };
}
