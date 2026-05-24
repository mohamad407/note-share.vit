/**
 * ============================================
 * NOTEVAULT — Backend Server (Complete)
 * ============================================
 *
 * PUBLIC APIs:
 *   GET  /notes         — Fetch all notes (public)
 *   POST /upload        — Upload a note (public)
 *   GET  /search?q=     — Search notes (public)
 *   DELETE /notes/:id   — Delete own note (uploader only)
 *
 * ADMIN APIs:
 *   POST /admin/login              — Admin login
 *   GET  /admin/notes              — Fetch all notes (admin)
 *   PUT  /edit/:id                 — Edit any note (admin)
 *   DELETE /delete/:id             — Delete any note (admin)
 *   GET  /admin/announcements      — Get announcements (public read)
 *   POST /admin/announcements      — Create announcement (admin)
 *   DELETE /admin/announcements/:id — Delete announcement (admin)
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───
app.use(express.json({ limit: '70mb' }));
app.use(cors());

// ─── Admin Configuration ───
// Set these via environment variables in production
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'asif';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Ummulhaina@20';

// ─── In-Memory Storage ───
let notes = [];
let announcements = [];
const adminSessions = new Set();

// ─── Admin Auth Middleware ───
function adminAuth(req, res, next) {
    const token = req.headers['x-admin-token'];
    if (!token || !adminSessions.has(token)) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
    }
    next();
}

/* ============================================
   PUBLIC APIs
   ============================================ */

// Health check
app.get('/', (req, res) => {
    res.status(200).json({ service: 'NoteVault API', version: '1.0.0', status: 'running', totalNotes: notes.length });
});

// Get all notes (public)
app.get('/notes', (req, res) => {
    try {
        const sorted = [...notes].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        res.status(200).json({ success: true, count: sorted.length, notes: sorted });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch notes' });
    }
});

