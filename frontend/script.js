/* ============================================
   NOTEVAULT — Frontend JavaScript
   ============================================ */

const API_BASE = 'https://note-share-vit.onrender.com';
const auth = firebase.auth();

const googleLoginBtn = document.getElementById('googleLoginBtn');
const navLoginBtn = document.getElementById('navLoginBtn');
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ============================================
// GOOGLE AUTH
// ============================================

let currentUser = null;

function saveUser(user) {
    currentUser = user;
    localStorage.setItem('notevault_user', JSON.stringify(user));
}

function getSavedUser() {
    const user = localStorage.getItem('notevault_user');
    return user ? JSON.parse(user) : null;
}

function logoutUser() {
    localStorage.removeItem('notevault_user');
    currentUser = null;
    location.reload();
}

function updateAuthUI() {

    const loginBtn = document.getElementById('googleLoginBtn');
    const userBox = document.getElementById('userProfileBox');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userPhoto = document.getElementById('userPhoto');

    if (!loginBtn || !userBox) return;

    if (currentUser) {

        loginBtn.style.display = 'none';
        userBox.style.display = 'flex';

        userName.textContent = currentUser.name;
        userEmail.textContent = currentUser.email;
        userPhoto.src = currentUser.photo;

    } else {

        loginBtn.style.display = 'flex';
        userBox.style.display = 'none';
    }
}

function initGoogleAuth() {

    currentUser = getSavedUser();

    updateAuthUI();


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


const authScreen = document.getElementById("authScreen");
const mainWebsite = document.getElementById("mainWebsite");
const provider = new firebase.auth.GoogleAuthProvider();

document.getElementById("googleLoginBtn").addEventListener("click", async () => {

    try {

        const result =await firebase.auth().signInWithRedirect(provider);
       firebase.auth().getRedirectResult()
.then((result) => {

    if (result.user) {

        document.getElementById("loginScreen").style.display = "none";

        document.getElementById("mainWebsite").style.display = "block";

        document.getElementById("userName").innerText = result.user.displayName;

        document.getElementById("userEmail").innerText = result.user.email;

        document.getElementById("userPhoto").src = result.user.photoURL;

        document.getElementById("userProfileBox").style.display = "flex";
    }

})
.catch((error) => {
    console.log(error);
});

        const user = result.user;

        if (!user.email.endsWith("@vitstudent.ac.in")) {

            alert("Only VIT student emails allowed");

            await firebase.auth().signOut();

            return;
        }

        showUser(user);

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
});

    if (logoutBtn) {

        logoutBtn.addEventListener('click', async () => {

            await firebase.auth().signOut();

            logoutUser();
        });
    }
}

let allNotes = [];
let searchTimeout = null;
let selectedFile = null;
let selectedFileData = null;
let uploadMode = 'file';
let deleteTargetId = null;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPE = 'application/pdf';

// ─── Get or create unique uploader ID ───
function getUploaderId() {
    let id = localStorage.getItem('notevault_uploader_id');
    if (!id) {
        id = 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('notevault_uploader_id', id);
    }
    return id;
}

const MY_UPLOADER_ID = getUploaderId();

document.addEventListener('DOMContentLoaded', () => {
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
    fetchAndRenderNotes();
    initSmoothScroll();
    init3DCardTilt();
    initStatsScrollAnimation();
    fetchUserAnnouncements();   // ← ADD THIS LINE
   initGoogleAuth();
   checkLoginState();
});

/* ===========================================
   PARTICLE BACKGROUND
   =========================================== */
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
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
        navbar.classList.toggle('scrolled', window.scrollY > 60);
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

    function toggle() {
        hamburger.classList.toggle('active'); mobileNav.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    }
    hamburger.addEventListener('click', toggle);
    overlay.addEventListener('click', toggle);
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

    fileBtn.addEventListener('click', () => {
        uploadMode = 'file'; fileBtn.classList.add('active'); urlBtn.classList.remove('active');
        fileRow.style.display = ''; urlRow.style.display = 'none';
    });
    urlBtn.addEventListener('click', () => {
        uploadMode = 'url'; urlBtn.classList.add('active'); fileBtn.classList.remove('active');
        urlRow.style.display = ''; fileRow.style.display = 'none'; clearFileSelection();
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

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => { if (e.target.files.length) handleFileSelection(e.target.files[0]); });

    dropZone.addEventListener('dragenter', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); fileError.textContent = ''; if (e.dataTransfer.files.length) handleFileSelection(e.dataTransfer.files[0]); });

    dropZone.addEventListener('mousemove', (e) => {
        const r = dropZone.getBoundingClientRect();
        dropZone.style.setProperty('--glow-x', ((e.clientX - r.left) / r.width * 100) + '%');
        dropZone.style.setProperty('--glow-y', ((e.clientY - r.top) / r.height * 100) + '%');
    });

    fileRemove.addEventListener('click', (e) => { e.stopPropagation(); clearFileSelection(); });
}

