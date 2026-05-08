const loginCard = document.querySelector('.login-card');
const dashboardSidebar = document.querySelector('.sidebar');

function getDashboardContent() {
    return document.querySelector('.content, .content-area, .dashboard-view');
}

function animateEntry() {
    if (!loginCard) return;
    loginCard.classList.add('animate-entry');
}

function animateDashboard() {
    const sidebar = document.querySelector('.sidebar');
    const content = getDashboardContent();

    if (!content) return;

    if (sidebar) {
        sidebar.style.opacity = '0';
        sidebar.style.transform = 'translateX(-24px)';
    }

    content.style.opacity = '0';
    content.style.transform = 'translateY(10px)';

    requestAnimationFrame(() => {
        if (sidebar) {
            sidebar.style.transition = 'opacity 0.55s ease-out, transform 0.55s ease-out';
            sidebar.style.opacity = '1';
            sidebar.style.transform = 'translateX(0)';
        }

        content.style.transition = 'opacity 0.65s ease-out, transform 0.65s ease-out';
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
    });
}

function showDashboard() {
    const dashboardContent = getDashboardContent();
    if (!dashboardContent) return;

    dashboardContent.innerHTML = `
        <div class="search-container">
            <div class="search-bar">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" placeholder="Search projects...">
            </div>
        </div>
        <section class="featured-section">
            <h2>Featured Project</h2>
            <p>Find your most important works here.</p>
        </section>
    `;
}

function showArchive() {
    const dashboardContent = getDashboardContent();
    if (!dashboardContent) return;

    dashboardContent.innerHTML = `
        <section class="featured-section">
            <h2>Archived Projects</h2>
            <p>Here you can view archived projects.</p>
            <div class="button-container">
                <button class="btn btn-download"><i class="fa-solid fa-download"></i> Download Selection</button>
                <button class="btn btn-rename"><i class="fa-solid fa-pen"></i> Rename</button>
            </div>
            <div class="archive-display">
                <div class="empty-state">No Archived Files</div>
            </div>
        </section>
    `;

    setupArchiveHandlers();
}

function setupArchiveHandlers() {
    const downloadBtn = document.querySelector('.btn-download');
    const renameBtn = document.querySelector('.btn-rename');
    const searchInput = document.querySelector('input[placeholder*="Search"]');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            alert('Download functionality - Selected archived files will be downloaded.');
        });
    }

    if (renameBtn) {
        renameBtn.addEventListener('click', () => {
            const archiveDisplay = document.querySelector('.archive-display');
            const fileName = prompt('Enter the new filename for the selected archive item:');
            if (!fileName) return;
            if (archiveDisplay) {
                archiveDisplay.innerHTML = `<div class="empty-state">Renamed to ${fileName}</div>`;
                setTimeout(() => {
                    archiveDisplay.innerHTML = '<div class="empty-state">No Archived Files</div>';
                }, 2000);
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filterArchiveContent(query);
        });
    }
}

function filterArchiveContent(query) {
    const archiveDisplay = document.querySelector('.archive-display');
    if (!archiveDisplay) return;

    if (query.trim() === '') {
        archiveDisplay.innerHTML = '<div class="empty-state">No Archived Files</div>';
    } else {
        archiveDisplay.innerHTML = `<p>Search results for "${query}"</p>`;
    }
}

function showUpload() {
    const dashboardContent = getDashboardContent();
    if (!dashboardContent) return;

    dashboardContent.innerHTML = `
        <section class="featured-section">
            <h2>Upload Project</h2>
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
        </section>
    `;

    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Project uploaded successfully!');
            showDashboard();
        });
    }
}

function logout() {
    window.location.href = 'login.html';
}

function setActiveNavItem(link) {
    if (!dashboardSidebar || !link) return;

    const activeItem = dashboardSidebar.querySelector('li.active, a.active');
    if (activeItem) {
        activeItem.classList.remove('active');
    }

    const parentLi = link.closest('li');
    if (parentLi) {
        parentLi.classList.add('active');
    } else {
        link.classList.add('active');
    }
}

