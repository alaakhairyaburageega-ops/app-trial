// Authentication Routing Middleware & Session Controller
// Written in pure Vanilla JavaScript (No Frameworks) complying with 00_GLOBAL_RULES.md

window.currentUser = null;

(function() {
  const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');

  // Execute Session check immediately on page load
  document.addEventListener('DOMContentLoaded', async () => {
    if (isLoginPage) {
      // If user is already logged in, redirect them to dashboard directly
      try {
        const response = await fetch('/.netlify/functions/verify-session');
        if (response.ok) {
          window.location.href = './dashboard.html';
        }
      } catch (e) {
        console.warn('Session check bypass:', e);
      }
      setupLoginHandler();
    } else {
      // For secured dashboard/subjects pages
      await verifySession();
      setupHeaderNavbar();
    }
  });

  // Call session endpoint to verify current status
  async function verifySession() {
    try {
      const response = await fetch('/.netlify/functions/verify-session');
      if (!response.ok) {
        throw new Error('Unauthorized');
      }
      const data = await response.json();
      window.currentUser = data.teacher;
      console.log('Authenticated teacher session verified:', window.currentUser);
    } catch (error) {
      console.error('Session verification failed. Redirecting to login...', error);
      window.location.href = './index.html';
    }
  }

  // Handle Login form submit
  function setupLoginHandler() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('login-email');
      const passwordInput = document.getElementById('login-password');
      const btnSubmit = document.getElementById('btn-login-submit');
      const btnSubmitText = document.getElementById('btn-login-text');
      const errorMessage = document.getElementById('login-error-msg');

      // Clear old error messages
      errorMessage.style.display = 'none';
      errorMessage.textContent = '';

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        showError('يرجى ملء جميع الحقول المطلوبة.');
        return;
      }

      // Show spinner / loading visual
      btnSubmit.disabled = true;
      btnSubmitText.textContent = 'جاري تسجيل الدخول...';

      try {
        const response = await fetch('/.netlify/functions/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'فشل تسجيل الدخول.');
        }

        // Successfully logged in, redirect to dashboard
        window.location.href = './dashboard.html';

      } catch (error) {
        showError(error.message);
        btnSubmit.disabled = false;
        btnSubmitText.textContent = 'تسجيل الدخول';
      }
    });

    function showError(msg) {
      const errorMessage = document.getElementById('login-error-msg');
      errorMessage.textContent = msg;
      errorMessage.style.display = 'block';
    }
  }

  // Build/Configure header navigation links & logout handlers dynamically
  function setupHeaderNavbar() {
    // Set teacher name if exists in elements
    const nameEl = document.getElementById('teacher-name-display');
    if (nameEl && window.currentUser) {
      nameEl.textContent = window.currentUser.full_name;
    }

    // Set logout trigger
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await fetch('/.netlify/functions/logout');
        } catch (err) {
          console.error('Logout error:', err);
        }
        window.location.href = './index.html';
      });
    }
  }
})();