function handleFileSelection(file) {
    const dropZone = document.getElementById('fileDropZone');
    const filePreview = document.getElementById('filePreview');
    const fileError = document.getElementById('fileError');
    fileError.textContent = ''; dropZone.classList.remove('zone-error');

    if (file.type !== ALLOWED_TYPE && !file.name.toLowerCase().endsWith('.pdf')) {
        fileError.textContent = 'Only PDF files are allowed.';
        dropZone.classList.add('zone-error'); setTimeout(() => dropZone.classList.remove('zone-error'), 500); return;
    }
    if (file.size > MAX_FILE_SIZE) {
        fileError.textContent = `File is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed size is 50MB.`;
        dropZone.classList.add('zone-error'); setTimeout(() => dropZone.classList.remove('zone-error'), 500); return;
    }

    selectedFile = file;
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (e) => { selectedFileData = e.target.result; };
    reader.readAsDataURL(file);

    dropZone.classList.add('has-file');
    filePreview.classList.add('visible');
}

function clearFileSelection() {
    selectedFile = null; selectedFileData = null;
    const dz = document.getElementById('fileDropZone');
    dz.classList.remove('has-file', 'zone-error');
    document.getElementById('filePreview').classList.remove('visible');
    document.getElementById('fileInput').value = '';
    document.getElementById('fileError').textContent = '';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/* ===========================================
   TOAST
   =========================================== */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
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

    // Close on cancel
    cancelBtn.addEventListener('click', closeDeleteModal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeDeleteModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeDeleteModal();
    });

    // Confirm delete
    confirmBtn.addEventListener('click', () => {
        if (deleteTargetId) executeDelete(deleteTargetId);
    });
}

