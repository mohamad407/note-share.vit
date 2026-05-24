/* ============================================
   NOTEVAULT ADMIN — Dashboard JavaScript
   ============================================ */

const API_BASE ='https://note-share-vit.onrender.com';

let adminToken = null;
let allNotes = [];
let allAnnouncements = [];
let deleteTargetId = null;
let searchTimeout = null;

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    initLogin();
    initSidebar();
    initViews();
    initModals();
    initNotesSearch();
});

/* ===========================================
   SESSION
   =========================================== */
function checkSession() {
    const token = sessionStorage.getItem('nv_admin_token');
    if (token) {
        adminToken = token;
        showApp();
    }
}

/* ===========================================
   LOGIN
   =========================================== */
function initLogin() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const errorEl = document.getElementById('loginError');
        errorEl.textContent = '';

        if (!username || !password) {
            errorEl.textContent = 'Please enter both username and password.';
            return;
        }

        const btn = document.getElementById('loginBtn');
        btn.querySelector('.btn-text').style.display = 'none';
        btn.querySelector('.btn-loading').style.display = 'inline-flex';
        btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok && data.token) {
                adminToken = data.token;
                sessionStorage.setItem('nv_admin_token', data.token);
                toast('Login successful. Welcome back!', 'success');
                showApp();
            } else {
                errorEl.textContent = data.message || 'Invalid credentials.';
            }
        } catch (err) {
            errorEl.textContent = 'Cannot connect to server.';
        } finally {
            btn.querySelector('.btn-text').style.display = 'inline-flex';
            btn.querySelector('.btn-loading').style.display = 'none';
            btn.disabled = false;
        }
    });
}

function showApp() {
    const loginScreen = document.getElementById('loginScreen');
    const app = document.getElementById('app');

    gsap.to(loginScreen, {
        opacity: 0, scale: 0.95, duration: 0.4, ease: 'power2.in',
        onComplete: () => {
            loginScreen.style.display = 'none';
            app.style.display = 'flex';
            gsap.fromTo(app, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
            animateSidebarEntrance();
            loadDashboard();
        }
    });
}

function logout() {
    sessionStorage.removeItem('nv_admin_token');
    adminToken = null;
    const app = document.getElementById('app');
    const loginScreen = document.getElementById('loginScreen');

    app.style.display = 'none';
    loginScreen.style.display = 'flex';
    gsap.fromTo(loginScreen, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' });
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').textContent = '';
}

/* ===========================================
   SIDEBAR
   =========================================== */
function initSidebar() {
    const items = document.querySelectorAll('.sidebar-item[data-view]');
    const logoutBtn = document.getElementById('logoutBtn');
    const hamburger = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    items.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);
            items.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            closeSidebar();
        });
    });

    logoutBtn.addEventListener('click', logout);

    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', closeSidebar);
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

function animateSidebarEntrance() {
    const items = document.querySelectorAll('.sidebar-item');
    gsap.fromTo(items,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' }
    );
}

/* ===========================================
   VIEW SWITCHING
   =========================================== */
function initViews() {
    // No extra init needed — switchView handles everything
}

function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    const titles = { dashboard: 'Dashboard', notes: 'Notes Management', announcements: 'Announcements' };
    document.getElementById('dashTitle').textContent = titles[viewName] || 'Dashboard';

    const view = document.getElementById(viewName + 'View');
    if (view) {
        view.classList.add('active');
        // Re-trigger animation
        view.style.animation = 'none';
        view.offsetHeight; // reflow
        view.style.animation = '';
    }

    if (viewName === 'dashboard') loadDashboard();
    if (viewName === 'notes') loadNotesView();
    if (viewName === 'announcements') loadAnnouncements();
}

/* ===========================================
   DASHBOARD
   =========================================== */
async function loadDashboard() {
    showStatSkeletons();

    try {
        const res = await fetch(`${API_BASE}/admin/notes`, { headers: { 'x-admin-token': adminToken } });
        const data = await res.json();
        if (res.ok) {
            allNotes = data.notes || [];
            renderStats(allNotes);
            renderRecentList(allNotes);
        } else {
            if (res.status === 401) { logout(); toast('Session expired.', 'error'); }
        }
    } catch (err) {
        toast('Failed to load dashboard data.', 'error');
    }
}

function showStatSkeletons() {
    const grid = document.querySelector('.stats-grid');
    grid.innerHTML = Array(4).fill('<div class="skeleton skeleton-stat"></div>').join('');
    document.getElementById('recentList').innerHTML = Array(5).fill('<div class="skeleton skeleton-row"></div>').join('');
}

