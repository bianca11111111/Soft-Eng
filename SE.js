const card = document.querySelector('.login-card');

function animateEntry() {
    if (!card) return;
    card.classList.add('animate-entry');
}

function shakeCard() {
    if (!card) return;

    card.classList.remove('shake');
    card.offsetWidth;
    card.classList.add('shake');

    card.addEventListener('animationend', () => {
        card.classList.remove('shake');
    }, { once: true });
}

function animateDashboard() {
    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.header-bar');
    const content = document.querySelector('.dashboard-content');

    if (!sidebar || !header || !content) return;

    window.requestAnimationFrame(() => {
        sidebar.classList.add('animate-in');
        header.classList.add('animate-in');
        content.classList.add('animate-in');
    });
}

window.animateEntry = animateEntry;
window.shakeCard = shakeCard;
window.animateDashboard = animateDashboard;

if (document.body.classList.contains('dashboard')) {
    animateDashboard();
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const spinner = document.getElementById('spinner');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const messageEl = document.getElementById('message');
    const showPassCheck = document.getElementById('showPassword');
    const rememberCheck = document.getElementById('rememberMe');
    const card = document.getElementById('loginCard');

    animateEntry();

    const savedUser = localStorage.getItem('ccs_remembered_user');
    if (savedUser) {
        usernameInput.value = savedUser;
        rememberCheck.checked = true;
    }

    const notify = (text, type) => {
        messageEl.textContent = text;
        messageEl.style.color = type === 'error' ? '#d32f2f' : '#2e7d32';
        if (type === 'error') {
            card.classList.add('shake-effect');
            setTimeout(() => card.classList.remove('shake-effect'), 500);
        }
    };

    showPassCheck.addEventListener('change', () => {
        passwordInput.type = showPassCheck.checked ? 'text' : 'password';
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        loginBtn.disabled = true;
        spinner.style.display = 'block';
        messageEl.textContent = ''; 

        const user = usernameInput.value.trim();
        const pass = passwordInput.value;

        setTimeout(() => {
            if (user.toLowerCase() === 'student' && pass === 'password123') {
                if (rememberCheck.checked) {
                    localStorage.setItem('ccs_remembered_user', user);
                } else {
                    localStorage.removeItem('ccs_remembered_user');
                }

                notify('Access Granted! Redirecting...', 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 800);

            } else if (user.toLowerCase() === 'faculty' && pass === 'faculty123') {
                notify('Welcome, Faculty. Redirecting...', 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 800);
            } else {
                loginBtn.disabled = false;
                spinner.style.display = 'none';
                notify('Invalid credentials. Please try again.', 'error');
                passwordInput.value = '';
                passwordInput.focus();
            }
        }, 1000); 
    });
});