function openDeleteModal(noteId) {
    deleteTargetId = noteId;
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return;

    const preview = document.getElementById('modalNotePreview');
    preview.innerHTML = `<div class="mnp-code">${escapeHTML(note.courseCode)} · ${escapeHTML(note.unitNumber)}</div><div class="mnp-name">${escapeHTML(note.courseName)}</div>`;

    document.getElementById('deleteModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
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

            // Animate card out then re-render
            const card = document.querySelector(`.note-card[data-note-id="${noteId}"]`);
            if (card) {
                gsap.to(card, {
                    opacity: 0, scale: 0.9, y: 20, duration: 0.35, ease: 'power2.in',
                    onComplete: () => fetchAndRenderNotes()
                });
            } else {
                fetchAndRenderNotes();
            }
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

// Delegate click for delete buttons on cards
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
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
                document.getElementById('fileError').textContent = 'Please select a PDF file to upload.';
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
        if (!data[f.key]) {
            document.getElementById(f.key).classList.add('input-error');
            document.getElementById(f.key + 'Error').textContent = f.label;
            isValid = false;
        }
    });

    if (uploadMode === 'url') {
        if (!data.pdfUrl) {
            document.getElementById('pdfUrl').classList.add('input-error');
            document.getElementById('pdfUrlError').textContent = 'PDF URL is required';
            isValid = false;
        } else if (!isValidUrl(data.pdfUrl)) {
            document.getElementById('pdfUrl').classList.add('input-error');
            document.getElementById('pdfUrlError').textContent = 'Please enter a valid URL';
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

    input.addEventListener('input', () => {
        const q = input.value.trim();
        clearBtn.style.display = q ? 'flex' : 'none';
        pulse.classList.remove('active'); void pulse.offsetWidth;
        if (q) pulse.classList.add('active');
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => performSearch(q), 250);
    });

    clearBtn.addEventListener('click', () => {
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
    if (!notes.length) { grid.innerHTML = getEmptyStateHTML('recent'); return; }
    grid.innerHTML = notes.slice(0, 3).map(n => createNoteCardHTML(n)).join('');
    gsap.fromTo(grid.querySelectorAll('.note-card'), { opacity: 0, y: 30, rotateX: 5 }, { opacity: 1, y: 0, rotateX: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out' });
}

function renderNotesGrid(notes) {
    const grid = document.getElementById('notesGrid');
    if (!notes.length && !allNotes.length) { grid.innerHTML = getEmptyStateHTML('all'); return; }
    if (!notes.length && document.getElementById('searchInput').value.trim()) {
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
    if (!notes.length) { container.innerHTML = '<span class="search-tag-hint">Quick filters will appear here after you upload notes</span>'; return; }
    let html = '';
    [...new Set(notes.map(n => n.department))].slice(0, 3).forEach(d => { html += `<button class="search-tag" onclick="quickSearch('${escapeHTML(d)}')">${escapeHTML(d)}</button>`; });
    [...new Set(notes.map(n => n.courseCode))].slice(0, 3).forEach(c => { html += `<button class="search-tag" onclick="quickSearch('${escapeHTML(c)}')">${escapeHTML(c)}</button>`; });
    container.innerHTML = html;
}

function quickSearch(term) {
    const input = document.getElementById('searchInput');
    input.value = term; input.dispatchEvent(new Event('input'));
    document.getElementById('notes').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    const grid = document.getElementById('statsGrid'); let done = false;
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
    AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 60, disable: window.innerWidth < 768 ? 'phone' : false });
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

            // Animate cards in
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
   GOOGLE LOGIN
=========================================== */

async function handleGoogleLogin() {
    try {

        const provider = new firebase.auth.GoogleAuthProvider();

        provider.setCustomParameters({
            prompt: 'select_account'
        });

        const result = await auth.signInWithPopup(provider);

        const user = result.user;

        // Allow only VIT mails
        if (!user.email.endsWith("@vitstudent.ac.in")) {

            alert("Only VIT student emails are allowed!");

            await auth.signOut();

            return;
        }

        showUser(user);

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}

function showUser(user) {

    // Hide login screen
    document.getElementById("loginScreen").style.display = "none";

    // Show website
    document.getElementById("mainWebsite").style.display = "block";

    // Show profile box
    document.getElementById("userProfileBox").style.display = "flex";

    // Set user data
    document.getElementById("userPhoto").src = user.photoURL;

    document.getElementById("userName").innerText = user.displayName;

    document.getElementById("userEmail").innerText = user.email;

    // Hide navbar login button
    if (navLoginBtn) {
        navLoginBtn.style.display = "none";
    }
}

function checkLoginState() {

    auth.onAuthStateChanged((user) => {

        if (user) {

            if (user.email.endsWith("@vitstudent.ac.in")) {

                showUser(user);

            } else {

                auth.signOut();
            }

        } else {

            document.getElementById("loginScreen").style.display = "flex";

            document.getElementById("mainWebsite").style.display = "none";
        }
    });
}

// Login buttons
googleLoginBtn.addEventListener("click", handleGoogleLogin);

if (navLoginBtn) {

    navLoginBtn.addEventListener("click", handleGoogleLogin);
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {

    await auth.signOut();

    location.reload();
});
