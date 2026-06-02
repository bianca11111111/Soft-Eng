// ============================================================
//  CCS Archive — Front-end application logic
//  Fully local: authentication + sessions via sessionStorage,
//  project metadata via localStorage, file blobs via IndexedDB.
//  No backend / Firebase required. Loaded as a classic script:
//      <script src="SE.js"></script>
// ============================================================

'use strict';

// ── Config ───────────────────────────────────────────────────
const ALLOWED_DOMAIN = '@gordoncollege.edu.ph';
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB per file
const MAX_NAME_LEN = 120;

const SESSION_KEY = 'ccs_session';
const STORAGE_KEY = 'ccs_archive_projects';
const DB_NAME = 'ccs_archive_db';
const DB_VERSION = 1;
const FILES_STORE = 'project_files';

// ============================================================
//  Small helpers
// ============================================================

function currentPage() {
    return (window.location.pathname.split('/').pop() || '').toLowerCase();
}

function isAdminPage() {
    return currentPage().includes('admin') || currentPage() === 'gradebook.html';
}

function normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
}

function enforceAllowedDomain(email) {
    const e = normalizeEmail(email);
    if (!e.endsWith(ALLOWED_DOMAIN)) {
        throw new Error(`Use your ${ALLOWED_DOMAIN} email address.`);
    }
    return e;
}

/** Student ID: 4-digit year + 5-digit school ID (e.g. 202211535). Password = last 5 digits. */
function parseStudentUsername(raw) {
    const input = (raw || '').trim().toLowerCase();
    if (!input) throw new Error('Student ID is required.');

    let studentId;
    if (input.includes('@')) {
        const local = input.split('@')[0];
        if (!input.endsWith(ALLOWED_DOMAIN)) {
            throw new Error(`Use your school email (${ALLOWED_DOMAIN}) or enter your 9-digit student ID.`);
        }
        studentId = local;
    } else {
        studentId = input;
    }

    if (!/^\d{9}$/.test(studentId)) {
        throw new Error('Student ID must be 9 digits: 4-digit year + 5-digit school ID (e.g. 202211535).');
    }

    const year = studentId.slice(0, 4);
    const schoolId = studentId.slice(4);
    const yearNum = parseInt(year, 10);
    if (yearNum < 2000 || yearNum > 2099) {
        throw new Error('The first 4 digits must be a valid enrollment year (e.g. 2022).');
    }

    return {
        studentId,
        year,
        schoolId,
        email: studentId + ALLOWED_DOMAIN
    };
}

function validateStudentLogin(username, password) {
    const parsed = parseStudentUsername(username);
    const pass = (password || '').trim();

    if (!pass) throw new Error('Password is required.');
    if (!/^\d{5}$/.test(pass)) {
        throw new Error('Password must be your 5-digit school ID (last 5 digits of your student number).');
    }
    if (pass !== parsed.schoolId) {
        throw new Error('Incorrect password. Use the last 5 digits of your student ID.');
    }

    return parsed;
}

/** Admin username: lastname.firstname (e.g. armada.arnie). Password = same name. */
function parseAdminUsername(raw) {
    const input = (raw || '').trim().toLowerCase();
    if (!input) throw new Error('Username is required.');

    let adminName;
    if (input.includes('@')) {
        if (!input.endsWith(ALLOWED_DOMAIN)) {
            throw new Error(`Use your ${ALLOWED_DOMAIN} email or enter your username (e.g. lastname.firstname).`);
        }
        adminName = input.split('@')[0];
    } else {
        adminName = input;
    }

    if (!/^[a-z0-9]+\.[a-z0-9]+$/.test(adminName)) {
        throw new Error('Username must be lastname.firstname format (e.g. armada.arnie).');
    }

    return {
        adminName,
        email: adminName + ALLOWED_DOMAIN
    };
}

