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

    const navItems = document.querySelectorAll('.nav-item');
    const actionButtons = document.querySelectorAll('.action-btn');
    const mainContent = document.querySelector('.dashboard-content');

    const handleAction = (action) => {
        switch(action) {
            case 'dashboard':
                showDashboard();
                break;
            case 'archive':
                showArchive();
                break;
            case 'upload':
                showUpload();
                break;
            case 'logout':
                logout();
                break;
        }
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const action = item.querySelector('span').textContent.toLowerCase().replace(' ', '');
            handleAction(action);
        });
    });

    actionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            handleAction(action);
        });
    });

    function showDashboard() {
        mainContent.innerHTML = `
            <div class="search-bar-container">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" placeholder="Search projects...">
            </div>
            <h2 class="section-header">Recent Projects</h2>
            <div class="placeholder-grid">
            </div>
        `;
    }

    function showArchive() {
        mainContent.innerHTML = `
            <h2 class="section-header">Archived Projects</h2>
            <p>Here you can view archived projects.</p>
            <div class="placeholder-grid">
                <!-- Archived projects would go here -->
            </div>
        `;
    }

    function showUpload() {
        mainContent.innerHTML = `
            <h2 class="section-header">Upload Project</h2>
            <form id="uploadForm">
                <div class="input-group">
                    <label for="projectName">Project Name</label>
                    <input type="text" id="projectName" required>
                </div>
                <div class="input-group">
                    <label for="projectFile">Project File</label>
                    <input type="file" id="projectFile" required>
                </div>
                <button type="submit" class="btn">Upload</button>
            </form>
        `;

        const uploadForm = document.getElementById('uploadForm');
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Project uploaded successfully!');
            showDashboard(); 
        });
    }

    function logout() {
        if (confirm('Are you sure you want to log out?')) {
            window.location.href = 'login.html';
        }
    }
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
