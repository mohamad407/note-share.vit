/* ============================================
   NOTEVAULT — Frontend JavaScript
   Handles: Particles, Animations, File Upload,
   API calls, Search, Rendering, Interactions
   ============================================ */

// ─── Backend URL ───
// Replace with your deployed Render URL
const API_BASE = "https://note-share-vit.onrender.com";

// ─── State ───
let allNotes = [];
let searchTimeout = null;
let selectedFile = null;       // Holds the selected File object
let selectedFileData = null;   // Holds the base64 data URL string
let uploadMode = 'file';       // 'file' or 'url'

// ─── Constants ───
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_TYPE = 'application/pdf';

// ─── Initialize on DOM Ready ───
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

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Track mouse for interactive particles
    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.4 + 0.1,
            baseOpacity: Math.random() * 0.4 + 0.1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            // Mouse interaction — particles glow near cursor
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
                const force = (180 - dist) / 180;
                p.opacity = p.baseOpacity + force * 0.5;
                // Gentle repulsion
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
                const cdx = p.x - p2.x;
                const cdy = p.y - p2.y;
                const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

                if (cdist < CONNECTION_DIST) {
                    const alpha = (1 - cdist / CONNECTION_DIST) * 0.08;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }
    animate();
}

/* ===========================================
   HERO ENTRANCE ANIMATION (GSAP)
   =========================================== */
function initHeroEntrance() {
    const tl = gsap.timeline({ delay: 0.3 });

    tl.to('#heroBadge', {
        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
        startAt: { y: 20 }
    })
    .to('#heroTitle', {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        startAt: { y: 30 }
    }, '-=0.4')
    .to('#heroSubtitle', {
        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
        startAt: { y: 20 }
    }, '-=0.4')
    .to('#heroActions', {
        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
        startAt: { y: 20 }
    }, '-=0.35')
    .to('#heroStats', {
        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
        startAt: { y: 20 }
    }, '-=0.3')
    .to('#heroScroll', {
        opacity: 1, duration: 0.6, ease: 'power2.out'
    }, '-=0.2');
}

/* ===========================================
   TYPING ANIMATION
   =========================================== */
function initTypingAnimation() {
    const phrases = [
        'One Click Away.',
        'Shared Instantly.',
        'Organized Simply.',
        'Searchable Easily.',
        'Free Forever.'
    ];
    const typedEl = document.getElementById('typedText');
    let phraseIndex = 0, charIndex = 0, isDeleting = false, typeSpeed = 80;

    function type() {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            typedEl.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 40;
        } else {
            typedEl.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 80;
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 400;
        }

        setTimeout(type, typeSpeed);
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
        sections.forEach(section => {
            if (window.scrollY >= section.offsetTop - 120) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    });
}

function initMobileNav() {
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('mobileNavOverlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link, .mobile-nav-cta');

    function toggleMenu() {
        hamburger.classList.toggle('active');
        mobileNav.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    }

    hamburger.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);
    mobileLinks.forEach(link => link.addEventListener('click', toggleMenu));
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.getBoundingClientRect().top + window.scrollY - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* ===========================================
   RIPPLE EFFECTS
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

/* ===========================================
   MAGNETIC BUTTON EFFECT
   =========================================== */
function initMagneticButtons() {
    document.querySelectorAll('.btn-magnetic').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
    });
}

/* ===========================================
   UPLOAD MODE TOGGLE (File vs URL)
   =========================================== */
function initUploadModeToggle() {
    const fileBtn = document.getElementById('modeFileBtn');
    const urlBtn = document.getElementById('modeUrlBtn');
    const fileZoneRow = document.getElementById('fileZoneRow');
    const urlZoneRow = document.getElementById('urlZoneRow');

    fileBtn.addEventListener('click', () => {
        uploadMode = 'file';
        fileBtn.classList.add('active');
        urlBtn.classList.remove('active');
        fileZoneRow.style.display = '';
        urlZoneRow.style.display = 'none';
    });

    urlBtn.addEventListener('click', () => {
        uploadMode = 'url';
        urlBtn.classList.add('active');
        fileBtn.classList.remove('active');
        urlZoneRow.style.display = '';
        fileZoneRow.style.display = 'none';
        // Clear file selection when switching to URL mode
        clearFileSelection();
    });
}