function validateAdminLogin(username, password) {
    const parsed = parseAdminUsername(username);
    const pass = (password || '').trim().toLowerCase();

    if (!pass) throw new Error('Password is required.');
    if (pass !== parsed.adminName) {
        throw new Error('Incorrect password. Password must match your username (e.g. armada.arnie).');
    }

    return parsed;
}

function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0, n = bytes;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(iso) {
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch {
        return '';
    }
}

function fileIcon(type, name) {
    const t = (type || '') + ' ' + (name || '');
    if (/pdf/i.test(t)) return 'fa-file-pdf';
    if (/zip|rar|7z|tar|gz/i.test(t)) return 'fa-file-zipper';
    if (/image|png|jpe?g|gif|svg|webp/i.test(t)) return 'fa-file-image';
    if (/word|doc/i.test(t)) return 'fa-file-word';
    if (/excel|sheet|xls|csv/i.test(t)) return 'fa-file-excel';
    if (/powerpoint|presentation|ppt/i.test(t)) return 'fa-file-powerpoint';
    if (/text|txt|json|js|ts|html|css|md/i.test(t)) return 'fa-file-code';
    return 'fa-file';
}

// ============================================================
//  Toast notifications (replaces most alert() calls)
// ============================================================

function showToast(message, type = 'info', timeout = 3200) {
    let host = document.getElementById('toastHost');
    if (!host) {
        host = document.createElement('div');
        host.id = 'toastHost';
        host.className = 'toast-host';
        document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'fa-circle-check'
        : type === 'error' ? 'fa-circle-exclamation'
            : 'fa-circle-info';
    el.innerHTML = `<i class="fa-solid ${icon}"></i><span>${escapeHtml(message)}</span>`;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
    }, timeout);
}

// ============================================================
//  Session / Authentication (local only)
// ============================================================

function getSession() {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY));
    } catch {
        return null;
    }
}

function setSession(session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
}

function localLogin(username, password, role) {
    if (role === 'admin') {
        const parsed = validateAdminLogin(username, password);
        const user = {
            uid: 'admin_' + parsed.adminName,
            email: parsed.email,
            adminName: parsed.adminName,
            name: parsed.adminName,
            role: 'admin',
            loginAt: new Date().toISOString()
        };
        setSession(user);
        return user;
    }

    const parsed = validateStudentLogin(username, password);
    const user = {
        uid: 'student_' + parsed.studentId,
        email: parsed.email,
        studentId: parsed.studentId,
        schoolId: parsed.schoolId,
        year: parsed.year,
        name: parsed.studentId,
        role: 'student',
        loginAt: new Date().toISOString()
    };
    setSession(user);
    return user;
}

function logout() {
    clearSession();
    window.location.href = 'login.html';
}

function adminLogout() {
    clearSession();
    window.location.href = 'admin-login.html';
}

function sendPasswordReset() {
    // No email backend in local mode. Surface a friendly message instead of failing.
    showToast('This is a local demo — ask an admin to reset your password.', 'info', 4000);
    return Promise.resolve();
}

/** Auth guard. Redirects to the appropriate login page when not authorized. */
function requireAuth(adminOnly = false) {
    const session = getSession();
    if (!session) {
        window.location.href = adminOnly ? 'admin-login.html' : 'login.html';
        return false;
    }
    if (adminOnly && session.role !== 'admin') {
        window.location.href = 'admin-login.html';
        return false;
    }
    return true;
}

// ============================================================
//  IndexedDB — file blob storage
// ============================================================

let _dbPromise = null;

function openDB() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(FILES_STORE)) {
                db.createObjectStore(FILES_STORE, { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    return _dbPromise;
}

async function storeFile(id, dataURL) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(FILES_STORE, 'readwrite');
        tx.objectStore(FILES_STORE).put({ id, data: dataURL });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
}

async function retrieveFile(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(FILES_STORE, 'readonly');
        const req = tx.objectStore(FILES_STORE).get(id);
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => reject(req.error);
    });
}

