// ============================================================
// Firebase SDK (ESM via CDN)
// NOTE:
// Your HTML files currently include: <script src="SE.js"></script>
// WITHOUT type="module". ES module imports require type="module".
// Instead of modifying all HTML files, we will keep SE.js as a classic
// script by dynamically importing the Firebase modules.
// ============================================================

let _firebase = null;
async function getFirebase() {
    if (_firebase) return _firebase;

    const [appMod, analyticsMod, authMod, fsMod, storageMod] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js"),
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"),
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"),
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js")
    ]);

    _firebase = {
        initializeApp: appMod.initializeApp,
        getAnalytics: analyticsMod.getAnalytics,
        getAuth: authMod.getAuth,
        signInWithEmailAndPassword: authMod.signInWithEmailAndPassword,
        signOut: authMod.signOut,
        onAuthStateChanged: authMod.onAuthStateChanged,
        sendPasswordResetEmail: authMod.sendPasswordResetEmail,
        getFirestore: fsMod.getFirestore,
        collection: fsMod.collection,
        addDoc: fsMod.addDoc,
        getDocs: fsMod.getDocs,
        getDoc: fsMod.getDoc,
        doc: fsMod.doc,
        updateDoc: fsMod.updateDoc,
        deleteDoc: fsMod.deleteDoc,
        query: fsMod.query,
        where: fsMod.where,
        orderBy: fsMod.orderBy,
        serverTimestamp: fsMod.serverTimestamp,
        getStorage: storageMod.getStorage,
        ref: storageMod.ref,
        uploadBytesResumable: storageMod.uploadBytesResumable,
        getDownloadURL: storageMod.getDownloadURL,
        deleteObject: storageMod.deleteObject
    };

    return _firebase;
}


// ── Firebase Config ──────────────────────────────────────────
// Default config is set at runtime (student/admin). You must provide both configs.
// These values must be replaced with your real Firebase project credentials.
const STUDENT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyAzbkWbMPZcU1BgzzeprX4XKbesXl9Kowg",
    authDomain: "app-dev-id-b4ae6.firebaseapp.com",
    projectId: "app-dev-id-b4ae6",
    storageBucket: "app-dev-id-b4ae6.firebasestorage.app",
    messagingSenderId: "102198222058",
    appId: "1:102198222058:web:4230eaccf55341f2ca0b93",
    measurementId: "G-21QPT26KYC"
};

const ADMIN_FIREBASE_CONFIG = {
    apiKey: "AIzaSyAzbkWbMPZcU1BgzzeprX4XKbesXl9Kowg",
    authDomain: "app-dev-id-b4ae6.firebaseapp.com",
    projectId: "app-dev-id-b4ae6",
    storageBucket: "app-dev-id-b4ae6.firebasestorage.app",
    messagingSenderId: "102198222058",
    appId: "1:102198222058:web:4230eaccf55341f2ca0b93",
    measurementId: "G-21QPT26KYC"
};

// Will be initialized after dynamic imports
let initializeApp, getAnalytics, getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail;
let getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp;
let getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject;

let auth, db, storage;

function normalizePageName(page) {
    return page
        .toLowerCase()
        .replace(/\.html$/, '')
        .replace(/[\s_]+/g, '-');
}

function pickModeFromPage() {
    const page = normalizePageName(window.location.pathname.split('/').pop());
    // New folders/files requested:
    // - student_login.html / student-login / student login.html
    // - admin-login.html / admin login.html / admin_login.html
    if (page.startsWith('admin-') || page === 'admin' || page === 'gradebook') return 'admin';
    if (page.startsWith('student-') || page === 'student') return 'student';

    // Backward compatibility for your existing pages:
    if (page === 'admin') return 'admin';
    if (page === 'gradebook') return 'admin';
    return 'student';
}

function getConfigForMode(mode) {
    return mode === 'admin' ? ADMIN_FIREBASE_CONFIG : STUDENT_FIREBASE_CONFIG;
}