/* ===========================================
   FILE UPLOAD (Drag & Drop + Click)
   =========================================== */
function initFileUpload() {
    const dropZone = document.getElementById('fileDropZone');
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    const fileRemove = document.getElementById('fileRemove');
    const fileError = document.getElementById('fileError');

    // Click to browse
    dropZone.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    // Drag events
    dropZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        // Only remove if we actually left the zone
        if (!dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('drag-over');
        }
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        fileError.textContent = '';

        if (e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    // Glow follow mouse on drop zone
    dropZone.addEventListener('mousemove', (e) => {
        const rect = dropZone.getBoundingClientRect();
        dropZone.style.setProperty('--glow-x', ((e.clientX - rect.left) / rect.width * 100) + '%');
        dropZone.style.setProperty('--glow-y', ((e.clientY - rect.top) / rect.height * 100) + '%');
    });

    // Remove file
    fileRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        clearFileSelection();
    });
}

function handleFileSelection(file) {
    const dropZone = document.getElementById('fileDropZone');
    const filePreview = document.getElementById('filePreview');
    const fileError = document.getElementById('fileError');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');

    // Clear previous error
    fileError.textContent = '';
    dropZone.classList.remove('zone-error');

    // Validate file type
    if (file.type !== ALLOWED_TYPE && !file.name.toLowerCase().endsWith('.pdf')) {
        fileError.textContent = 'Only PDF files are allowed. Please select a valid PDF.';
        dropZone.classList.add('zone-error');
        setTimeout(() => dropZone.classList.remove('zone-error'), 500);
        return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        fileError.textContent = `File is ${sizeMB}MB. Maximum allowed size is 5MB.`;
        dropZone.classList.add('zone-error');
        setTimeout(() => dropZone.classList.remove('zone-error'), 500);
        return;
    }

    // Valid file — show preview
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);

    // Read as base64 data URL
    const reader = new FileReader();
    reader.onload = (e) => {
        selectedFileData = e.target.result;
    };
    reader.readAsDataURL(file);

    // Show preview, hide drop zone
    dropZone.classList.add('has-file');
    filePreview.classList.add('visible');
}

function clearFileSelection() {
    selectedFile = null;
    selectedFileData = null;

    const dropZone = document.getElementById('fileDropZone');
    const filePreview = document.getElementById('filePreview');
    const fileInput = document.getElementById('fileInput');
    const fileError = document.getElementById('fileError');

    dropZone.classList.remove('has-file', 'zone-error');
    filePreview.classList.remove('visible');
    fileInput.value = '';
    fileError.textContent = '';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/* ===========================================
   TOAST NOTIFICATIONS
   =========================================== */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = { success: 'fa-check', error: 'fa-xmark', info: 'fa-info' };

    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });

    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

/* ===========================================
   CONFETTI EFFECT
   =========================================== */