async function deleteFile(id) {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction(FILES_STORE, 'readwrite');
        tx.objectStore(FILES_STORE).delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
    });
}

function dataURLtoBlob(dataURL) {
    const [meta, b64] = dataURL.split(',');
    const mime = (meta.match(/:(.*?);/) || [])[1] || 'application/octet-stream';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

// ============================================================
//  Project persistence (metadata in localStorage)
// ============================================================

function getStoredProjects() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error reading projects:', e);
        return [];
    }
}

function saveStoredProjects(projects) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        return true;
    } catch (e) {
        console.error('Error saving projects:', e);
        showToast('Could not save — browser storage may be full.', 'error');
        return false;
    }
}

function createProject({ name, fileName, fileType, fileSize }) {
    const session = getSession();
    const projects = getStoredProjects();
    const project = {
        id: 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        name,
        fileName,
        fileType: fileType || '',
        fileSize: fileSize || 0,
        ownerId: session ? session.uid : 'unknown',
        ownerEmail: session ? session.email : 'unknown',
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    projects.push(project);
    saveStoredProjects(projects);
    return project;
}

function getMyProjects() {
    const session = getSession();
    const projects = getStoredProjects();
    if (!session || session.role === 'admin') return projects;
    return projects.filter(p => p.ownerEmail === session.email);
}

function getAllProjects() {
    return getStoredProjects();
}

function renameProject(projectId, newName) {
    const projects = getStoredProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
        project.name = newName;
        saveStoredProjects(projects);
    }
}

function setProjectDecision(projectId, decision) {
    const projects = getStoredProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
        project.status = decision;
        saveStoredProjects(projects);
    }
}

async function deleteProject(projectId) {
    const projects = getStoredProjects();
    saveStoredProjects(projects.filter(p => p.id !== projectId));
    await deleteFile(projectId);
}

// ============================================================
//  File upload (reads file, stores blob in IndexedDB)
// ============================================================

function readFileAsDataURL(file, onProgress) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (e) => {
            if (onProgress && e.lengthComputable) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };
        reader.onload = () => { if (onProgress) onProgress(100); resolve(reader.result); };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// ============================================================
//  File open / download (retrieves blob from IndexedDB)
// ============================================================

async function openProject(projectId) {
    const dataURL = await retrieveFile(projectId);
    if (!dataURL) { showToast('File data not found.', 'error'); return; }
    const url = URL.createObjectURL(dataURLtoBlob(dataURL));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function downloadProject(projectId) {
    const projects = getStoredProjects();
    const project = projects.find(p => p.id === projectId);
    const dataURL = await retrieveFile(projectId);
    if (!dataURL) { showToast('File data not found.', 'error'); return; }
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = (project && project.fileName) || (project && project.name) || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// ============================================================
//  Demo data (helps test the app with one click)
// ============================================================

async function seedDemoData() {
    const session = getSession();
    const samples = [
        { name: 'Capstone — Library System', body: 'Demo documentation for the Library Management System capstone project.' },
        { name: 'Thesis — IoT Weather Station', body: 'Abstract and chapters for the IoT Weather Station thesis.' },
        { name: 'Final Project — POS App', body: 'Source overview and manual for the Point-of-Sale application.' }
    ];
    for (const s of samples) {
        const dataURL = 'data:text/plain;base64,' + btoa(unescape(encodeURIComponent(s.body)));
        const project = createProject({
            name: s.name,
            fileName: s.name.replace(/[^a-z0-9]+/gi, '_') + '.txt',
            fileType: 'text/plain',
            fileSize: s.body.length
        });
        await storeFile(project.id, dataURL);
    }
    showToast('Demo projects added.', 'success');
    const page = currentPage();
    if (page === 'archive.html') showArchive();
    else if (page === 'admin.html') showAdminDashboard();
    else showDashboard();
}

// ============================================================
//  UI — content host + animations
// ============================================================

const loginCard = document.querySelector('.login-card');
const dashboardSidebar = document.querySelector('.sidebar');

function getDashboardContent() {
    return document.querySelector('.dashboard-view, .gradebook-view, .content, .content-area, main');
}

function animateEntry() {
    if (loginCard) loginCard.classList.add('animate-entry');
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
            sidebar.style.transition = 'opacity .55s ease-out, transform .55s ease-out';
            sidebar.style.opacity = '1';
            sidebar.style.transform = 'translateX(0)';
        }
        content.style.transition = 'opacity .65s ease-out, transform .65s ease-out';
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
    });
}

