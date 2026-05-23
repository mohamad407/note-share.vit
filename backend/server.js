/**
 * ============================================
 * NOTEVAULT — Backend Server
 * Node.js + Express.js
 * ============================================
 *
 * API Endpoints:
 *   GET  /notes     — Fetch all uploaded notes
 *   POST /upload    — Upload a new note
 *   GET  /search?q= — Search notes by code, name, or department
 *
 * Notes are stored in-memory (array).
 * For production, replace with a database.
 */

const express = require('express');
const cors = require('cors');

// ─── Initialize Express App ───
const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───
// Parse incoming JSON request bodies
app.use(express.json());

// Enable Cross-Origin Resource Sharing (CORS)
// This allows the frontend (deployed on Vercel) to call this API
app.use(cors());

// ─── In-Memory Storage ───
// All uploaded notes are stored in this array.
// Data resets when the server restarts.
// Replace with a database (MongoDB, PostgreSQL, etc.) for production.
let notes = [];

// ─── API ENDPOINTS ───

/**
 * GET /notes
 * Returns all uploaded notes sorted by newest first.
 */
app.get('/notes', (req, res) => {
    try {
        // Return notes sorted by upload time (newest first)
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
 *
 * Expected body:
 * {
 *   courseCode: string,
 *   courseName: string,
 *   department: string,
 *   semester: string,
 *   facultyName: string,
 *   unitNumber: string,
 *   pdfUrl: string
 * }
 */
app.post('/upload', (req, res) => {
    try {
        const { courseCode, courseName, department, semester, facultyName, unitNumber, pdfUrl } = req.body;

        // ─── Validation ───
        // Check that all required fields are provided
        if (!courseCode || !courseName || !department || !semester || !facultyName || !unitNumber || !pdfUrl) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: courseCode, courseName, department, semester, facultyName, unitNumber, pdfUrl'
            });
        }

        // Trim whitespace from all fields
        const trimmedData = {
            courseCode: courseCode.trim(),
            courseName: courseName.trim(),
            department: department.trim(),
            semester: semester.trim(),
            facultyName: facultyName.trim(),
            unitNumber: unitNumber.trim(),
            pdfUrl: pdfUrl.trim()
        };

        // Check for empty strings after trimming
        const hasEmptyField = Object.values(trimmedData).some(val => val === '');
        if (hasEmptyField) {
            return res.status(400).json({
                success: false,
                message: 'Fields cannot be empty or whitespace only'
            });
        }

        // ─── Create Note Object ───
        const newNote = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            ...trimmedData,
            uploadedAt: new Date().toISOString()
        };

        // ─── Save to Array ───
        notes.push(newNote);

        // ─── Success Response ───
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
 *
 * Query parameter:
 *   q — The search term (required)
 */
app.get('/search', (req, res) => {
    try {
        const query = req.query.q;

        // Check if search query is provided
        if (!query || query.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search query parameter "q" is required'
            });
        }

        // Convert query to lowercase for case-insensitive matching
        const searchTerm = query.trim().toLowerCase();

        // Filter notes: match courseCode, courseName, or department
        const results = notes.filter(note => {
            return (
                note.courseCode.toLowerCase().includes(searchTerm) ||
                note.courseName.toLowerCase().includes(searchTerm) ||
                note.department.toLowerCase().includes(searchTerm)
            );
        });

        // Sort results by newest first
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

// ─── Health Check Endpoint (useful for monitoring) ───
app.get('/', (req, res) => {
    res.status(200).json({
        service: 'NoteVault API',
        version: '1.0.0',
        status: 'running',
        totalNotes: notes.length
    });
});

// ─── 404 Handler — for any unmatched routes ───
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
  ║                                       ║
  ║   Endpoints:                           ║
  ║   GET  /notes     — Fetch all notes   ║
  ║   POST /upload    — Upload a note     ║
  ║   GET  /search?q= — Search notes      ║
  ╚═══════════════════════════════════════╝
    `);
});
