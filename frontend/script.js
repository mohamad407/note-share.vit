/* ============================================
   NOTEVAULT — Frontend JavaScript (FIXED)
   ============================================ */

const API_BASE = 'https://note-share-vit.onrender.com';
const ALLOWED_DOMAIN = "@vitstudent.ac.in";

// --- Safe Firebase Initialization (v8) ---
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig); // Uses firebaseConfig from your HTML
}
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// ============================================
// GLOBAL VARIABLES
// ============================================
let currentUser = null;
let allNotes = [];
let searchTimeout = null;
let selectedFile = null;
let selectedFileData = null;
let uploadMode = 'file';
let deleteTargetId = null;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPE = 'application/pdf';

function getUploaderId() {
    let id = localStorage.getItem('notevault_uploader_id');
    if (!id) {
        id = 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('notevault_uploader_id', id);
    }
    return id;
}
const MY_UPLOADER_ID = getUploaderId();


// ============================================
// GOOGLE AUTH STATE & UI
// ============================================
function saveUser(user) {
    currentUser = {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photo: user.photoURL
    };
    localStorage.setItem('notevault_user', JSON.stringify(currentUser));
}

function getSavedUser() {
    const user = localStorage.getItem('notevault_user');
    return user ? JSON.parse(user) : null;
}

function logoutUser() {
    localStorage.removeItem('notevault_user');
    currentUser = null;
    updateAuthUI(); // Smoothly update UI without reloading
}

function updateAuthUI() {
    // We grab these elements INSIDE the function so they are never null
    const loginScreen = document.getElementById("loginScreen");
    const mainWebsite = document.getElementById("mainWebsite");
    const userBox = document.getElementById('userProfileBox');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userPhoto = document.getElementById('userPhoto');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const navLoginBtn = document.getElementById('navLoginBtn');

    if (currentUser) {
        if (loginScreen) loginScreen.style.display = 'none';
        if (mainWebsite) mainWebsite.style.display = 'block';
        if (googleLoginBtn) googleLoginBtn.style.display = 'none';
        if (navLoginBtn) navLoginBtn.style.display = 'none';
        if (userBox) userBox.style.display = 'flex';

        if (userName) userName.textContent = currentUser.name;
        if (userEmail) userEmail.textContent = currentUser.email;
        if (userPhoto) userPhoto.src = currentUser.photo;
    } else {
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainWebsite) mainWebsite.style.display = 'none';
        if (googleLoginBtn) googleLoginBtn.style.display = 'flex';
        if (navLoginBtn) navLoginBtn.style.display = 'flex';
        if (userBox) userBox.style.display = 'none';
    }
}

function initGoogleAuth() {
    // 1. Check Redirect Result (Triggers when returning from Google Login page)
    auth.getRedirectResult().then((result) => {
        if (result.user) {
            processAuthUser(result.user);
        } else if (!currentUser) {
            // No redirect result, restore session from local storage if exists
            currentUser = getSavedUser();
            updateAuthUI();
        }
    }).catch((error) => {
        handleAuthError(error);
    });

    // 2. Handle Persistent Sessions (e.g., user refreshes page later)
    auth.onAuthStateChanged((user) => {
        if (user && !currentUser) {
            processAuthUser(user);
        } else if (!user && currentUser) {
            logoutUser();
        }
    });

    // 3. Attach Login Button Listeners
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const navLoginBtn = document.getElementById('navLoginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener("click", () => {
            provider.setCustomParameters({ prompt: 'select_account' });
            auth.signInWithRedirect(provider);
        });
    }

    if (navLoginBtn) {
        navLoginBtn.addEventListener("click", () => {
            provider.setCustomParameters({ prompt: 'select_account' });
            auth.signInWithRedirect(provider);
        });
    }

    // 4. Attach Logout Listener
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut();
        });
    }
}

function processAuthUser(user) {
    if (!user.email.endsWith(ALLOWED_DOMAIN)) {
        showToast("Access Denied: Only VIT student emails are allowed.", "error");
        auth.signOut();
        return;
    }
    saveUser(user);
    updateAuthUI();
}

function handleAuthError(error) {
    console.error("Auth Error:", error);
    if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/auth-domain-config-required') {
        showToast("Login failed. Please try again.", "error");
    }
}