async function initFirebase() {
    const f = await getFirebase();
    const mode = pickModeFromPage();
    const firebaseConfig = getConfigForMode(mode);

    initializeApp = f.initializeApp;
    getAnalytics = f.getAnalytics;
    getAuth = f.getAuth;
    signInWithEmailAndPassword = f.signInWithEmailAndPassword;
    signOut = f.signOut;
    onAuthStateChanged = f.onAuthStateChanged;
    sendPasswordResetEmail = f.sendPasswordResetEmail;

    getFirestore = f.getFirestore;
    collection = f.collection;
    addDoc = f.addDoc;
    getDocs = f.getDocs;
    getDoc = f.getDoc;
    doc = f.doc;
    updateDoc = f.updateDoc;
    deleteDoc = f.deleteDoc;
    query = f.query;
    where = f.where;
    orderBy = f.orderBy;
    serverTimestamp = f.serverTimestamp;

    getStorage = f.getStorage;
    ref = f.ref;
    uploadBytesResumable = f.uploadBytesResumable;
    getDownloadURL = f.getDownloadURL;
    deleteObject = f.deleteObject;

    const app = initializeApp(firebaseConfig);
    getAnalytics(app);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
}


// ── Expose helpers globally so inline onclick="" still works ──
window.showLogoutModal  = showLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.showAdminLogout  = showAdminLogout;
window.closeAdminLogout = closeAdminLogout;
window.adminLogout      = adminLogout;
window.logout           = logout;
window.toggleDropdown   = toggleDropdown;

// ============================================================
//  AUTH  ─ Login / Logout
// ============================================================

/**
 * Unified login.
 * - Admin pages  → admin.html  (must be in Firebase Auth + role="admin" in Firestore users/{uid})
 * - Student pages → dashboard.html
 */
function normalizeEmail(email) {
    const trimmed = (email || '').trim();
    return trimmed.toLowerCase();
}

function enforceAllowedDomain(email) {
    const e = normalizeEmail(email);
    const domain = "@gordoncollege.edu.ph";
    if (!e.endsWith(domain)) {
        throw new Error(`Use your ${domain} email address.`);
    }
    return e;
}

async function firebaseLogin(email, password) {
    const allowedEmail = enforceAllowedDomain(email);
    const credential = await signInWithEmailAndPassword(auth, allowedEmail, password);
    return credential.user;
}

async function getUserRole(uid) {
    try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) return snap.data().role || "student";
    } catch (_) {}
    return "student";
}

async function logout() {
    await signOut(auth);
    window.location.href = "login.html";
}

async function adminLogout() {
    await signOut(auth);
    window.location.href = "admin-login.html";
}

/** Forgot-password email */
async function sendPasswordReset(email) {
    const allowedEmail = enforceAllowedDomain(email);
    await sendPasswordResetEmail(auth, allowedEmail);
}

function getLoginPage(adminOnly = false) {
    return adminOnly ? "admin-login.html" : "login.html";
}

// ── Auth state guard ─────────────────────────────────────────
// Call this on protected pages to redirect unauthenticated users.
function requireAuth(adminOnly = false) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = getLoginPage(adminOnly);
            return;
        }
        if (adminOnly) {
            const role = await getUserRole(user.uid);
            if (role !== "admin") {
                await signOut(auth);
                window.location.href = getLoginPage(true);
            }
        }
    });
}

// ============================================================
//  FIRESTORE CRUD  ─ Projects
// ============================================================

/** Create a project document (called after file upload) */
async function createProject({ name, fileURL, fileName, storagePath }) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    return addDoc(collection(db, "projects"), {
        name,
        fileURL,
        fileName,
        storagePath,
        ownerId: user.uid,
        ownerEmail: user.email,
        status: "pending",          // pending | approved | rejected
        createdAt: serverTimestamp()
    });
}