function applyUserChrome() {
    const session = getSession();
    if (!session) return;
    const roleText = document.querySelector('.role-text-brown');
    if (roleText) roleText.title = session.email;
}

// ============================================================
//  UI — Student dashboard / archive / upload
// ============================================================

function showDashboard() {
    const host = getDashboardContent();
    if (!host) return;
    host.innerHTML = `
        <div class="search-container">
            <div class="search-bar search-input-group">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="dashSearch" placeholder="Search projects...">
            </div>
        </div>
        <section class="featured-section">
            <h2>My Projects</h2>
            <p>All your uploaded projects and their review status.</p>
            <div id="dashProjectList" class="archive-display"><div class="empty-state">Loading…</div></div>
        </section>`;

    const projects = getMyProjects();
    renderProjectList('dashProjectList', projects);

    const search = document.getElementById('dashSearch');
    if (search) {
        search.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            renderProjectList('dashProjectList', projects.filter(p => p.name.toLowerCase().includes(q)));
        });
    }
}

function showArchive() {
    const host = getDashboardContent();
    if (!host) return;
    host.innerHTML = `
        <section class="featured-section">
            <h2>Archived Projects</h2>
            <p>Select projects to download, rename, or delete.</p>
            <div class="button-container">
                <button class="btn btn-download"><i class="fa-solid fa-download"></i> Download</button>
                <button class="btn btn-rename"><i class="fa-solid fa-pen"></i> Rename</button>
                <button class="btn btn-delete" style="background:#c0392b;"><i class="fa-solid fa-trash"></i> Delete</button>
            </div>
            <div class="archive-display" id="archiveList"><div class="empty-state">Loading…</div></div>
        </section>`;

    const projects = getMyProjects();
    renderProjectList('archiveList', projects, true);
    setupArchiveHandlers(projects);
}