function renderStats(notes) {
    const grid = document.querySelector('.stats-grid');
    const depts = [...new Set(notes.map(n => n.department))].length;
    const courses = [...new Set(notes.map(n => n.courseCode))].length;
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const recentCount = notes.filter(n => n.uploadedAt >= oneDayAgo).length;

    grid.innerHTML = `
        <div class="stat-card" data-float="0">
            <div class="stat-icon-wrap stat-icon-blue"><i class="fas fa-file-lines"></i></div>
            <div class="stat-info"><span class="stat-number" data-count="${notes.length}">0</span><span class="stat-label">Total Notes</span></div>
            <div class="stat-bg-icon"><i class="fas fa-file-lines"></i></div>
        </div>
        <div class="stat-card" data-float="1">
            <div class="stat-icon-wrap stat-icon-purple"><i class="fas fa-building-columns"></i></div>
            <div class="stat-info"><span class="stat-number" data-count="${depts}">0</span><span class="stat-label">Departments</span></div>
            <div class="stat-bg-icon"><i class="fas fa-building-columns"></i></div>
        </div>
        <div class="stat-card" data-float="2">
            <div class="stat-icon-wrap stat-icon-green"><i class="fas fa-book-open"></i></div>
            <div class="stat-info"><span class="stat-number" data-count="${courses}">0</span><span class="stat-label">Unique Courses</span></div>
            <div class="stat-bg-icon"><i class="fas fa-book-open"></i></div>
        </div>
        <div class="stat-card" data-float="3">
            <div class="stat-icon-wrap stat-icon-orange"><i class="fas fa-clock"></i></div>
            <div class="stat-info"><span class="stat-number" data-count="${recentCount}">0</span><span class="stat-label">Last 24 Hours</span></div>
            <div class="stat-bg-icon"><i class="fas fa-clock"></i></div>
        </div>
    `;

    // Animate entrance
    gsap.fromTo(grid.querySelectorAll('.stat-card'),
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.3)' }
    );

    // Count up numbers
    grid.querySelectorAll('.stat-number[data-count]').forEach(el => {
        animateCounter(el, parseInt(el.dataset.count));
    });
}