// ============================================
// INITIALIZATION ON DOM READY
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initGoogleAuth();      // Must be first to handle login state
    initParticles();
    initHeroEntrance();
    initTypingAnimation();
    initNavbar();
    initMobileNav();
    initRippleEffects();
    initMagneticButtons();
    initUploadModeToggle();
    initFileUpload();
    initForm();
    initSearch();
    initScrollReveal();
    initCardGlowDelegate();
    init3DCardTilt();
    initStatsScrollAnimation();
    initDeleteModal();
    fetchAndRenderNotes();
    initSmoothScroll();
    fetchUserAnnouncements();
});


/* ===========================================
   PARTICLE BACKGROUND
   =========================================== */
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 65;
    const CONNECTION_DIST = 140;
    let mouse = { x: -1000, y: -1000 };

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const baseOpacity = Math.random() * 0.4 + 0.1;
        particles.push({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 1.5 + 0.5, opacity: baseOpacity, baseOpacity
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;

            const dx = p.x - mouse.x, dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
                const force = (180 - dist) / 180;
                p.opacity = p.baseOpacity + force * 0.5;
                p.x += (dx / dist) * force * 0.3;
                p.y += (dy / dist) * force * 0.3;
            } else {
                p.opacity += (p.baseOpacity - p.opacity) * 0.05;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 212, 255, ${p.opacity})`;
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const cdx = p.x - p2.x, cdy = p.y - p2.y;
                const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
                if (cdist < CONNECTION_DIST) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(0, 212, 255, ${(1 - cdist / CONNECTION_DIST) * 0.08})`;
                    ctx.lineWidth = 0.5; ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}

/* ===========================================
   HERO ENTRANCE (GSAP)
   =========================================== */