function launchConfetti() {
    const container = document.getElementById('confettiContainer');
    const colors = ['#00d4ff', '#7b2ff7', '#00ff88', '#ff8c42', '#ff4d6d', '#ffdd57'];
    const count = 50;

    for (let i = 0; i < count; i++) {
        const piece = document.createElement('div');
        piece.classList.add('confetti-piece');
        piece.style.left = (40 + Math.random() * 20) + '%';
        piece.style.top = (30 + Math.random() * 10) + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.width = (4 + Math.random() * 8) + 'px';
        piece.style.height = (4 + Math.random() * 8) + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        piece.style.animationDuration = (1.2 + Math.random() * 1) + 's';
        piece.style.animationDelay = (Math.random() * 0.3) + 's';

        // Random horizontal spread
        const xOffset = (Math.random() - 0.5) * 400;
        piece.style.setProperty('--x-drift', xOffset + 'px');

        // Override animation with custom keyframes via inline style
        piece.style.animation = `confettiFall ${1.2 + Math.random() * 1}s ease-out ${Math.random() * 0.3}s forwards`;
        piece.style.transform = `translateX(${xOffset}px)`;

        container.appendChild(piece);
        setTimeout(() => piece.remove(), 2500);
    }
}

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
            unitNumber: document.getElementById('unitNumber').value.trim()
        };

        // Handle PDF based on mode
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

        // Show loading
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                showToast('Notes uploaded successfully!', 'success');
                launchConfetti();
                form.reset();
                clearFileSelection();
                fetchAndRenderNotes();
            } else {
                showToast(result.message || 'Upload failed. Try again.', 'error');
            }
        } catch (err) {
            console.error('Upload error:', err);
            showToast('Could not connect to server. Check your connection.', 'error');
        } finally {
            btnText.style.display = 'inline-flex';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
}

function validateForm(data) {
    let isValid = true;
    const fields = [
        { key: 'courseCode', label: 'Course Code is required' },
        { key: 'courseName', label: 'Course Name is required' },
        { key: 'department', label: 'Department is required' },
        { key: 'semester', label: 'Semester is required' },
        { key: 'facultyName', label: 'Faculty Name is required' },
        { key: 'unitNumber', label: 'Unit Number is required' }
    ];

    fields.forEach(field => {
        if (!data[field.key]) {
            document.getElementById(field.key).classList.add('input-error');
            document.getElementById(field.key + 'Error').textContent = field.label;
            isValid = false;
        }
    });

    // Validate URL only in URL mode
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

function isValidUrl(string) {
    try { new URL(string); return true; } catch (_) { return false; }
}

function clearFormErrors() {
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

/* ===========================================
   SEARCH
   =========================================== */
function initSearch() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');
    const pulse = document.getElementById('searchPulse');

    input.addEventListener('input', () => {
        const query = input.value.trim();
        clearBtn.style.display = query ? 'flex' : 'none';

        pulse.classList.remove('active');
        void pulse.offsetWidth;
        if (query) pulse.classList.add('active');

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => performSearch(query), 250);
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.style.display = 'none';
        renderNotesGrid(allNotes);
        updateNotesSubtitle(allNotes.length, false);
    });
}

async function performSearch(query) {
    if (!query) {
        renderNotesGrid(allNotes);
        updateNotesSubtitle(allNotes.length, false);
        return;
    }

    showSkeletons('notesGrid', 3);

    try {
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const result = await response.json();

        if (response.ok) {
            renderNotesGrid(result.notes);
            updateNotesSubtitle(result.notes.length, true, query);
        }
    } catch (err) {
        // Fallback: client-side search
        const q = query.toLowerCase();
        const filtered = allNotes.filter(note =>
            note.courseCode.toLowerCase().includes(q) ||
            note.courseName.toLowerCase().includes(q) ||
            note.department.toLowerCase().includes(q)
        );
        renderNotesGrid(filtered);
        updateNotesSubtitle(filtered.length, true, query);
    }
}

function updateNotesSubtitle(count, isSearch, query = '') {
    const subtitle = document.getElementById('notesSubtitle');
    if (isSearch) {
        subtitle.textContent = count > 0
            ? `Found ${count} result${count !== 1 ? 's' : ''} for "${query}"`
            : `No results found for "${query}"`;
    } else {
        subtitle.textContent = 'Browse all uploaded notes from every department.';
    }
}

/* ===========================================
   FETCH & RENDER NOTES
   =========================================== */
