/**
 * ============================================
 * NOTEVAULT — Backend Server
 * Node.js + Express.js
 * ============================================
 *
 * API Endpoints:
 *   GET    /notes          — Fetch all notes
 *   POST   /upload         — Upload a new note
 *   GET    /search?q=      — Search notes
 *   DELETE /notes/:id      — Delete a note (owner only)
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 70mb to handle base64-encoded PDFs up to 50MB
app.use(express.json({ limit: '70mb' }));
app.use(cors());

// ─── In-Memory Storage ───
let notes = [];

// ─── GET /notes ───
app.get('/notes', (req, res) => {
    try {
        const sorted = [...notes].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        res.status(200).json({ success: true, count: sorted.length, notes: sorted });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch notes' });
    }
});

// ─── POST /upload ───
app.post('/upload', (req, res) => {
    try {
        const { courseCode, courseName, department, semester, facultyName, unitNumber, pdfUrl, uploaderId } = req.body;

        // Validate all fields
        if (!courseCode || !courseName || !department || !semester || !facultyName || !unitNumber || !pdfUrl) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: courseCode, courseName, department, semester, facultyName, unitNumber, pdfUrl'
            });
        }

        const trimmed = {
            courseCode: courseCode.trim(),
            courseName: courseName.trim(),
            department: department.trim(),
            semester: semester.trim(),
            facultyName: facultyName.trim(),
            unitNumber: unitNumber.trim(),
            pdfUrl: pdfUrl.trim(),
            uploaderId: (uploaderId || '').trim()
        };

        if (Object.values(trimmed).some(v => v === '')) {
            return res.status(400).json({ success: false, message: 'Fields cannot be empty or whitespace only' });
        }

        // Validate URL only if it's not a base64 data URL
        if (!trimmed.pdfUrl.startsWith('data:')) {
            try { new URL(trimmed.pdfUrl); } catch (_) {
                return res.status(400).json({ success: false, message: 'pdfUrl must be a valid URL or a base64 data URL' });
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
        res.status(500).json({ success: false, message: 'Internal server error during upload' });
    }
});

// ─── GET /search?q= ───
app.get('/search', (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.trim() === '') {
            return res.status(400).json({ success: false, message: 'Search query parameter "q" is required' });
        }

        const term = query.trim().toLowerCase();
        const results = notes.filter(n =>
            n.courseCode.toLowerCase().includes(term) ||
            n.courseName.toLowerCase().includes(term) ||
            n.department.toLowerCase().includes(term)
        ).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        res.status(200).json({ success: true, query: query.trim(), count: results.length, notes: results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during search' });
    }
});

// ─── DELETE /notes/:id ───
// Only the uploader (matching uploaderId) can delete their own note
app.delete('/notes/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { uploaderId } = req.body;

        // Find the note
        const noteIndex = notes.findIndex(n => n.id === id);

        // Note not found
        if (noteIndex === -1) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }

        const note = notes[noteIndex];

        // Check if uploaderId is provided
        if (!uploaderId) {
            return res.status(401).json({ success: false, message: 'Uploader ID is required to delete' });
        }

        // Check ownership — only the original uploader can delete
        if (note.uploaderId !== uploaderId) {
            return res.status(403).json({ success: false, message: 'You can only delete your own notes' });
        }

        // Remove the note
        const deleted = notes.splice(noteIndex, 1)[0];

        res.status(200).json({
            success: true,
            message: 'Note deleted successfully',
            deletedNote: deleted
        });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during delete' });
    }
});

// ─── Health Check ───
app.get('/', (req, res) => {
    res.status(200).json({ service: 'NoteVault API', version: '1.0.0', status: 'running', totalNotes: notes.length });
});

// ─── 404 Handler ───
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ─── Start Server ───
app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════╗
  ║         NoteVault API Server          ║
  ║                                       ║
  ║   Status:  Running                    ║
  ║   Port:    ${PORT}                        ║
  ║   URL:     http://localhost:${PORT}      ║
  ║   JSON Limit: 70MB (for PDF uploads)  ║
  ║                                       ║
  ║   Endpoints:                           ║
  ║   GET    /notes      — Fetch all      ║
  ║   POST   /upload     — Upload note    ║
  ║   GET    /search?q=  — Search notes   ║
  ║   DELETE /notes/:id  — Delete note    ║
  ╚═══════════════════════════════════════╝
    `);
});