function initHeroEntrance() {
    const tl = gsap.timeline({ delay: 0.3 });
    tl.to('#heroBadge', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', startAt: { y: 20 } })
      .to('#heroTitle', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', startAt: { y: 30 } }, '-=0.4')
      .to('#heroSubtitle', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', startAt: { y: 20 } }, '-=0.4')
      .to('#heroActions', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', startAt: { y: 20 } }, '-=0.35')
      .to('#heroStats', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', startAt: { y: 20 } }, '-=0.3')
      .to('#heroScroll', { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.2');
}

/* ===========================================
   TYPING ANIMATION
   =========================================== */
function initTypingAnimation() {
    const phrases = ['One Click Away.', 'Shared Instantly.', 'Organized Simply.', 'Searchable Easily.', 'Free Forever.'];
    const typedEl = document.getElementById('typedText');
    if(!typedEl) return;
    let pi = 0, ci = 0, isDel = false, speed = 80;

    function type() {
        const phrase = phrases[pi];
        if (isDel) { typedEl.textContent = phrase.substring(0, ci - 1); ci--; speed = 40; }
        else { typedEl.textContent = phrase.substring(0, ci + 1); ci++; speed = 80; }
        if (!isDel && ci === phrase.length) { speed = 2000; isDel = true; }
        else if (isDel && ci === 0) { isDel = false; pi = (pi + 1) % phrases.length; speed = 400; }
        setTimeout(type, speed);
    }
    type();
}

/* ===========================================
   NAVBAR
   =========================================== */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        if(navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
        let current = '';
        sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) current = s.id; });
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${current}`));
    });
}

function initMobileNav() {
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('mobileNavOverlay');
    const links = document.querySelectorAll('.mobile-nav-link, .mobile-nav-cta');

    if (!hamburger || !mobileNav) return;

    function toggle() {
        hamburger.classList.toggle('active'); mobileNav.classList.toggle('active');
        if(overlay) overlay.classList.toggle('active');
        document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    }
    hamburger.addEventListener('click', toggle);
    if(overlay) overlay.addEventListener('click', toggle);
    links.forEach(l => l.addEventListener('click', toggle));
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', function(e) {
            e.preventDefault();
            const t = document.querySelector(this.getAttribute('href'));
            if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
        });
    });
}

/* ===========================================
   RIPPLE & MAGNETIC
   =========================================== */
function initRippleEffects() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-ripple');
        if (!btn) return;
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
}

function initMagneticButtons() {
    document.querySelectorAll('.btn-magnetic').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const r = btn.getBoundingClientRect();
            btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.15}px, ${(e.clientY - r.top - r.height / 2) * 0.15}px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0, 0)'; });
    });
}

/* ===========================================
   UPLOAD MODE TOGGLE
   =========================================== */
function initUploadModeToggle() {
    const fileBtn = document.getElementById('modeFileBtn');
    const urlBtn = document.getElementById('modeUrlBtn');
    const fileRow = document.getElementById('fileZoneRow');
    const urlRow = document.getElementById('urlZoneRow');

    if(fileBtn) fileBtn.addEventListener('click', () => {
        uploadMode = 'file'; fileBtn.classList.add('active'); if(urlBtn) urlBtn.classList.remove('active');
        if(fileRow) fileRow.style.display = ''; if(urlRow) urlRow.style.display = 'none';
    });
    if(urlBtn) urlBtn.addEventListener('click', () => {
        uploadMode = 'url'; urlBtn.classList.add('active'); if(fileBtn) fileBtn.classList.remove('active');
        if(urlRow) urlRow.style.display = ''; if(fileRow) fileRow.style.display = 'none'; clearFileSelection();
    });
}

/* ===========================================
   FILE UPLOAD
   =========================================== */
function initFileUpload() {
    const dropZone = document.getElementById('fileDropZone');
    const fileInput = document.getElementById('fileInput');
    const fileRemove = document.getElementById('fileRemove');
    const fileError = document.getElementById('fileError');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => { if (e.target.files.length) handleFileSelection(e.target.files[0]); });

    dropZone.addEventListener('dragenter', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); if(fileError) fileError.textContent = ''; if (e.dataTransfer.files.length) handleFileSelection(e.dataTransfer.files[0]); });

    dropZone.addEventListener('mousemove', (e) => {
        const r = dropZone.getBoundingClientRect();
        dropZone.style.setProperty('--glow-x', ((e.clientX - r.left) / r.width * 100) + '%');
        dropZone.style.setProperty('--glow-y', ((e.clientY - r.top) / r.height * 100) + '%');
    });

    if(fileRemove) fileRemove.addEventListener('click', (e) => { e.stopPropagation(); clearFileSelection(); });
}

function handleFileSelection(file) {
    const dropZone = document.getElementById('fileDropZone');
    const filePreview = document.getElementById('filePreview');
    const fileError = document.getElementById('fileError');
    if(fileError) fileError.textContent = ''; dropZone.classList.remove('zone-error');

    if (file.type !== ALLOWED_TYPE && !file.name.toLowerCase().endsWith('.pdf')) {
        if(fileError) fileError.textContent = 'Only PDF files are allowed.';
        dropZone.classList.add('zone-error'); setTimeout(() => dropZone.classList.remove('zone-error'), 500); return;
    }
    if (file.size > MAX_FILE_SIZE) {
        if(fileError) fileError.textContent = `File is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed size is 50MB.`;
        dropZone.classList.add('zone-error'); setTimeout(() => dropZone.classList.remove('zone-error'), 500); return;
    }

    selectedFile = file;
    const fileNameEl = document.getElementById('fileName');
    const fileSizeEl = document.getElementById('fileSize');
    if(fileNameEl) fileNameEl.textContent = file.name;
    if(fileSizeEl) fileSizeEl.textContent = formatFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (e) => { selectedFileData = e.target.result; };
    reader.readAsDataURL(file);

    dropZone.classList.add('has-file');
    if(filePreview) filePreview.classList.add('visible');
}

function clearFileSelection() {
    selectedFile = null; selectedFileData = null;
    const dz = document.getElementById('fileDropZone');
    if(dz) dz.classList.remove('has-file', 'zone-error');
    const fp = document.getElementById('filePreview');
    if(fp) fp.classList.remove('visible');
    const fi = document.getElementById('fileInput');
    if(fi) fi.value = '';
    const fe = document.getElementById('fileError');
    if(fe) fe.textContent = '';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/* ===========================================
   TOAST NOTIFICATION
   =========================================== */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'fa-check', error: 'fa-xmark', info: 'fa-info' };
    toast.innerHTML = `<div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
    setTimeout(() => { toast.classList.remove('show'); toast.classList.add('hide'); setTimeout(() => toast.remove(), 400); }, 4000);
}

/* ===========================================
   CONFETTI
   =========================================== */
function launchConfetti() {
    const container = document.getElementById('confettiContainer');
    if(!container) return;
    const colors = ['#00d4ff', '#7b2ff7', '#00ff88', '#ff8c42', '#ff4d6d', '#ffdd57'];
    for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.classList.add('confetti-piece');
        piece.style.left = (40 + Math.random() * 20) + '%';
        piece.style.top = (30 + Math.random() * 10) + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.width = (4 + Math.random() * 8) + 'px';
        piece.style.height = (4 + Math.random() * 8) + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        piece.style.animation = `confettiFall ${1.2 + Math.random()}s ease-out ${Math.random() * 0.3}s forwards`;
        piece.style.transform = `translateX(${(Math.random() - 0.5) * 400}px)`;
        container.appendChild(piece);
        setTimeout(() => piece.remove(), 2500);
    }
}

/* ===========================================
   DELETE MODAL
   =========================================== */
function initDeleteModal() {
    const modal = document.getElementById('deleteModal');
    const cancelBtn = document.getElementById('modalCancel');
    const confirmBtn = document.getElementById('modalConfirm');
    if (!modal || !cancelBtn || !confirmBtn) return;

    cancelBtn.addEventListener('click', closeDeleteModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeDeleteModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('active')) closeDeleteModal(); });
    confirmBtn.addEventListener('click', () => { if (deleteTargetId) executeDelete(deleteTargetId); });
}

function openDeleteModal(noteId) {
    deleteTargetId = noteId;
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return;

    const preview = document.getElementById('modalNotePreview');
    if(preview) preview.innerHTML = `<div class="mnp-code">${escapeHTML(note.courseCode)} · ${escapeHTML(note.unitNumber)}</div><div class="mnp-name">${escapeHTML(note.courseName)}</div>`;

    const modal = document.getElementById('deleteModal');
    if(modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if(modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    deleteTargetId = null;
}

async function executeDelete(noteId) {
    const confirmBtn = document.getElementById('modalConfirm');
    const originalHTML = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    confirmBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/notes/${noteId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uploaderId: MY_UPLOADER_ID })
        });

        const result = await response.json();

        if (response.ok) {
            showToast('Note deleted successfully.', 'info');
            closeDeleteModal();
            const card = document.querySelector(`.note-card[data-note-id="${noteId}"]`);
            if (card) {
                gsap.to(card, { opacity: 0, scale: 0.9, y: 20, duration: 0.35, ease: 'power2.in', onComplete: () => fetchAndRenderNotes() });
            } else { fetchAndRenderNotes(); }
        } else {
            showToast(result.message || 'Failed to delete. You can only delete your own notes.', 'error');
            closeDeleteModal();
        }
    } catch (err) {
        console.error('Delete error:', err);
        showToast('Could not connect to server.', 'error');
        closeDeleteModal();
    } finally {
        confirmBtn.innerHTML = originalHTML;
        confirmBtn.disabled = false;
    }
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.note-delete-btn');
    if (!btn) return;
    e.stopPropagation();
    const noteId = btn.getAttribute('data-note-id');
    if (noteId) openDeleteModal(noteId);
});