async function fetchAndRenderNotes() {
    showSkeletons('recentGrid', 3);
    showSkeletons('notesGrid', 6);

    try {
        const response = await fetch(`${API_BASE}/notes`);
        const result = await response.json();

        if (response.ok) {
            allNotes = result.notes || [];
            renderRecentUploads(allNotes);
            renderNotesGrid(allNotes);
            updateStats(allNotes);
            updateSearchTags(allNotes);
            updateHeroStats(allNotes);
        }
    } catch (err) {
        console.error('Fetch error:', err);
        renderRecentUploads([]);
        renderNotesGrid([]);
    }
}

function renderRecentUploads(notes) {
    const grid = document.getElementById('recentGrid');
    const recent = notes.slice(0, 3);

    if (recent.length === 0) {
        grid.innerHTML = getEmptyStateHTML('recent');
        return;
    }

    grid.innerHTML = recent.map(note => createNoteCardHTML(note)).join('');

    gsap.fromTo(grid.querySelectorAll('.note-card'),
        { opacity: 0, y: 30, rotateX: 5 },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out' }
    );
}

function renderNotesGrid(notes) {
    const grid = document.getElementById('notesGrid');

    if (notes.length === 0 && allNotes.length === 0) {
        grid.innerHTML = getEmptyStateHTML('all');
        return;
    }

    if (notes.length === 0 && document.getElementById('searchInput').value.trim()) {
        grid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-magnifying-glass"></i>
                <p>No notes match your search. Try different keywords.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = notes.map(note => createNoteCardHTML(note)).join('');

    gsap.fromTo(grid.querySelectorAll('.note-card'),
        { opacity: 0, y: 20, rotateX: 3 },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.45, stagger: 0.07, ease: 'power2.out' }
    );

    init3DCardTilt();
}

function createNoteCardHTML(note) {
    const timeAgo = getTimeAgo(note.uploadedAt);
    const isDataUrl = note.pdfUrl && note.pdfUrl.startsWith('data:');
    const openLabel = isDataUrl ? 'View PDF' : 'Open PDF';

    return `
        <div class="note-card" data-tilt>
            <div class="note-card-header">
                <span class="note-course-code">${escapeHTML(note.courseCode)}</span>
                <span class="note-unit-badge">${escapeHTML(note.unitNumber)}</span>
            </div>
            <h3 class="note-course-name">${escapeHTML(note.courseName)}</h3>
            <div class="note-details">
                <div class="note-detail">
                    <i class="fas fa-building-columns"></i>
                    <span>${escapeHTML(note.department)}</span>
                </div>
                <div class="note-detail">
                    <i class="fas fa-layer-group"></i>
                    <span>${escapeHTML(note.semester)}</span>
                </div>
                <div class="note-detail">
                    <i class="fas fa-chalkboard-user"></i>
                    <span>${escapeHTML(note.facultyName)}</span>
                </div>
            </div>
            <div class="note-card-footer">
                <span class="note-time"><i class="fas fa-clock"></i> ${timeAgo}</span>
                <button class="btn-open-pdf" data-pdf-url="${escapeHTML(note.pdfUrl)}">
                    ${openLabel} <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
}

function getEmptyStateHTML(type) {
    return `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas ${type === 'recent' ? 'fa-clock-rotate-left' : 'fa-folder-open'}"></i>
            </div>
            <h3 class="empty-title">${type === 'recent' ? 'No recent uploads' : 'No notes uploaded yet'}</h3>
            <p class="empty-subtitle">
                ${type === 'recent'
                    ? 'Notes will appear here once someone uploads them.'
                    : 'Be the first to share your study notes with the community!'}
            </p>
            ${type === 'all' ? `
                <a href="#upload" class="empty-btn btn-ripple">
                    <i class="fas fa-cloud-arrow-up"></i> Upload First Note
                </a>
            ` : ''}
        </div>
    `;
}

function showSkeletons(containerId, count) {
    const container = document.getElementById(containerId);
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton-line w-40"></div>
                <div class="skeleton-line w-80"></div>
                <div class="skeleton-line w-60"></div>
                <div class="skeleton-line w-50"></div>
                <div class="skeleton-line w-70"></div>
                <div class="skeleton-line w-30"></div>
            </div>
        `;
    }
    container.innerHTML = html;
}