/** Read all projects for the current student */
async function getMyProjects() {
    const user = auth.currentUser;
    if (!user) return [];
    const q = query(
        collection(db, "projects"),
        where("ownerId", "==", user.uid),
        orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Read ALL projects (admin only) */
async function getAllProjects() {
    const snap = await getDocs(query(collection(db, "projects"), orderBy("createdAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Update a project's name */
async function renameProject(projectId, newName) {
    await updateDoc(doc(db, "projects", projectId), { name: newName });
}

/** Update project decision (admin) */
async function setProjectDecision(projectId, decision) {
    await updateDoc(doc(db, "projects", projectId), { status: decision });
}

/** Delete a project document + its Storage file */
async function deleteProject(projectId, storagePath) {
    await deleteDoc(doc(db, "projects", projectId));
    if (storagePath) {
        try { await deleteObject(ref(storage, storagePath)); } catch (_) {}
    }
}

// ============================================================
//  STORAGE  ─ File Upload
// ============================================================

/**
 * Uploads a file to Firebase Storage and returns { fileURL, storagePath }.
 * @param {File}   file
 * @param {string} projectName
 * @param {function} onProgress  - called with 0-100 percent
 */
function uploadFile(file, projectName, onProgress) {
    return new Promise((resolve, reject) => {
        const user = auth.currentUser;
        if (!user) return reject(new Error("Not authenticated"));

        const safeName   = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `projects/${user.uid}/${Date.now()}_${safeName}`;
        const storageRef  = ref(storage, storagePath);
        const task        = uploadBytesResumable(storageRef, file);

        task.on(
            "state_changed",
            (snap) => {
                const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                if (typeof onProgress === "function") onProgress(pct);
            },
            reject,
            async () => {
                const fileURL = await getDownloadURL(task.snapshot.ref);
                resolve({ fileURL, storagePath, fileName: file.name });
            }
        );
    });
}

// ============================================================
//  FIRESTORE CRUD  ─ Gradebook (Admin)
// ============================================================

/** Admin sets a grade/decision on a project */
async function upsertGrade(projectId, gradeData) {
    const ref_ = doc(db, "grades", projectId);
    await updateDoc(ref_, { ...gradeData, updatedAt: serverTimestamp() })
        .catch(() => addDoc(collection(db, "grades"), { projectId, ...gradeData, updatedAt: serverTimestamp() }));
}

/** Get all grades (admin) */
async function getAllGrades() {
    const snap = await getDocs(collection(db, "grades"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ============================================================
//  UI  ─ Animations
// ============================================================

const loginCard       = document.querySelector('.login-card');
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

// ============================================================
//  UI  ─ Dashboard / Archive / Upload views
// ============================================================

async function showDashboard() {
    const dashboardContent = getDashboardContent();
    if (!dashboardContent) return;

    dashboardContent.innerHTML = `
        <div class="search-container">
            <div class="search-bar">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="dashSearch" placeholder="Search projects...">
            </div>
        </div>
        <section class="featured-section">
            <h2>Featured Project</h2>
            <p>Find your most important works here.</p>
            <div id="dashProjectList" class="archive-display"><div class="empty-state">Loading...</div></div>
        </section>`;

    const projects = await getMyProjects();
    renderProjectList("dashProjectList", projects);

    document.getElementById("dashSearch").addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = projects.filter(p => p.name.toLowerCase().includes(q));
        renderProjectList("dashProjectList", filtered);
    });
}

async function showArchive() {
    const dashboardContent = getDashboardContent();
    if (!dashboardContent) return;

    dashboardContent.innerHTML = `
        <section class="featured-section">
            <h2>Archived Projects</h2>
            <p>Here you can view your uploaded projects.</p>
            <div class="button-container">
                <button class="btn btn-download"><i class="fa-solid fa-download"></i> Download Selection</button>
                <button class="btn btn-rename"><i class="fa-solid fa-pen"></i> Rename</button>
                <button class="btn btn-delete" style="background:#c0392b;color:#fff;"><i class="fa-solid fa-trash"></i> Delete</button>
            </div>
            <div class="archive-display" id="archiveList"><div class="empty-state">Loading...</div></div>
        </section>`;

    const projects = await getMyProjects();
    renderProjectList("archiveList", projects, true);
    setupArchiveHandlers(projects);
}

function renderProjectList(containerId, projects, selectable = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!projects.length) {
        container.innerHTML = '<div class="empty-state">No Files Found</div>';
        return;
    }

    container.innerHTML = projects.map(p => `
        <div class="project-item" data-id="${p.id}" data-storage="${p.storagePath || ''}" data-name="${p.name}">
            ${selectable ? `<input type="checkbox" class="project-check" data-id="${p.id}" data-storage="${p.storagePath || ''}">` : ''}
            <span class="project-name">${p.name}</span>
            <span class="project-status status-${p.status}">${p.status}</span>
            <a class="project-link" href="${p.fileURL}" target="_blank" rel="noopener">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Open
            </a>
        </div>`).join('');
}

function setupArchiveHandlers(projects) {
    const downloadBtn = document.querySelector('.btn-download');
    const renameBtn   = document.querySelector('.btn-rename');
    const deleteBtn   = document.querySelector('.btn-delete');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const checked = getCheckedItems();
            if (!checked.length) { alert('Select at least one file to download.'); return; }
            checked.forEach(item => {
                const proj = projects.find(p => p.id === item.id);
                if (proj) window.open(proj.fileURL, '_blank');
            });
        });
    }

    if (renameBtn) {
        renameBtn.addEventListener('click', async () => {
            const checked = getCheckedItems();
            if (checked.length !== 1) { alert('Select exactly one file to rename.'); return; }
            const newName = prompt('Enter new project name:', checked[0].name);
            if (!newName || !newName.trim()) return;
            try {
                await renameProject(checked[0].id, newName.trim());
                await showArchive();
            } catch (err) {
                alert('Rename failed: ' + err.message);
            }
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            const checked = getCheckedItems();
            if (!checked.length) { alert('Select at least one file to delete.'); return; }
            if (!confirm(`Delete ${checked.length} project(s)? This cannot be undone.`)) return;
            try {
                await Promise.all(checked.map(item => deleteProject(item.id, item.storagePath)));
                await showArchive();
            } catch (err) {
                alert('Delete failed: ' + err.message);
            }
        });
    }
}

function getCheckedItems() {
    return Array.from(document.querySelectorAll('.project-check:checked')).map(cb => ({
        id: cb.dataset.id,
        storagePath: cb.dataset.storage,
        name: cb.closest('.project-item')?.dataset.name || ''
    }));
}

function showUpload() {
    const dashboardContent = getDashboardContent();
    if (!dashboardContent) return;

    dashboardContent.innerHTML = `
        <section class="featured-section">
            <h2>Upload Project</h2>
            <div class="input-group">
                <label for="projectName">Project Name</label>
                <input type="text" id="projectName" required>
            </div>
            <div class="input-group">
                <label for="projectFile">Project File</label>
                <input type="file" id="projectFile" required>
            </div>
            <div id="uploadProgress" style="display:none; margin:10px 0;">
                <progress id="progressBar" value="0" max="100" style="width:100%;"></progress>
                <span id="progressText">0%</span>
            </div>
            <p id="uploadMsg" style="min-height:20px;"></p>
            <button id="uploadSubmitBtn" class="btn">Upload</button>
        </section>`;

    document.getElementById('uploadSubmitBtn').addEventListener('click', async () => {
        const nameInput = document.getElementById('projectName');
        const fileInput = document.getElementById('projectFile');
        const msgEl     = document.getElementById('uploadMsg');
        const progressWrap = document.getElementById('uploadProgress');
        const progressBar  = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const btn          = document.getElementById('uploadSubmitBtn');

        const name = nameInput.value.trim();
        const file = fileInput.files[0];

        if (!name || !file) {
            msgEl.textContent = 'Please provide a project name and select a file.';
            msgEl.style.color = '#d32f2f';
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Uploading…';
        progressWrap.style.display = 'block';
        msgEl.textContent = '';

        try {
            const { fileURL, storagePath, fileName } = await uploadFile(file, name, (pct) => {
                progressBar.value = pct;
                progressText.textContent = pct + '%';
            });

            await createProject({ name, fileURL, fileName, storagePath });

            msgEl.textContent = 'Project uploaded successfully!';
            msgEl.style.color = '#2e7d32';
            setTimeout(() => showDashboard(), 1200);
        } catch (err) {
            msgEl.textContent = 'Upload failed: ' + err.message;
            msgEl.style.color = '#d32f2f';
            btn.disabled = false;
            btn.textContent = 'Upload';
        }
    });
}

// ============================================================
//  UI  ─ Admin Gradebook
// ============================================================

async function loadGradebook() {
    const tableData = document.querySelector('.table-data-placeholder');
    if (!tableData) return;

    tableData.innerHTML = '<p style="padding:12px">Loading…</p>';

    try {
        const projects = await getAllProjects();
        if (!projects.length) {
            tableData.innerHTML = '';
            return;
        }

        tableData.innerHTML = projects.map(p => `
            <div class="table-row" data-id="${p.id}">
                <span class="cell-student-id">${p.ownerEmail || p.ownerId}</span>
                <span class="cell-project-title">${p.name}</span>
                <span class="cell-doc-status">${p.status}</span>
                <select class="decision-select" data-id="${p.id}">
                    <option value="pending"   ${p.status === 'pending'   ? 'selected' : ''}>Pending</option>
                    <option value="approved"  ${p.status === 'approved'  ? 'selected' : ''}>Approved</option>
                    <option value="rejected"  ${p.status === 'rejected'  ? 'selected' : ''}>Rejected</option>
                </select>
            </div>`).join('');

        // Decision dropdowns
        tableData.querySelectorAll('.decision-select').forEach(sel => {
            sel.addEventListener('change', async (e) => {
                const id  = e.target.dataset.id;
                const val = e.target.value;
                try {
                    await setProjectDecision(id, val);
                    const row = e.target.closest('.table-row');
                    if (row) row.querySelector('.cell-doc-status').textContent = val;
                } catch (err) {
                    alert('Failed to update decision: ' + err.message);
                }
            });
        });

        // Show decision box if rows exist
        const decisionBox = document.querySelector('.decision-dropdown-placeholder');
        if (decisionBox) decisionBox.classList.add('visible');

    } catch (err) {
        tableData.innerHTML = `<p style="color:#c0392b;padding:12px">Error: ${err.message}</p>`;
    }
}

// ============================================================
//  UI  ─ Navigation / Active item
// ============================================================

function setActiveNavItem(link) {
    if (!dashboardSidebar || !link) return;
    const activeItem = dashboardSidebar.querySelector('li.active, a.active');
    if (activeItem) activeItem.classList.remove('active');
    const parentLi = link.closest('li');
    if (parentLi) parentLi.classList.add('active');
    else link.classList.add('active');
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
                if (text.includes('dashboard')) { showDashboard(); setActiveNavItem(link); }
                else if (text.includes('archive')) { showArchive(); setActiveNavItem(link); }
                else if (text.includes('upload')) { showUpload(); setActiveNavItem(link); }
                else if (text.includes('log out') || text.includes('logout')) { logout(); }
            }
        });
    });

    const currentPage = window.location.pathname.split('/').pop().toLowerCase();
    const initialLink = dashboardSidebar.querySelector(`a[href="${currentPage}"]`) ||
        Array.from(navLinks).find((link) => {
            const text = link.textContent.trim().toLowerCase();
            if (currentPage === 'dashboard.html') return text.includes('dashboard');
            if (currentPage === 'archive.html')   return text.includes('archive');
            if (currentPage === 'upload.html')    return text.includes('upload');
            return false;
        });
    if (initialLink) setActiveNavItem(initialLink);

    if (currentPage === 'archive.html') showArchive();
    if (currentPage === 'gradebook.html') loadGradebook();
}