function renderProjectList(containerId, projects, selectable = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!projects.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="text-align:center">
                    <p style="margin-bottom:14px">No projects yet.</p>
                    <button class="btn" onclick="seedDemoData()"><i class="fa-solid fa-flask"></i> Load demo data</button>
                </div>
            </div>`;
        return;
    }

    container.innerHTML = projects.map(p => `
        <div class="project-item" data-id="${p.id}" data-name="${escapeHtml(p.name)}">
            ${selectable ? `<input type="checkbox" class="project-check" data-id="${p.id}">` : ''}
            <i class="fa-solid ${fileIcon(p.fileType, p.fileName)} project-icon"></i>
            <div class="project-info">
                <span class="project-name">${escapeHtml(p.name)}</span>
                <span class="project-meta">${escapeHtml(p.fileName || '')} · ${formatBytes(p.fileSize)} · ${formatDate(p.createdAt)}</span>
            </div>
            <span class="project-status status-${escapeHtml(p.status)}">${escapeHtml(p.status)}</span>
            <div class="project-actions">
                <button class="icon-btn" data-action="open" data-id="${p.id}" title="Open"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
                <button class="icon-btn" data-action="download" data-id="${p.id}" title="Download"><i class="fa-solid fa-download"></i></button>
            </div>
        </div>`).join('');

    container.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            if (btn.dataset.action === 'open') openProject(id);
            else downloadProject(id);
        });
    });
}

function getCheckedItems() {
    return Array.from(document.querySelectorAll('.project-check:checked')).map(cb => ({
        id: cb.dataset.id,
        name: cb.closest('.project-item')?.dataset.name || ''
    }));
}

function setupArchiveHandlers(projects) {
    const downloadBtn = document.querySelector('.btn-download');
    const renameBtn = document.querySelector('.btn-rename');
    const deleteBtn = document.querySelector('.btn-delete');

    if (downloadBtn) downloadBtn.addEventListener('click', () => {
        const checked = getCheckedItems();
        if (!checked.length) { showToast('Select at least one project to download.', 'error'); return; }
        checked.forEach(item => downloadProject(item.id));
    });

    if (renameBtn) renameBtn.addEventListener('click', () => {
        const checked = getCheckedItems();
        if (checked.length !== 1) { showToast('Select exactly one project to rename.', 'error'); return; }
        const newName = prompt('Enter new project name:', checked[0].name);
        if (!newName || !newName.trim()) return;
        if (newName.trim().length > MAX_NAME_LEN) { showToast(`Name must be ${MAX_NAME_LEN} characters or fewer.`, 'error'); return; }
        renameProject(checked[0].id, newName.trim());
        showToast('Project renamed.', 'success');
        showArchive();
    });

    if (deleteBtn) deleteBtn.addEventListener('click', async () => {
        const checked = getCheckedItems();
        if (!checked.length) { showToast('Select at least one project to delete.', 'error'); return; }
        if (!confirm(`Delete ${checked.length} project(s)? This cannot be undone.`)) return;
        await Promise.all(checked.map(item => deleteProject(item.id)));
        showToast('Deleted.', 'success');
        showArchive();
    });
}

function showUpload() {
    const host = getDashboardContent();
    if (!host) return;
    host.innerHTML = `
        <section class="featured-section">
            <h2>Upload Project</h2>
            <p>Add a project file to your archive. Max size ${formatBytes(MAX_FILE_BYTES)}.</p>
            <div class="upload-form">
                <div class="input-group">
                    <label for="projectName">Project Name</label>
                    <input type="text" id="projectName" maxlength="${MAX_NAME_LEN}" placeholder="e.g. Capstone — Inventory System">
                </div>
                <div class="input-group">
                    <label for="projectFile">Project File</label>
                    <input type="file" id="projectFile">
                </div>
                <div id="uploadProgress" style="display:none; margin:10px 0;">
                    <progress id="progressBar" value="0" max="100" style="width:100%;"></progress>
                    <span id="progressText">0%</span>
                </div>
                <p id="uploadMsg" style="min-height:20px;"></p>
                <button id="uploadSubmitBtn" class="btn"><i class="fa-solid fa-upload"></i> Upload</button>
            </div>
        </section>`;

    document.getElementById('uploadSubmitBtn').addEventListener('click', async () => {
        const nameInput = document.getElementById('projectName');
        const fileInput = document.getElementById('projectFile');
        const msgEl = document.getElementById('uploadMsg');
        const progressWrap = document.getElementById('uploadProgress');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const btn = document.getElementById('uploadSubmitBtn');

        const name = nameInput.value.trim();
        const file = fileInput.files[0];

        const fail = (m) => { msgEl.textContent = m; msgEl.style.color = '#d32f2f'; };
        msgEl.textContent = '';

        if (!name) return fail('Please enter a project name.');
        if (name.length > MAX_NAME_LEN) return fail(`Name must be ${MAX_NAME_LEN} characters or fewer.`);
        if (!file) return fail('Please choose a file to upload.');
        if (file.size > MAX_FILE_BYTES) return fail(`File is too large (max ${formatBytes(MAX_FILE_BYTES)}).`);

        btn.disabled = true;
        btn.textContent = 'Uploading…';
        progressWrap.style.display = 'block';

        try {
            const dataURL = await readFileAsDataURL(file, (pct) => {
                progressBar.value = pct;
                progressText.textContent = pct + '%';
            });
            const project = createProject({
                name,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size
            });
            await storeFile(project.id, dataURL);

            msgEl.textContent = 'Project uploaded successfully!';
            msgEl.style.color = '#2e7d32';
            showToast('Project uploaded.', 'success');
            setTimeout(() => showDashboard(), 1000);
        } catch (err) {
            fail('Upload failed: ' + err.message);
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-upload"></i> Upload';
        }
    });
}

// ============================================================
//  UI — Admin dashboard + gradebook
// ============================================================

function showAdminDashboard() {
    const host = getDashboardContent();
    if (!host) return;
    const projects = getAllProjects();
    const total = projects.length;
    const pending = projects.filter(p => p.status === 'pending').length;
    const approved = projects.filter(p => p.status === 'approved').length;
    const rejected = projects.filter(p => p.status === 'rejected').length;
    const recent = [...projects].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5);

    host.innerHTML = `
        <section class="featured-section">
            <h2>Admin Overview</h2>
            <div class="stats-grid">
                <div class="stat-card"><span class="stat-num">${total}</span><span class="stat-label">Total Projects</span></div>
                <div class="stat-card"><span class="stat-num">${pending}</span><span class="stat-label">Pending</span></div>
                <div class="stat-card"><span class="stat-num">${approved}</span><span class="stat-label">Approved</span></div>
                <div class="stat-card"><span class="stat-num">${rejected}</span><span class="stat-label">Rejected</span></div>
            </div>
            <h2 style="margin-top:30px">Recent Submissions</h2>
            <div id="adminRecent" class="archive-display"></div>
            <div style="margin-top:16px"><a class="btn" href="gradebook.html"><i class="fa-solid fa-book"></i> Open Gradebook</a></div>
        </section>`;

    renderProjectList('adminRecent', recent);
}

function loadGradebook() {
    const tableData = document.querySelector('.table-data-placeholder');
    if (!tableData) return;
    tableData.innerHTML = '<p style="padding:12px">Loading…</p>';

    try {
        const projects = getAllProjects();
        const decisionBox = document.querySelector('.decision-dropdown-placeholder');

        if (!projects.length) {
            tableData.innerHTML = '<p style="padding:12px;color:#777">No submissions yet.</p>';
            if (decisionBox) decisionBox.classList.remove('visible');
            return;
        }

        tableData.innerHTML = projects.map(p => `
            <div class="table-row" data-id="${p.id}">
                <span class="cell-student-id">${escapeHtml(p.ownerEmail || p.ownerId)}</span>
                <span class="cell-project-title">${escapeHtml(p.name)}</span>
                <span class="cell-doc-status status-${escapeHtml(p.status)}">${escapeHtml(p.status)}</span>
                <select class="decision-select" data-id="${p.id}">
                    <option value="pending"  ${p.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="approved" ${p.status === 'approved' ? 'selected' : ''}>Approved</option>
                    <option value="rejected" ${p.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
            </div>`).join('');

        tableData.querySelectorAll('.decision-select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const val = e.target.value;
                setProjectDecision(id, val);
                const cell = e.target.closest('.table-row').querySelector('.cell-doc-status');
                if (cell) {
                    cell.textContent = val;
                    cell.className = 'cell-doc-status status-' + val;
                }
                showToast('Decision updated.', 'success');
            });
        });

        if (decisionBox) decisionBox.classList.add('visible');
    } catch (err) {
        tableData.innerHTML = `<p style="color:#c0392b;padding:12px">Error: ${escapeHtml(err.message)}</p>`;
    }
}

// ============================================================
//  UI — Navigation highlight + page routing
// ============================================================

function highlightActiveNav() {
    if (!dashboardSidebar) return;
    const page = currentPage();
    const link = dashboardSidebar.querySelector(`a[href="${page}"]`);
    if (!link) return;
    dashboardSidebar.querySelectorAll('li.active').forEach(li => li.classList.remove('active'));
    const li = link.closest('li');
    if (li) li.classList.add('active');
}

function setupDashboard() {
    const host = getDashboardContent();
    if (!host || loginCard) return; // skip on login pages

    animateDashboard();
    highlightActiveNav();
    applyUserChrome();

    switch (currentPage()) {
        case 'dashboard.html': showDashboard(); break;
        case 'archive.html': showArchive(); break;
        case 'upload.html': showUpload(); break;
        case 'admin.html': showAdminDashboard(); break;
        case 'gradebook.html': loadGradebook(); break;
    }
}

// ============================================================
//  UI — Login form
// ============================================================

function createMessageElement(container) {
    let messageEl = container.querySelector('.login-message');
    if (messageEl) return messageEl;
    messageEl = document.createElement('p');
    messageEl.className = 'login-message';
    messageEl.style.cssText = 'margin:0 0 16px;font-size:.95rem;min-height:22px;';
    const firstField = container.querySelector('.input-field');
    if (firstField) container.insertBefore(messageEl, firstField);
    else container.prepend(messageEl);
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

    const role = isAdminPage() ? 'admin' : 'student';
    const form = loginCard.querySelector('form');
    const loginBtn = loginCard.querySelector('button[type="submit"], .login-btn, .login-button');
    const messageEl = createMessageElement(loginCard);
    if (!loginBtn) return;

    animateEntry();

    const forgotLink = document.querySelector('.forgot-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            sendPasswordReset();
        });
    }

    const submitHandler = (e) => {
        if (e) e.preventDefault();
        const emailEl = loginCard.querySelector('input[type="text"], input[type="email"]');
        const passEl = loginCard.querySelector('input[type="password"]');
        const email = emailEl ? emailEl.value.trim() : '';
        const pass = passEl ? passEl.value.trim() : '';

        if (!email || !pass) {
            const missing = role === 'admin'
                ? 'Please enter your username and password.'
                : 'Please enter your student ID and password.';
            notifyLogin(messageEl, missing, 'error');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in…';

        try {
            localLogin(email, pass, role);
            window.location.href = role === 'admin' ? 'admin.html' : 'dashboard.html';
        } catch (err) {
            notifyLogin(messageEl, err.message || 'Login failed.', 'error');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Log in';
        }
    };

    if (form) form.addEventListener('submit', submitHandler);
    else loginBtn.addEventListener('click', submitHandler);

    // Allow Enter key to submit even without a <form>
    loginCard.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitHandler(e); });
    });
}

// ============================================================
//  UI — Modals + dropdown
// ============================================================

function showLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) modal.style.display = 'flex';
}
function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) modal.style.display = 'none';
}
function showAdminLogout() {
    const modal = document.getElementById('adminLogoutModal');
    if (modal) modal.style.display = 'flex';
}
function closeAdminLogout() {
    const modal = document.getElementById('adminLogoutModal');
    if (modal) modal.style.display = 'none';
}
function toggleDropdown() {
    const list = document.getElementById('dropdownList');
    if (list) list.classList.toggle('show');
}

document.addEventListener('click', (event) => {
    const logoutModal = document.getElementById('logoutModal');
    if (logoutModal && event.target === logoutModal) closeLogoutModal();
    const adminModal = document.getElementById('adminLogoutModal');
    if (adminModal && event.target === adminModal) closeAdminLogout();
});

// ── Expose helpers for inline onclick="" handlers ────────────
window.showLogoutModal = showLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.showAdminLogout = showAdminLogout;
window.closeAdminLogout = closeAdminLogout;
window.adminLogout = adminLogout;
window.logout = logout;
window.toggleDropdown = toggleDropdown;
window.seedDemoData = seedDemoData;

// ============================================================
//  Bootstrap
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const page = currentPage();
    const protectedStudent = ['dashboard.html', 'archive.html', 'upload.html'];
    const protectedAdmin = ['admin.html', 'gradebook.html'];

    if (protectedStudent.includes(page) && !requireAuth(false)) return;
    if (protectedAdmin.includes(page) && !requireAuth(true)) return;

    setupLogin();
    setupDashboard();
});