/* ===========================================
   FORM HANDLING
   =========================================== */
function initForm() {
    const form = document.getElementById('uploadForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            showToast("Please log in with your VIT email to upload notes.", "error");
            return;
        }

        clearFormErrors();

        const data = {
            courseCode: document.getElementById('courseCode').value.trim(),
            courseName: document.getElementById('courseName').value.trim(),
            department: document.getElementById('department').value.trim(),
            semester: document.getElementById('semester').value.trim(),
            facultyName: document.getElementById('facultyName').value.trim(),
            unitNumber: document.getElementById('unitNumber').value.trim(),
            uploaderId: currentUser.uid,
            uploaderEmail: currentUser.email,
            uploaderName: currentUser.name
        };

        if (uploadMode === 'file') {
            if (!selectedFile || !selectedFileData) {
                const fileError = document.getElementById('fileError');
                if(fileError) fileError.textContent = 'Please select a PDF file to upload.';
                return;
            }
            data.pdfUrl = selectedFileData;
        } else {
            data.pdfUrl = document.getElementById('pdfUrl').value.trim();
        }

        if (!validateForm(data)) return;

        const submitBtn = document.getElementById('submitBtn');
        submitBtn.querySelector('.btn-text').style.display = 'none';
        submitBtn.querySelector('.btn-loading').style.display = 'inline-flex';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.ok) {
                showToast('Notes uploaded successfully!', 'success');
                launchConfetti();
                form.reset(); clearFileSelection(); fetchAndRenderNotes();
            } else {
                showToast(result.message || 'Upload failed.', 'error');
            }
        } catch (err) {
            console.error('Upload error:', err);
            showToast('Could not connect to server.', 'error');
        } finally {
            submitBtn.querySelector('.btn-text').style.display = 'inline-flex';
            submitBtn.querySelector('.btn-loading').style.display = 'none';
            submitBtn.disabled = false;
        }
    });
}