function setupDashboard() {
    const dashboardContent = getDashboardContent();
    if (!dashboardContent) return;

    animateDashboard();

    if (!dashboardSidebar) return;

    const navLinks = dashboardSidebar.querySelectorAll('a');
    navLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            const targetPage = link.getAttribute('href');
            const currentPage = window.location.pathname.split('/').pop().toLowerCase();

            if (targetPage && targetPage.toLowerCase() === currentPage) {
                e.preventDefault();
                const text = link.textContent.trim().toLowerCase();
                if (text.includes('dashboard')) {
                    showDashboard();
                    setActiveNavItem(link);
                } else if (text.includes('archive')) {
                    showArchive();
                    setActiveNavItem(link);
                } else if (text.includes('upload')) {
                    showUpload();
                    setActiveNavItem(link);
                } else if (text.includes('log out') || text.includes('logout')) {
                    logout();
                }
            }
        });
    });

    const currentPage = window.location.pathname.split('/').pop().toLowerCase();
    const initialLink = dashboardSidebar.querySelector(`a[href="${currentPage}"]`) || Array.from(navLinks).find((link) => {
        const text = link.textContent.trim().toLowerCase();
        if (currentPage === 'dashboard.html') return text.includes('dashboard');
        if (currentPage === 'archive.html') return text.includes('archive');
        if (currentPage === 'upload.html') return text.includes('upload');
        return false;
    });
    if (initialLink) {
        setActiveNavItem(initialLink);
    }

    if (currentPage === 'archive.html') {
        setupArchiveHandlers();
    }
}

function createMessageElement(container) {
    let messageEl = container.querySelector('.login-message');
    if (messageEl) return messageEl;

    messageEl = document.createElement('p');
    messageEl.className = 'login-message';
    messageEl.style.margin = '0 0 20px';
    messageEl.style.fontSize = '0.95rem';
    messageEl.style.minHeight = '22px';

    if (container.querySelector('form')) {
        container.insertBefore(messageEl, container.querySelector('form'));
    } else {
        container.prepend(messageEl);
    }

    return messageEl;
}

function notifyLogin(messageEl, text, type) {
    if (!messageEl) return;

    messageEl.textContent = text;
    messageEl.style.color = type === 'error' ? '#d32f2f' : '#2e7d32';

    if (type === 'error' && loginCard) {
        loginCard.classList.add('shake-effect');
        setTimeout(() => loginCard.classList.remove('shake-effect'), 500);
    }
}

function setupLogin() {
    if (!loginCard) return;

    const form = loginCard.querySelector('form');
    const usernameInput = loginCard.querySelector('input[type="text"]');
    const passwordInput = loginCard.querySelector('input[type="password"]');
    const loginBtn = loginCard.querySelector('button[type="submit"], .login-btn, .login-button');
    const messageEl = createMessageElement(loginCard);

    if (!loginBtn) return;
    animateEntry();

    const submitHandler = (e) => {
        e.preventDefault();

        const usernameElement = loginCard.querySelector('.portal-pill-input[type="text"], input[type="text"]');
        const passwordElement = loginCard.querySelector('.portal-pill-input[type="password"], input[type="password"]');
        const user = usernameElement ? usernameElement.value.trim() : '';
        const pass = passwordElement ? passwordElement.value.trim() : '';

        if (!user || !pass) {
            notifyLogin(messageEl, 'Please enter both username and password.', 'error');
            return;
        }

        loginBtn.disabled = true;
        const originalText = loginBtn.textContent;
        loginBtn.textContent = 'Logging in...';

        setTimeout(() => {
            const currentPage = window.location.pathname.split('/').pop().toLowerCase();
            if (currentPage.includes('admin')) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }, 700);
    };

    if (form) {
        form.addEventListener('submit', submitHandler);
    }

    if (!form) {
        loginBtn.addEventListener('click', submitHandler);
    }
}

function handlePortalLogin(event) {
    event.preventDefault();
    const form = event.target.closest('form');
    if (!form) return;

    const usernameElement = form.querySelector('.portal-pill-input[type="text"], input[type="text"]');
    const passwordElement = form.querySelector('.portal-pill-input[type="password"], input[type="password"]');
    const user = usernameElement ? usernameElement.value.trim() : '';
    const pass = passwordElement ? passwordElement.value.trim() : '';

    if (!user || !pass) {
        const messageEl = createMessageElement(form);
        notifyLogin(messageEl, 'Please enter both username and password.', 'error');
        return;
    }

    const currentPage = window.location.pathname.split('/').pop().toLowerCase();
    if (currentPage.includes('admin')) {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupLogin();
    setupDashboard();
});

function showLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.style.display = 'none';
    }
}
/* Admin Portal Logout */
function showAdminLogout() {
    const modal = document.getElementById('adminLogoutModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeAdminLogout() {
    const modal = document.getElementById('adminLogoutModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function adminLogout() {
    window.location.href = 'login.html';
}

document.addEventListener('click', function(event) {
    const logoutModal = document.getElementById('logoutModal');
    if (logoutModal && event.target === logoutModal) {
        closeLogoutModal();
    }
    
    const adminModal = document.getElementById('adminLogoutModal');
    if (adminModal && event.target === adminModal) {
        closeAdminLogout();
    }
});