function animateCounter(el, target) {
    const duration = 1000;
    const start = performance.now();
    function update(now) {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function renderRecentList(notes) {
    const list = document.getElementById('recentList');
    const recent = notes.slice(0, 6);

    if (!recent.length) {
        list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-dim);font-size:14px"><i class="fas fa-inbox" style="font-size:28px;display:block;margin-bottom:12px"></i>No uploads yet</div>';
        return;
    }

    list.innerHTML = recent.map(n => `
        <div class="recent-item">
            <span class="recent-item-code">${esc(n.courseCode)}</span>
            <div class="recent-item-info">
                <div class="recent-item-name">${esc(n.courseName)}</div>
                <div class="recent-item-meta">
                    <span>${esc(n.department)}</span>
                    <span>${esc(n.semester)}</span>
                </div>
            </div>
            <span class="recent-item-time">${timeAgo(n.uploadedAt)}</span>
        </div>
    `).join('');

    gsap.fromTo(list.querySelectorAll('.recent-item'),
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
    );
}

/* ===========================================
   NOTES MANAGEMENT
   =========================================== */
async function loadNotesView() {
    showTableSkeleton();

    try {
        const res = await fetch(`${API_BASE}/admin/notes`, { headers: { 'x-admin-token': adminToken } });
        const data = await res.json();
        if (res.ok) {
            allNotes = data.notes || [];
            renderNotesTable(allNotes);
        } else if (res.status === 401) { logout(); toast('Session expired.', 'error'); }
    } catch (err) { toast('Failed to load notes.', 'error'); }
}

function showTableSkeleton() {
    const tbody = document.getElementById('notesTableBody');
    tbody.innerHTML = Array(6).fill('<tr><td colspan="7"><div class="skeleton skeleton-row"></div></td></tr>').join('');
    document.getElementById('tableEmpty').style.display = 'none';
    document.querySelector('.table-wrapper').style.display = '';
    document.getElementById('notesCount').textContent = '...';
}

function renderNotesTable(notes) {
    const tbody = document.getElementById('notesTableBody');
    const empty = document.getElementById('tableEmpty');
    const wrapper = document.querySelector('.table-wrapper');
    const countEl = document.getElementById('notesCount');

    countEl.textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;

    if (!notes.length) {
        wrapper.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }

    wrapper.style.display = '';
    empty.style.display = 'none';

    tbody.innerHTML = notes.map(n => `
        <tr data-id="${esc(n.id)}">
            <td><span class="table-code">${esc(n.courseCode)}</span></td>
            <td><span class="table-name" title="${esc(n.courseName)}">${esc(n.courseName)}</span></td>
            <td>${esc(n.department)}</td>
            <td>${esc(n.semester)}</td>
            <td>${esc(n.facultyName)}</td>
            <td>${formatDate(n.uploadedAt)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon edit-btn" data-edit="${esc(n.id)}" title="Edit"><i class="fas fa-pen"></i></button>
                    <button class="btn-icon delete-btn" data-delete="${esc(n.id)}" title="Delete"><i class="fas fa-trash-can"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    gsap.fromTo(tbody.querySelectorAll('tr'),
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out' }
    );
}

/* ---------- Notes Search ---------- */
function initNotesSearch() {
    const input = document.getElementById('notesSearch');
    const clear = document.getElementById('notesSearchClear');

    input.addEventListener('input', () => {
        const q = input.value.trim();
        clear.style.display = q ? 'flex' : 'none';
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => filterNotes(q), 200);
    });

    clear.addEventListener('click', () => {
        input.value = '';
        clear.style.display = 'none';
        renderNotesTable(allNotes);
    });

    // Delegate edit/delete clicks on table
    document.getElementById('notesTableBody').addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-edit]');
        const deleteBtn = e.target.closest('[data-delete]');

        if (editBtn) openEditModal(editBtn.dataset.edit);
        if (deleteBtn) openDeleteModal(deleteBtn.dataset.delete);
    });
}

function filterNotes(query) {
    if (!query) { renderNotesTable(allNotes); return; }
    const q = query.toLowerCase();
    const filtered = allNotes.filter(n =>
        n.courseCode.toLowerCase().includes(q) ||
        n.courseName.toLowerCase().includes(q) ||
        n.department.toLowerCase().includes(q)
    );
    renderNotesTable(filtered);
}

/* ===========================================
   EDIT MODAL
   =========================================== */
function openEditModal(noteId) {
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return;

    document.getElementById('editId').value = note.id;
    document.getElementById('editCourseCode').value = note.courseCode;
    document.getElementById('editCourseName').value = note.courseName;
    document.getElementById('editDepartment').value = note.department;
    document.getElementById('editSemester').value = note.semester;
    document.getElementById('editFacultyName').value = note.facultyName;
    document.getElementById('editUnitNumber').value = note.unitNumber;
    document.getElementById('editPdfUrl').value = note.pdfUrl;

    openModal('editModal');
}

function initModals() {
    // Edit form submit
    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editId').value;
        const payload = {
            courseCode: document.getElementById('editCourseCode').value.trim(),
            courseName: document.getElementById('editCourseName').value.trim(),
            department: document.getElementById('editDepartment').value.trim(),
            semester: document.getElementById('editSemester').value.trim(),
            facultyName: document.getElementById('editFacultyName').value.trim(),
            unitNumber: document.getElementById('editUnitNumber').value.trim(),
            pdfUrl: document.getElementById('editPdfUrl').value.trim()
        };

        if (Object.values(payload).some(v => !v)) {
            toast('All fields are required.', 'error');
            return;
        }

        const btn = document.getElementById('editSaveBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            const res = await fetch(`${API_BASE}/edit/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok) {
                toast('Note updated successfully.', 'success');
                closeModal('editModal');
                loadNotesView();
            } else {
                toast(data.message || 'Failed to update.', 'error');
            }
        } catch (err) { toast('Connection error.', 'error'); }
        finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check"></i> Save Changes';
        }
    });

    // Delete confirm
    document.getElementById('deleteConfirmBtn').addEventListener('click', executeDelete);

    // Announcement form
    document.getElementById('announcementForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('annTitle').value.trim();
        const message = document.getElementById('annMessage').value.trim();

        if (!title || !message) { toast('Title and message are required.', 'error'); return; }

        const btn = e.target.querySelector('.btn-primary');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';

        try {
            const res = await fetch(`${API_BASE}/admin/announcements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
                body: JSON.stringify({ title, message })
            });
            const data = await res.json();

            if (res.ok) {
                toast('Announcement published!', 'success');
                closeModal('announcementModal');
                document.getElementById('announcementForm').reset();
                loadAnnouncements();
            } else {
                toast(data.message || 'Failed to publish.', 'error');
            }
        } catch (err) { toast('Connection error.', 'error'); }
        finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish';
        }
    });

    // New announcement button
    document.getElementById('newAnnouncementBtn').addEventListener('click', () => openModal('announcementModal'));

    // Close buttons
    document.querySelectorAll('.modal-close, .modal-footer .btn-secondary, #editCancel, #deleteCancel, #annCancel').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-overlay');
            if (modal) closeModal(modal.id);
        });
    });

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(overlay.id);
        });
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(m => closeModal(m.id));
        }
    });

    // Delegate announcement delete
    document.getElementById('announcementsList').addEventListener('click', async (e) => {
        const btn = e.target.closest('.announcement-delete');
        if (!btn) return;
        const id = btn.dataset.annId;
        if (!id) return;

        try {
            const res = await fetch(`${API_BASE}/admin/announcements/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-token': adminToken }
            });
            if (res.ok) {
                toast('Announcement deleted.', 'info');
                loadAnnouncements();
            } else { toast('Failed to delete.', 'error'); }
        } catch (err) { toast('Connection error.', 'error'); }
    });
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    // Only restore scroll if no other modals are open
    if (!document.querySelector('.modal-overlay.active')) {
        document.body.style.overflow = '';
    }
}