// Upload a note (public)
app.post('/upload', (req, res) => {
    try {
        const { courseCode, courseName, department, semester, facultyName, unitNumber, pdfUrl, uploaderId } = req.body;

        if (!courseCode || !courseName || !department || !semester || !facultyName || !unitNumber || !pdfUrl) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const trimmed = {
            courseCode: courseCode.trim(), courseName: courseName.trim(),
            department: department.trim(), semester: semester.trim(),
            facultyName: facultyName.trim(), unitNumber: unitNumber.trim(),
            pdfUrl: pdfUrl.trim(), uploaderId: (uploaderId || '').trim()
        };

        if (Object.values(trimmed).some(v => v === '')) {
            return res.status(400).json({ success: false, message: 'Fields cannot be empty.' });
        }

        if (!trimmed.pdfUrl.startsWith('data:')) {
            try { new URL(trimmed.pdfUrl); } catch (_) {
                return res.status(400).json({ success: false, message: 'Invalid PDF URL.' });
            }
        }

        const newNote = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            ...trimmed,
            uploadedAt: new Date().toISOString()
        };

        notes.push(newNote);
        res.status(201).json({ success: true, message: 'Note uploaded successfully!', note: newNote });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Search notes (public)
app.get('/search', (req, res) => {
    try {
        const query = req.query.q;
        if (!query || !query.trim()) {
            return res.status(400).json({ success: false, message: 'Query parameter "q" is required.' });
        }

        const term = query.trim().toLowerCase();
        const results = notes.filter(n =>
            n.courseCode.toLowerCase().includes(term) ||
            n.courseName.toLowerCase().includes(term) ||
            n.department.toLowerCase().includes(term)
        ).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        res.status(200).json({ success: true, query: query.trim(), count: results.length, notes: results });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Delete own note (uploader check)
app.delete('/notes/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { uploaderId } = req.body;
        const idx = notes.findIndex(n => n.id === id);

        if (idx === -1) return res.status(404).json({ success: false, message: 'Note not found.' });
        if (!uploaderId) return res.status(401).json({ success: false, message: 'Uploader ID required.' });
        if (notes[idx].uploaderId !== uploaderId) return res.status(403).json({ success: false, message: 'You can only delete your own notes.' });

        const deleted = notes.splice(idx, 1)[0];
        res.status(200).json({ success: true, message: 'Note deleted.', deletedNote: deleted });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

/* ============================================
   ADMIN APIs
   ============================================ */

// Admin login
app.post('/admin/login', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }

        // Check credentials
        if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
            return res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }

        // Generate session token
        const token = 'adm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12);
        adminSessions.add(token);

        res.status(200).json({ success: true, message: 'Login successful.', token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Admin get all notes
app.get('/admin/notes', adminAuth, (req, res) => {
    try {
        const sorted = [...notes].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        res.status(200).json({ success: true, count: sorted.length, notes: sorted });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch notes.' });
    }
});

// Admin edit any note
app.put('/edit/:id', adminAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { courseCode, courseName, department, semester, facultyName, unitNumber, pdfUrl } = req.body;

        // Validate
        if (!courseCode || !courseName || !department || !semester || !facultyName || !unitNumber || !pdfUrl) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const idx = notes.findIndex(n => n.id === id);
        if (idx === -1) return res.status(404).json({ success: false, message: 'Note not found.' });

        // Update the note
        notes[idx] = {
            ...notes[idx],
            courseCode: courseCode.trim(),
            courseName: courseName.trim(),
            department: department.trim(),
            semester: semester.trim(),
            facultyName: facultyName.trim(),
            unitNumber: unitNumber.trim(),
            pdfUrl: pdfUrl.trim()
        };

        res.status(200).json({ success: true, message: 'Note updated successfully.', note: notes[idx] });
    } catch (error) {
        console.error('Edit error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Admin delete any note
app.delete('/delete/:id', adminAuth, (req, res) => {
    try {
        const { id } = req.params;
        const idx = notes.findIndex(n => n.id === id);

        if (idx === -1) return res.status(404).json({ success: false, message: 'Note not found.' });

        const deleted = notes.splice(idx, 1)[0];
        res.status(200).json({ success: true, message: 'Note deleted successfully.', deletedNote: deleted });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

/* ============================================
   ANNOUNCEMENTS
   ============================================ */

// Get all announcements (public read — students can see them)
app.get('/admin/announcements', (req, res) => {
    try {
        const sorted = [...announcements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.status(200).json({ success: true, count: sorted.length, announcements: sorted });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch announcements.' });
    }
});

// Create announcement (admin only)
app.post('/admin/announcements', adminAuth, (req, res) => {
    try {
        const { title, message } = req.body;

        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required.' });
        }

        const announcement = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            title: title.trim(),
            message: message.trim(),
            createdAt: new Date().toISOString()
        };

        announcements.push(announcement);
        res.status(201).json({ success: true, message: 'Announcement published.', announcement });
    } catch (error) {
        console.error('Announcement error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Delete announcement (admin only)
app.delete('/admin/announcements/:id', adminAuth, (req, res) => {
    try {
        const { id } = req.params;
        const idx = announcements.findIndex(a => a.id === id);

        if (idx === -1) return res.status(404).json({ success: false, message: 'Announcement not found.' });

        announcements.splice(idx, 1);
        res.status(200).json({ success: true, message: 'Announcement deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// ─── 404 Handler ───
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ─── Start Server ───
app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════╗
  ║           NoteVault API Server            ║
  ║                                           ║
  ║   Status:   Running                       ║
  ║   Port:     ${PORT}                           ║
  ║   URL:      http://localhost:${PORT}         ║
  ║   Admin:    ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}          ║
  ║                                           ║
  ║   Public Endpoints:                        ║
  ║   GET  /notes          Fetch all notes    ║
  ║   POST /upload         Upload note        ║
  ║   GET  /search?q=       Search notes      ║
  ║   DEL  /notes/:id       Delete own note   ║
  ║                                           ║
  ║   Admin Endpoints:                         ║
  ║   POST /admin/login     Admin login       ║
  ║   GET  /admin/notes     Admin fetch       ║
  ║   PUT  /edit/:id        Edit note         ║
  ║   DEL  /delete/:id      Delete note       ║
  ║   GET  /admin/announcements              ║
  ║   POST /admin/announcements  Publish       ║
  ║   DEL  /admin/announcements/:id  Delete    ║
  ╚═══════════════════════════════════════════╝
    `);
});
