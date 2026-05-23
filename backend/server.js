/**
 * ============================================
 * NOTEVAULT — Backend Server
 * Node.js + Express.js
 * ============================================
 *
 * API Endpoints:
 *   GET  /notes     — Fetch all uploaded notes
 *   POST /upload    — Upload a new note (file as base64 or URL)
 *   GET  /search?q= — Search notes by code, name, or department
 *
 * Notes are stored in-memory (array).
 * For production, replace with a database + cloud storage.
 */

const express = require('express');
const cors = require('cors');

// ─── Initialize Express App ───
const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───
// Increased limit to 10mb to handle base64-encoded PDF files (5MB PDF ≈ 6.7MB base64)
app.use(express.json({ limit: '10mb' }));

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// ─── In-Memory Storage ───
let notes = [];

// ─── API ENDPOINTS ───

/**
 * GET /notes
 * Returns all uploaded notes sorted by newest first.
 */
app.get('/notes', (req, res) => {
    try {
        const sortedNotes = [...notes].sort(
            (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
        );

        res.status(200).json({
            success: true,
            count: sortedNotes.length,
            notes: sortedNotes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notes'
        });
    }
});

/**
 * POST /upload
 * Accepts note data in the request body and saves it.
 * The pdfUrl field can contain either:
 *   - A regular URL (e.g. Google Drive link)
 *   - A base64 data URL (e.g. "data:application/pdf;base64,...")
 *
 * Expected body:
 * {
 *   courseCode: string,
 *   courseName: string,
 *   department: string,
 *   semester: string,
 *   facultyName: string,
 *   unitNumber: string,
 *   pdfUrl: string (URL or base64 data URL)
 * }
 */
app.post('/upload', (req, res) => {
    try {
        const { courseCode, courseName, department, semester, facultyName, unitNumber, pdfUrl } = req.body;

        // ─── Validation ───
        if (!courseCode || !courseName || !department || !semester || !facultyName || !unitNumber || !pdfUrl) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: courseCode, courseName, department, semester, facultyName, unitNumber, pdfUrl'
            });
        }

        const trimmedData = {
            courseCode: courseCode.trim(),
            courseName: courseName.trim(),
            department: department.trim(),
            semester: semester.trim(),
            facultyName: facultyName.trim(),
            unitNumber: unitNumber.trim(),
            pdfUrl: pdfUrl.trim()
        };

        const hasEmptyField = Object.values(trimmedData).some(val => val === '');
        if (hasEmptyField) {
            return res.status(400).json({
                success: false,
                message: 'Fields cannot be empty or whitespace only'
            });
        }

        // If pdfUrl is not a data URL, validate it as a proper URL
        if (!trimmedData.pdfUrl.startsWith('data:')) {
            try {
                new URL(trimmedData.pdfUrl);
            } catch (_) {
                return res.status(400).json({
                    success: false,
                    message: 'pdfUrl must be a valid URL or a base64 data URL'
                });
            }
        }

        // ─── Create Note Object ───
        const newNote = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            ...trimmedData,
            uploadedAt: new Date().toISOString()
        };

        // ─── Save to Array ───
        notes.push(newNote);

        res.status(201).json({
            success: true,
            message: 'Note uploaded successfully!',
            note: newNote
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during upload'
        });
    }
});

/**
 * GET /search?q=searchTerm
 * Searches notes by course code, course name, or department.
 * Search is case-insensitive.
 */
app.get('/search', (req, res) => {
    try {
        const query = req.query.q;

        if (!query || query.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search query parameter "q" is required'
            });
        }

        const searchTerm = query.trim().toLowerCase();

        const results = notes.filter(note => {
            return (
                note.courseCode.toLowerCase().includes(searchTerm) ||
                note.courseName.toLowerCase().includes(searchTerm) ||
                note.department.toLowerCase().includes(searchTerm)
            );
        });

        results.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        res.status(200).json({
            success: true,
            query: query.trim(),
            count: results.length,
            notes: results
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during search'
        });
    }
});

// ─── Health Check ───
app.get('/', (req, res) => {
    res.status(200).json({
        service: 'NoteVault API',
        version: '1.0.0',
        status: 'running',
        totalNotes: notes.length
    });
});

// ─── 404 Handler ───
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`
    });
});

// ─── Start the Server ───
app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════╗
  ║         NoteVault API Server          ║
  ║                                       ║
  ║   Status:  Running                    ║
  ║   Port:    ${PORT}                        ║
  ║   URL:     http://localhost:${PORT}      ║
  ║   JSON Limit: 10MB (for PDF uploads)  ║
  ║                                       ║
  ║   Endpoints:                           ║
  ║   GET  /notes     — Fetch all notes   ║
  ║   POST /upload    — Upload a note     ║
  ║   GET  /search?q= — Search notes      ║
  ╚═══════════════════════════════════════╝
    `);
});