/* ---------- Delete ---------- */
function openDeleteModal(noteId) {
    deleteTargetId = noteId;
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return;

    document.getElementById('deletePreview').innerHTML =
        `<div class="mnp-code">${esc(note.courseCode)} · ${esc(note.unitNumber)}</div><div class="mnp-name">${esc(note.courseName)}</div>`;
    openModal('deleteModal');
}

async function executeDelete() {
    if (!deleteTargetId) return;

    const btn = document.getElementById('deleteConfirmBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

    try {
        const res = await fetch(`${API_BASE}/delete/${deleteTargetId}`, {
            method: 'DELETE',
            headers: { 'x-admin-token': adminToken }
        });
        const data = await res.json();

        if (res.ok) {
            toast('Note deleted.', 'info');
            closeModal('deleteModal');
            loadNotesView();
        } else {
            toast(data.message || 'Failed to delete.', 'error');
            closeModal('deleteModal');
        }
    } catch (err) { toast('Connection error.', 'error'); closeModal('deleteModal'); }
    finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash-can"></i> Delete';
        deleteTargetId = null;
    }
}

/* ===========================================
   ANNOUNCEMENTS
   =========================================== */
async function loadAnnouncements() {
    const list = document.getElementById('announcementsList');
    const empty = document.getElementById('announcementsEmpty');

    list.innerHTML = Array(3).fill('<div class="skeleton skeleton-row" style="height:80px;border-radius:var(--radius-lg)"></div>').join('');
    empty.style.display = 'none';

    try {
        const res = await fetch(`${API_BASE}/admin/announcements`);
        const data = await res.json();
        allAnnouncements = data.announcements || [];

        if (!allAnnouncements.length) {
            list.innerHTML = '';
            empty.style.display = 'flex';
            return;
        }

        empty.style.display = 'none';
        list.innerHTML = allAnnouncements.map(a => `
            <div class="announcement-card">
                <div class="announcement-card-header">
                    <div>
                        <div class="announcement-title">${esc(a.title)}</div>
                        <div class="announcement-date">${formatDate(a.createdAt)}</div>
                    </div>
                    <button class="announcement-delete" data-ann-id="${esc(a.id)}" title="Delete" aria-label="Delete announcement">
                        <i class="fas fa-xmark"></i>
                    </button>
                </div>
                <div class="announcement-message">${esc(a.message)}</div>
            </div>
        `).join('');

        gsap.fromTo(list.querySelectorAll('.announcement-card'),
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
        );
    } catch (err) {
        toast('Failed to load announcements.', 'error');
        list.innerHTML = '';
    }
}

/* ===========================================
   TOAST
   =========================================== */
function toast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    const icons = { success: 'fa-check', error: 'fa-xmark', info: 'fa-info' };
    el.innerHTML = `<div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div><span>${message}</span>`;
    container.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
    setTimeout(() => { el.classList.remove('show'); el.classList.add('hide'); setTimeout(() => el.remove(), 400); }, 3500);
}

/* ===========================================
   UTILITIES
   =========================================== */
function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function timeAgo(dateStr) {
    if (!dateStr) return '—';
    const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (s < 60) return 'Just now';
    const m = Math.floor(s / 60);
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    const d = Math.floor(h / 24);
    return d < 30 ? d + 'd ago' : Math.floor(d / 30) + 'mo ago';
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
