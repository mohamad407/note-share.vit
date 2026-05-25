/**
 * ============================================
 * NOTEVAULT — Backend Server (MongoDB Version)
 * ============================================
 */

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB
const MONGO_URI = process.env.MONGO_URI;

const client = new MongoClient(MONGO_URI);

let notesCollection;
let announcementsCollection;

// Connect MongoDB
async function connectDB() {
    try {
        await client.connect();

        const db = client.db("notevault");

        notesCollection = db.collection("notes");
        announcementsCollection = db.collection("announcements");

        console.log("MongoDB Connected");
    } catch (error) {
        console.error("MongoDB Connection Error:", error);
    }
}

connectDB();

// ─── Middleware ───
app.use(express.json({ limit: '70mb' }));
app.use(cors());

// ─── Admin Configuration ───
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'asif';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Ummulhaina@20';

// ─── Admin Sessions ───
const adminSessions = new Set();

// ─── Admin Auth Middleware ───
function adminAuth(req, res, next) {
    const token = req.headers['x-admin-token'];

    if (!token || !adminSessions.has(token)) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized. Please log in.'
        });
    }

    next();
}

/* ============================================
   PUBLIC APIs
============================================ */

// Health Check
app.get('/', async (req, res) => {
    try {
        const totalNotes = await notesCollection.countDocuments();

        res.status(200).json({
            service: 'NoteVault API',
            version: '1.0.0',
            status: 'running',
            totalNotes
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get All Notes
app.get('/notes', async (req, res) => {
    try {

        const sorted = await notesCollection
            .find({})
            .sort({ uploadedAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            count: sorted.length,
            notes: sorted
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Failed to fetch notes'
        });

    }
});

// Upload Note
app.post('/upload', async (req, res) => {

    try {

        const {
            courseCode,
            courseName,
            department,
            semester,
            facultyName,
            unitNumber,
            pdfUrl,
            uploaderId
        } = req.body;

        if (
            !courseCode ||
            !courseName ||
            !department ||
            !semester ||
            !facultyName ||
            !unitNumber ||
            !pdfUrl
        ) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.'
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

        const newNote = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            ...trimmed,
            uploadedAt: new Date().toISOString()
        };

        await notesCollection.insertOne(newNote);

        res.status(201).json({
            success: true,
            message: 'Note uploaded successfully!',
            note: newNote
        });

    } catch (error) {

        console.error('Upload error:', error);

        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });

    }
});

// Search Notes
app.get('/search', async (req, res) => {

    try {

        const query = req.query.q;

        if (!query || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Query parameter "q" is required.'
            });
        }

        const term = query.trim();

        const results = await notesCollection.find({
            $or: [
                { courseCode: { $regex: term, $options: 'i' } },
                { courseName: { $regex: term, $options: 'i' } },
                { department: { $regex: term, $options: 'i' } }
            ]
        }).toArray();

        res.status(200).json({
            success: true,
            query: term,
            count: results.length,
            notes: results
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });

    }
});

// Delete Own Note
app.delete('/notes/:id', async (req, res) => {

    try {

        const { id } = req.params;
        const { uploaderId } = req.body;

        const note = await notesCollection.findOne({ id });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found.'
            });
        }

        if (!uploaderId) {
            return res.status(401).json({
                success: false,
                message: 'Uploader ID required.'
            });
        }

        if (note.uploaderId !== uploaderId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own notes.'
            });
        }

        await notesCollection.deleteOne({ id });

        res.status(200).json({
            success: true,
            message: 'Note deleted.'
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });

    }
});

/* ============================================
   ADMIN APIs
============================================ */

// Admin Login
app.post('/admin/login', (req, res) => {

    try {

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required.'
            });
        }

        if (
            username !== ADMIN_USERNAME ||
            password !== ADMIN_PASSWORD
        ) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password.'
            });
        }

        const token =
            'adm_' +
            Date.now().toString(36) +
            '_' +
            Math.random().toString(36).slice(2, 12);

        adminSessions.add(token);

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });

    }
});

// Admin Get Notes
app.get('/admin/notes', adminAuth, async (req, res) => {

    try {

        const notes = await notesCollection
            .find({})
            .sort({ uploadedAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            count: notes.length,
            notes
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Failed to fetch notes.'
        });

    }
});

// Admin Edit Note
app.put('/edit/:id', adminAuth, async (req, res) => {

    try {

        const { id } = req.params;

        const {
            courseCode,
            courseName,
            department,
            semester,
            facultyName,
            unitNumber,
            pdfUrl
        } = req.body;

        await notesCollection.updateOne(
            { id },
            {
                $set: {
                    courseCode,
                    courseName,
                    department,
                    semester,
                    facultyName,
                    unitNumber,
                    pdfUrl
                }
            }
        );

        res.status(200).json({
            success: true,
            message: 'Note updated successfully.'
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });

    }
});

// Admin Delete Note
app.delete('/delete/:id', adminAuth, async (req, res) => {

    try {

        const { id } = req.params;

        await notesCollection.deleteOne({ id });

        res.status(200).json({
            success: true,
            message: 'Note deleted successfully.'
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });

    }
});

/* ============================================
   ANNOUNCEMENTS
============================================ */

// Get Announcements
app.get('/admin/announcements', async (req, res) => {

    try {

        const announcements = await announcementsCollection
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            count: announcements.length,
            announcements
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Failed to fetch announcements.'
        });

    }
});

// Create Announcement
app.post('/admin/announcements', adminAuth, async (req, res) => {

    try {

        const { title, message } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required.'
            });
        }

        const announcement = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            title: title.trim(),
            message: message.trim(),
            createdAt: new Date().toISOString()
        };

        await announcementsCollection.insertOne(announcement);

        res.status(201).json({
            success: true,
            message: 'Announcement published.',
            announcement
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });

    }
});

// Delete Announcement
app.delete('/admin/announcements/:id', adminAuth, async (req, res) => {

    try {

        const { id } = req.params;

        await announcementsCollection.deleteOne({ id });

        res.status(200).json({
            success: true,
            message: 'Announcement deleted.'
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });

    }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