function validateForm(data) {
    let isValid = true;
    [
        { key: 'courseCode', label: 'Course Code is required' },
        { key: 'courseName', label: 'Course Name is required' },
        { key: 'department', label: 'Department is required' },
        { key: 'semester', label: 'Semester is required' },
        { key: 'facultyName', label: 'Faculty Name is required' },
        { key: 'unitNumber', label: 'Unit Number is required' }
    ].forEach(f => {
        const el = document.getElementById(f.key);
        const errEl = document.getElementById(f.key + 'Error');
        if (!data[f.key]) {
            if(el) el.classList.add('input-error');
            if(errEl) errEl.textContent = f.label;
            isValid = false;
        }
    });

    if (uploadMode === 'url') {
        const urlEl = document.getElementById('pdfUrl');
        const urlErrEl = document.getElementById('pdfUrlError');
        if (!data.pdfUrl) {
            if(urlEl) urlEl.classList.add('input-error');
            if(urlErrEl) urlErrEl.textContent = 'PDF URL is required';
            isValid = false;
        } else if (!isValidUrl(data.pdfUrl)) {
            if(urlEl) urlEl.classList.add('input-error');
            if(urlErrEl) urlErrEl.textContent = 'Please enter a valid URL';
            isValid = false;
        }
    }
    return isValid;
}

function isValidUrl(s) { try { new URL(s); return true; } catch (_) { return false; } }
function clearFormErrors() { document.querySelectorAll('.form-error').forEach(e => e.textContent = ''); document.querySelectorAll('.input-error').forEach(e => e.classList.remove('input-error')); }

/* ===========================================
   SEARCH
   =========================================== */
function initSearch() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');
    const pulse = document.getElementById('searchPulse');
    if (!input) return;

    input.addEventListener('input', () => {
        const q = input.value.trim();
        if(clearBtn) clearBtn.style.display = q ? 'flex' : 'none';
        if(pulse) { pulse.classList.remove('active'); void pulse.offsetWidth; if (q) pulse.classList.add('active'); }
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => performSearch(q), 250);
    });

    if(clearBtn) clearBtn.addEventListener('click', () => {
        input.value = ''; clearBtn.style.display = 'none';
        renderNotesGrid(allNotes); updateNotesSubtitle(allNotes.length, false);
    });
}

async function performSearch(query) {
    if (!query) { renderNotesGrid(allNotes); updateNotesSubtitle(allNotes.length, false); return; }
    showSkeletons('notesGrid', 3);
    try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const result = await res.json();
        if (res.ok) { renderNotesGrid(result.notes); updateNotesSubtitle(result.notes.length, true, query); }
    } catch (err) {
        const q = query.toLowerCase();
        const filtered = allNotes.filter(n => n.courseCode.toLowerCase().includes(q) || n.courseName.toLowerCase().includes(q) || n.department.toLowerCase().includes(q));
        renderNotesGrid(filtered); updateNotesSubtitle(filtered.length, true, query);
    }
}

function updateNotesSubtitle(count, isSearch, query = '') {
    const el = document.getElementById('notesSubtitle');
    if(!el) return;
    el.textContent = isSearch ? (count > 0 ? `Found ${count} result${count !== 1 ? 's' : ''} for "${query}"` : `No results found for "${query}"`) : 'Browse all uploaded notes from every department.';
}

/* ===========================================
   FETCH & RENDER
   =========================================== */
async function fetchAndRenderNotes() {
    showSkeletons('recentGrid', 3); showSkeletons('notesGrid', 6);
    try {
        const res = await fetch(`${API_BASE}/notes`);
        const result = await res.json();
        if (res.ok) {
            allNotes = result.notes || [];
            renderRecentUploads(allNotes); renderNotesGrid(allNotes);
            updateStats(allNotes); updateSearchTags(allNotes); updateHeroStats(allNotes);
        }
    } catch (err) { renderRecentUploads([]); renderNotesGrid([]); }
}