/* ===========================================
   PDF OPEN HANDLER (Event Delegation)
   Handles both regular URLs and base64 data URLs
   =========================================== */
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-open-pdf');
    if (!btn) return;

    const pdfUrl = btn.getAttribute('data-pdf-url');
    if (!pdfUrl) return;

    if (pdfUrl.startsWith('data:')) {
        // Convert base64 data URL to blob and open
        try {
            const byteString = atob(pdfUrl.split(',')[1]);
            const mimeString = pdfUrl.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
            // Clean up after a delay
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } catch (err) {
            console.error('Failed to open PDF:', err);
            showToast('Failed to open this PDF. It may be corrupted.', 'error');
        }
    } else {
        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    }
});

/* ===========================================
   SEARCH TAGS
   =========================================== */
function updateSearchTags(notes) {
    const container = document.getElementById('searchTags');

    if (notes.length === 0) {
        container.innerHTML = '<span class="search-tag-hint">Quick filters will appear here after you upload notes</span>';
        return;
    }

    const departments = [...new Set(notes.map(n => n.department))];
    const courseCodes = [...new Set(notes.map(n => n.courseCode))];

    let html = '';
    departments.slice(0, 3).forEach(dept => {
        html += `<button class="search-tag" onclick="quickSearch('${escapeHTML(dept)}')">${escapeHTML(dept)}</button>`;
    });
    courseCodes.slice(0, 3).forEach(code => {
        html += `<button class="search-tag" onclick="quickSearch('${escapeHTML(code)}')">${escapeHTML(code)}</button>`;
    });

    container.innerHTML = html;
}

function quickSearch(term) {
    const input = document.getElementById('searchInput');
    input.value = term;
    input.dispatchEvent(new Event('input'));
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

function animateCounter(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const duration = 1200;
    const start = parseInt(el.textContent) || 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (target - start) * eased);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

/* ─── Stats Scroll Animation ─── */
function initStatsScrollAnimation() {
    const statsGrid = document.getElementById('statsGrid');
    let animated = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated) {
                animated = true;
                gsap.fromTo(statsGrid.querySelectorAll('.stat-card'),
                    { opacity: 0, y: 40, scale: 0.95 },
                    {
                        opacity: 1, y: 0, scale: 1,
                        duration: 0.6, stagger: 0.12, ease: 'back.out(1.4)'
                    }
                );
            }
        });
    }, { threshold: 0.2 });

    observer.observe(statsGrid);
}

/* ===========================================
   3D CARD TILT
   =========================================== */
function init3DCardTilt() {
    document.querySelectorAll('.note-card[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -4;
            const rotateY = ((x - centerX) / centerX) * 4;
            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
        });
    });
}

/* ===========================================
   CARD GLOW CURSOR FOLLOW (Event Delegation)
   =========================================== */
function initCardGlowDelegate() {
    document.addEventListener('mousemove', (e) => {
        const card = e.target.closest('.note-card');
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width * 100);
        const y = ((e.clientY - rect.top) / rect.height * 100);
        card.style.setProperty('--card-glow-x', x + '%');
        card.style.setProperty('--card-glow-y', y + '%');
    });
}

/* ===========================================
   SCROLL REVEAL (AOS)
   =========================================== */
function initScrollReveal() {
    AOS.init({
        duration: 700,
        easing: 'ease-out-cubic',
        once: true,
        offset: 60,
        disable: window.innerWidth < 768 ? 'phone' : false
    });
}

/* ===========================================
   UTILITY FUNCTIONS
   =========================================== */
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getTimeAgo(dateString) {
    if (!dateString) return 'Just now';
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
}