// ============================================================
//  UI  ─ Login form
// ============================================================

function createMessageElement(container) {
    let messageEl = container.querySelector('.login-message');
    if (messageEl) return messageEl;

    messageEl = document.createElement('p');
    messageEl.className = 'login-message';
    messageEl.style.cssText = 'margin:0 0 20px;font-size:.95rem;min-height:22px;';

    const form = container.querySelector('form');
    if (form) container.insertBefore(messageEl, form);
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

    const form      = loginCard.querySelector('form');
    const loginBtn  = loginCard.querySelector('button[type="submit"], .login-btn, .login-button');
    const messageEl = createMessageElement(loginCard);
    if (!loginBtn) return;

    animateEntry();

    // Forgot Password link
    const forgotLink = document.querySelector('.forgot-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const emailInput = loginCard.querySelector('input[type="text"], input[type="email"]');
            const email = emailInput ? emailInput.value.trim() : '';
            try {
                await sendPasswordReset(email);
                notifyLogin(messageEl, 'Password reset email sent! Check your inbox.', 'success');
            } catch (err) {
                notifyLogin(messageEl, 'Reset failed: ' + err.message, 'error');
            }
        });
    }

    const submitHandler = async (e) => {
        e.preventDefault();

        const emailEl = loginCard.querySelector('input[type="text"], input[type="email"]');
        const passEl  = loginCard.querySelector('input[type="password"]');
        const email   = emailEl ? emailEl.value.trim() : '';
        const pass    = passEl  ? passEl.value.trim()  : '';

        if (!email || !pass) {
            notifyLogin(messageEl, 'Please enter both email and password.', 'error');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in…';

        try {
            const user = await firebaseLogin(email, pass);
            const currentPage = window.location.pathname.split('/').pop().toLowerCase();

            if (currentPage.includes('admin')) {
                const role = await getUserRole(user.uid);
                if (role !== 'admin') {
                    await signOut(auth);
                    notifyLogin(messageEl, 'Access denied: not an admin account.', 'error');
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Log in';
                    return;
                }
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } catch (err) {
            let msg = 'Login failed. Please check your credentials.';
            if (err.code === 'auth/user-not-found') msg = 'No account found with that email.';
            if (err.code === 'auth/wrong-password')  msg = 'Incorrect password.';
            if (err.code === 'auth/invalid-email')   msg = 'Invalid email format.';
            if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
            notifyLogin(messageEl, msg, 'error');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Log in';
        }
    };

    if (form) form.addEventListener('submit', submitHandler);
    else loginBtn.addEventListener('click', submitHandler);
}

// ============================================================
//  UI  ─ Modals
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

// Close modals on backdrop click
document.addEventListener('click', (event) => {
    const logoutModal = document.getElementById('logoutModal');
    if (logoutModal && event.target === logoutModal) closeLogoutModal();
    const adminModal  = document.getElementById('adminLogoutModal');
    if (adminModal  && event.target === adminModal)  closeAdminLogout();
});

function toggleDropdown() {
    const list = document.getElementById("dropdownList");
    if (list) list.classList.toggle("show");
}

// ============================================================
//  Bootstrap
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Ensure Firebase is ready before using auth/firestore/storage.
    try {
        await initFirebase();
    } catch (e) {
        console.error('Firebase init failed:', e);
        // Still allow login page to render errors.
    }

    setupLogin();
    setupDashboard();

    // Auth guard — protect dashboard/archive/upload/admin pages
    const page = window.location.pathname.split('/').pop().toLowerCase();
    const protectedStudent = ['dashboard.html', 'archive.html', 'upload.html'];
    const protectedAdmin   = ['admin.html', 'gradebook.html'];

    if (protectedStudent.includes(page)) requireAuth(false);
    if (protectedAdmin.includes(page))   requireAuth(true);
});