function renderRecentUploads(notes) {
    const grid = document.getElementById('recentGrid');
    if (!grid) return;
    if (!notes.length) { grid.innerHTML = getEmptyStateHTML('recent'); return; }
    grid.innerHTML = notes.slice(0, 3).map(n => createNoteCardHTML(n)).join('');
    gsap.fromTo(grid.querySelectorAll('.note-card'), { opacity: 0, y: 30, rotateX: 5 }, { opacity: 1, y: 0, rotateX: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out' });
}

function renderNotesGrid(notes) {
    const grid = document.getElementById('notesGrid');
    if (!grid) return;
    if (!notes.length && !allNotes.length) { grid.innerHTML = getEmptyStateHTML('all'); return; }
    if (!notes.length && document.getElementById('searchInput')?.value.trim()) {
        grid.innerHTML = '<div class="no-results"><i class="fas fa-magnifying-glass"></i><p>No notes match your search. Try different keywords.</p></div>';
        return;
    }
    grid.innerHTML = notes.map(n => createNoteCardHTML(n)).join('');
    gsap.fromTo(grid.querySelectorAll('.note-card'), { opacity: 0, y: 20, rotateX: 3 }, { opacity: 1, y: 0, rotateX: 0, duration: 0.45, stagger: 0.07, ease: 'power2.out' });
    init3DCardTilt();
}

function createNoteCardHTML(note) {
    const timeAgo = getTimeAgo(note.uploadedAt);
    const isDataUrl = note.pdfUrl && note.pdfUrl.startsWith('data:');
    const openLabel = isDataUrl ? 'View PDF' : 'Open PDF';
    const isOwner = note.uploaderId === MY_UPLOADER_ID;
    const deleteBtn = isOwner ? `<button class="note-delete-btn" data-note-id="${escapeHTML(note.id)}" aria-label="Delete note" title="Delete your note"><i class="fas fa-trash-can"></i></button>` : '';

    return `
        <div class="note-card" data-tilt data-note-id="${escapeHTML(note.id)}">
            <div class="note-card-header">
                <span class="note-course-code">${escapeHTML(note.courseCode)}</span>
                <span class="note-unit-badge">${escapeHTML(note.unitNumber)}</span>
                ${deleteBtn}
            </div>
            <h3 class="note-course-name">${escapeHTML(note.courseName)}</h3>
            <div class="note-details">
                <div class="note-detail"><i class="fas fa-building-columns"></i><span>${escapeHTML(note.department)}</span></div>
                <div class="note-detail"><i class="fas fa-layer-group"></i><span>${escapeHTML(note.semester)}</span></div>
                <div class="note-detail"><i class="fas fa-chalkboard-user"></i><span>${escapeHTML(note.facultyName)}</span></div>
            </div>
            <div class="note-card-footer">
                <span class="note-time"><i class="fas fa-clock"></i> ${timeAgo}</span>
                <button class="btn-open-pdf" data-pdf-url="${escapeHTML(note.pdfUrl)}">${openLabel} <i class="fas fa-arrow-right"></i></button>
            </div>
        </div>
    `;
}

function getEmptyStateHTML(type) {
    return `<div class="empty-state">
        <div class="empty-icon"><i class="fas ${type === 'recent' ? 'fa-clock-rotate-left' : 'fa-folder-open'}"></i></div>
        <h3 class="empty-title">${type === 'recent' ? 'No recent uploads' : 'No notes uploaded yet'}</h3>
        <p class="empty-subtitle">${type === 'recent' ? 'Notes will appear here once someone uploads them.' : 'Be the first to share your study notes with the community!'}</p>
        ${type === 'all' ? '<a href="#upload" class="empty-btn btn-ripple"><i class="fas fa-cloud-arrow-up"></i> Upload First Note</a>' : ''}
    </div>`;
}

function showSkeletons(id, count) {
    const el = document.getElementById(id);
    if (!el) return;
    let h = '';
    for (let i = 0; i < count; i++) h += '<div class="skeleton-card"><div class="skeleton-line w-40"></div><div class="skeleton-line w-80"></div><div class="skeleton-line w-60"></div><div class="skeleton-line w-50"></div><div class="skeleton-line w-70"></div><div class="skeleton-line w-30"></div></div>';
    el.innerHTML = h;
}

/* ===========================================
   PDF OPEN HANDLER
   =========================================== */
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-open-pdf');
    if (!btn) return;
    const url = btn.getAttribute('data-pdf-url');
    if (!url) return;
    if (url.startsWith('data:')) {
        try {
            const byteString = atob(url.split(',')[1]);
            const mimeString = url.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
            const blobUrl = URL.createObjectURL(new Blob([ab], { type: mimeString }));
            window.open(blobUrl, '_blank');
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } catch (err) { showToast('Failed to open PDF.', 'error'); }
    } else {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
});

/* ===========================================
   SEARCH TAGS
   =========================================== */
function updateSearchTags(notes) {
    const container = document.getElementById('searchTags');
    if (!container) return;
    if (!notes.length) { container.innerHTML = '<span class="search-tag-hint">Quick filters will appear here after you upload notes</span>'; return; }
    let html = '';
    [...new Set(notes.map(n => n.department))].slice(0, 3).forEach(d => { html += `<button class="search-tag" onclick="quickSearch('${escapeHTML(d)}')">${escapeHTML(d)}</button>`; });
    [...new Set(notes.map(n => n.courseCode))].slice(0, 3).forEach(c => { html += `<button class="search-tag" onclick="quickSearch('${escapeHTML(c)}')">${escapeHTML(c)}</button>`; });
    container.innerHTML = html;
}

function quickSearch(term) {
    const input = document.getElementById('searchInput');
    if(input) { input.value = term; input.dispatchEvent(new Event('input')); }
    const notesSection = document.getElementById('notes');
    if(notesSection) notesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ===========================================
   STATISTICS
   =========================================== */
function updateStats(notes) {
    animateCounter('statTotalNotes', notes.length);
    animateCounter('statTotalDepts', [...new Set(notes.map(n => n.department))].length);
    animateCounter('statTotalCourses', [...new Set(notes.map(n => n.courseCode))].length);
    animateCounter('statTotalSemesters', [...new Set(notes.map(n => n.semester))].length);
}

function updateHeroStats(notes) {
    animateCounter('heroStatNotes', notes.length);
    animateCounter('heroStatDepts', [...new Set(notes.map(n => n.department))].length);
    animateCounter('heroStatCourses', [...new Set(notes.map(n => n.courseCode))].length);
}

function animateCounter(id, target) {
    const el = document.getElementById(id); if (!el) return;
    const start = parseInt(el.textContent) || 0, startTime = performance.now(), duration = 1200;
    function update(t) {
        const p = Math.min((t - startTime) / duration, 1);
        el.textContent = Math.round(start + (target - start) * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function initStatsScrollAnimation() {
    const grid = document.getElementById('statsGrid'); 
    if(!grid) return;
    let done = false;
    new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !done) {
            done = true;
            gsap.fromTo(grid.querySelectorAll('.stat-card'), { opacity: 0, y: 40, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.12, ease: 'back.out(1.4)' });
        }
    }, { threshold: 0.2 }).observe(grid);
}

/* ===========================================
   3D TILT & CARD GLOW
   =========================================== */
function init3DCardTilt() {
    document.querySelectorAll('.note-card[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect();
            card.style.transform = `perspective(800px) rotateX(${((e.clientY - r.top - r.height / 2) / (r.height / 2)) * -4}deg) rotateY(${((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 4}deg) translateY(-4px)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)'; });
    });
}

function initCardGlowDelegate() {
    document.addEventListener('mousemove', (e) => {
        const card = e.target.closest('.note-card');
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty('--card-glow-x', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--card-glow-y', ((e.clientY - r.top) / r.height * 100) + '%');
    });
}

/* ===========================================
   SCROLL REVEAL (AOS)
   =========================================== */
function initScrollReveal() {
    if(typeof AOS !== 'undefined') {
        AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 60, disable: window.innerWidth < 768 ? 'phone' : false });
    }
}

/* ===========================================
   USER ANNOUNCEMENTS
   =========================================== */
async function fetchUserAnnouncements() {
    const container = document.getElementById('userAnnouncementsList');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/admin/announcements`);
        const data = await res.json();

        if (res.ok && data.announcements && data.announcements.length > 0) {
            container.innerHTML = data.announcements.map(a => `
                <div class="user-announcement-card">
                    <div class="user-announcement-title">
                        <i class="fas fa-bullhorn"></i>
                        ${escapeHTML(a.title)}
                        <span class="user-announcement-date">${getTimeAgo(a.createdAt)}</span>
                    </div>
                    <div class="user-announcement-message">${escapeHTML(a.message)}</div>
                </div>
            `).join('');

            gsap.fromTo(container.querySelectorAll('.user-announcement-card'),
                { opacity: 0, x: -20 },
                { opacity: 1, x: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
            );
        } else {
            container.innerHTML = `
                <div class="announcements-empty-user">
                    <i class="fas fa-bullhorn"></i>
                    No announcements right now.
                </div>
            `;
        }
    } catch (err) {
        container.innerHTML = '';
    }
}

/* ===========================================
   UTILITIES
   =========================================== */
function escapeHTML(str) { if (!str) return ''; const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

function getTimeAgo(dateString) {
    if (!dateString) return 'Just now';
    const s = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (s < 10) return 'Just now';
    if (s < 60) return s + 's ago';
    const m = Math.floor(s / 60);
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    const d = Math.floor(h / 24);
    return d < 30 ? d + 'd ago' : Math.floor(d / 30) + 'mo ago';
}
/* ===========================================
   GOOGLE LOGIN - FULLY CORRECTED
=========================================== */

// --- Configuration ---
const ALLOWED_DOMAIN = "@vitstudent.ac.in";

// --- Toast Notification System (Replaces alert()) ---
(function initToastSystem() {
    const style = document.createElement('style');
    style.textContent = `
        .toast-container { position: fixed; top: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
        .toast { padding: 12px 20px; border-radius: 8px; color: #fff; font-family: system-ui, sans-serif; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transform: translateX(120%); transition: transform 0.3s ease; pointer-events: auto; }
        .toast.show { transform: translateX(0); }
        .toast-error { background-color: #e74c3c; }
        .toast-success { background-color: #2ecc71; }
        .toast-info { background-color: #3498db; }
    `;
    document.head.appendChild(style);
    
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.id = 'toastContainer';
    document.body.appendChild(container);
})();

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- DOM Caching (Safe fallbacks) ---
const DOM = {
    loginScreen: document.getElementById("loginScreen"),
    mainWebsite: document.getElementById("mainWebsite"),
    userProfileBox: document.getElementById("userProfileBox"),
    userPhoto: document.getElementById("userPhoto"),
    userName: document.getElementById("userName"),
    userEmail: document.getElementById("userEmail"),
    logoutBtn: document.getElementById("logoutBtn"),
    googleLoginBtn: document.getElementById("googleLoginBtn"),
    navLoginBtn: document.getElementById("navLoginBtn")
};

// --- Helper Functions ---
function isAllowedEmail(email) {
    return email?.toLowerCase().endsWith(ALLOWED_DOMAIN);
}

// --- UI State Management ---
function showUser(user) {
    if (DOM.loginScreen) DOM.loginScreen.style.display = "none";
    if (DOM.mainWebsite) DOM.mainWebsite.style.display = "block";
    if (DOM.userProfileBox) DOM.userProfileBox.style.display = "flex";
    
    if (DOM.userPhoto) DOM.userPhoto.src = user.photoURL;
    if (DOM.userName) DOM.userName.textContent = user.displayName; // textContent is safer than innerText
    if (DOM.userEmail) DOM.userEmail.textContent = user.email;

    if (DOM.navLoginBtn) DOM.navLoginBtn.style.display = "none";
}

function showLoginScreen() {
    if (DOM.loginScreen) DOM.loginScreen.style.display = "flex";
    if (DOM.mainWebsite) DOM.mainWebsite.style.display = "none";
    if (DOM.userProfileBox) DOM.userProfileBox.style.display = "none";

    if (DOM.navLoginBtn) DOM.navLoginBtn.style.display = ""; // Resets to default CSS
}

// --- Auth Logic ---
async function handleGoogleLogin() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        // Client-side validation
        if (!isAllowedEmail(user.email)) {
            await auth.signOut();
            showToast("Access Denied: Only VIT student emails are allowed.", "error");
            return;
        }

        showUser(user);
        showToast(`Welcome, ${user.displayName || 'Student'}!`, "success");

    } catch (error) {
        // Don't show an error if the user simply closed the popup
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            return;
        }

        console.error("Login Error:", error.code, error.message);
        
        // User-friendly error messages
        let errorMessage = "An unexpected error occurred. Please try again.";
        if (error.code === 'auth/network-request-failed') {
            errorMessage = "Network error. Please check your internet connection.";
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = "Too many failed attempts. Please wait a moment and try again.";
        }
        
        showToast(errorMessage, "error");
    }
}

function checkLoginState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            if (isAllowedEmail(user.email)) {
                showUser(user);
            } else {
                // Signed in but wrong domain, kick them out silently
                auth.signOut();
            }
        } else {
            showLoginScreen();
        }
    });
}

// --- Event Listeners ---
if (DOM.googleLoginBtn) {
    DOM.googleLoginBtn.addEventListener("click", handleGoogleLogin);
}

if (DOM.navLoginBtn) {
    DOM.navLoginBtn.addEventListener("click", handleGoogleLogin);
}

if (DOM.logoutBtn) {
    DOM.logoutBtn.addEventListener("click", async () => {
        try {
            await auth.signOut();
            showLoginScreen(); // Smoothly update UI without reloading the page
            showToast("Logged out successfully.", "info");
        } catch (error) {
            console.error("Logout Error:", error);
            // Fallback to reload only if logout fails to prevent stuck states
            location.reload(); 
        }
    });
}

// --- Initialize ---
// Ensure 'auth' is already defined (e.g., const auth = firebase.auth();) before this script runs
if (typeof auth !== 'undefined') {
    checkLoginState();
} else {
    console.error("Firebase auth is not defined. Make sure firebase.initializeApp() runs first.");
}
