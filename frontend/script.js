/* ============================================
   NOTEVAULT — Frontend JavaScript
   Handles: Particles, Animations, API calls,
   Search, Rendering, Interactions
   ============================================ */

// ─── Backend URL ───
// Replace with your deployed Render URL
const API_BASE =  "https://note-share-vit.onrender.com";

// ─── State ───
let allNotes = [];
let searchTimeout = null;

// ─── Initialize on DOM Ready ───
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initTypingAnimation();
    initNavbar();
    initMobileNav();
    initRippleEffects();
    initForm();
    initSearch();
    initScrollReveal();
    fetchAndRenderNotes();
    initSmoothScroll();
    init3DCardTilt();
});

/* ===========================================
   PARTICLE BACKGROUND
   =========================================== */
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 60;
    const CONNECTION_DIST = 140;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.4 + 0.1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update and draw particles
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            // Wrap around edges
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 212, 255, ${p.opacity})`;
            ctx.fill();

            // Draw connections
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONNECTION_DIST) {
                    const alpha = (1 - dist / CONNECTION_DIST) * 0.08;
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
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 80;

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
            typeSpeed = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 400; // Pause before new word
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

    // Scroll behavior
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active section highlighting
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
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
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

/* ===========================================
   RIPPLE EFFECTS
   =========================================== */
function initRippleEffects() {
    document.querySelectorAll('.btn-ripple').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

/* ===========================================
   TOAST NOTIFICATIONS
   =========================================== */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: 'fa-check',
        error: 'fa-xmark',
        info: 'fa-info'
    };

    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Trigger show animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
    });

    // Auto dismiss after 4s
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

/* ===========================================
   FORM HANDLING
   =========================================== */
function initForm() {
    const form = document.getElementById('uploadForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear previous errors
        clearFormErrors();

        // Get values
        const data = {
            courseCode: document.getElementById('courseCode').value.trim(),
            courseName: document.getElementById('courseName').value.trim(),
            department: document.getElementById('department').value.trim(),
            semester: document.getElementById('semester').value.trim(),
            facultyName: document.getElementById('facultyName').value.trim(),
            unitNumber: document.getElementById('unitNumber').value.trim(),
            pdfUrl: document.getElementById('pdfUrl').value.trim()
        };

        // Validate
        if (!validateForm(data)) return;

        // Show loading state
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
                form.reset();
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
        { key: 'unitNumber', label: 'Unit Number is required' },
        { key: 'pdfUrl', label: 'PDF URL is required' }
    ];

    fields.forEach(field => {
        if (!data[field.key]) {
            const input = document.getElementById(field.key);
            const error = document.getElementById(field.key + 'Error');
            input.classList.add('input-error');
            error.textContent = field.label;
            isValid = false;
        }
    });

    // Validate URL format
    if (data.pdfUrl && !isValidUrl(data.pdfUrl)) {
        const input = document.getElementById('pdfUrl');
        const error = document.getElementById('pdfUrlError');
        input.classList.add('input-error');
        error.textContent = 'Please enter a valid URL';
        isValid = false;
    }

    return isValid;
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
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

        // Trigger pulse animation
        pulse.classList.remove('active');
        void pulse.offsetWidth; // Reflow trick
        if (query) pulse.classList.add('active');

        // Debounced search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 250);
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

    // Show skeletons briefly
    showSkeletons('notesGrid', 3);

    try {
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const result = await response.json();

        if (response.ok) {
            renderNotesGrid(result.notes);
            updateNotesSubtitle(result.notes.length, true, query);
        }
    } catch (err) {
        console.error('Search error:', err);
        // Fallback: client-side search
        const filtered = allNotes.filter(note => {
            const q = query.toLowerCase();
            return (
                note.courseCode.toLowerCase().includes(q) ||
                note.courseName.toLowerCase().includes(q) ||
                note.department.toLowerCase().includes(q)
            );
        });
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
    // Show skeletons
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
        // Show empty state on connection error
        renderRecentUploads([]);
        renderNotesGrid([]);
    }
}

/* ─── Render Recent Uploads ─── */
function renderRecentUploads(notes) {
    const grid = document.getElementById('recentGrid');
    const recent = notes.slice(0, 3);

    if (recent.length === 0) {
        grid.innerHTML = getEmptyStateHTML('recent');
        return;
    }

    grid.innerHTML = recent.map(note => createNoteCardHTML(note)).join('');

    // Animate cards in
    gsap.fromTo(grid.querySelectorAll('.note-card'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
    );
}

/* ─── Render Notes Grid ─── */
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

    // Animate cards
    gsap.fromTo(grid.querySelectorAll('.note-card'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' }
    );

    // Re-attach 3D tilt
    init3DCardTilt();
}

/* ─── Create Note Card HTML ─── */
function createNoteCardHTML(note) {
    const timeAgo = getTimeAgo(note.uploadedAt);
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
                <a href="${escapeHTML(note.pdfUrl)}" target="_blank" rel="noopener noreferrer" class="btn-open-pdf">
                    Open PDF <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>
    `;
}

/* ─── Empty State HTML ─── */
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

/* ─── Skeleton Loading ─── */
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
   SEARCH TAGS (Quick Filters)
   =========================================== */
function updateSearchTags(notes) {
    const container = document.getElementById('searchTags');

    if (notes.length === 0) {
        container.innerHTML = '<span class="search-tag-hint">Quick filters will appear here after you upload notes</span>';
        return;
    }

    // Extract unique departments and course codes
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

    // Scroll to notes
    document.getElementById('notes').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ===========================================
   STATISTICS
   =========================================== */
function updateStats(notes) {
    const totalNotes = notes.length;
    const departments = [...new Set(notes.map(n => n.department))].length;
    const courses = [...new Set(notes.map(n => n.courseCode))].length;
    const semesters = [...new Set(notes.map(n => n.semester))].length;

    animateCounter('statTotalNotes', totalNotes);
    animateCounter('statTotalDepts', departments);
    animateCounter('statTotalCourses', courses);
    animateCounter('statTotalSemesters', semesters);
}

function updateHeroStats(notes) {
    const totalNotes = notes.length;
    const departments = [...new Set(notes.map(n => n.department))].length;
    const courses = [...new Set(notes.map(n => n.courseCode))].length;

    animateCounter('heroStatNotes', totalNotes);
    animateCounter('heroStatDepts', departments);
    animateCounter('heroStatCourses', courses);
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

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);

        el.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
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
   SCROLL REVEAL (AOS Init)
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

    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}
