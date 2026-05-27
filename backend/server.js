/**
 * ============================================
 * NOTEVAULT — Backend Server (MongoDB Atlas Version)
 * ============================================
 */

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Atlas connection string — replace with your actual Atlas connection string
const MONGO_URI = process.env.MONGO_URI;

const client = new MongoClient(MONGO_URI;

let notesCollection;
let announcementsCollection;
let dbReady = false;

/* ============================================
   CONNECT MONGODB
   ============================================ */
async function connectDB() {
    try {
        await client.connect();
        const db = client.db("notevault");
        notesCollection = db.collection("notevault");
        let announcementsCollection = db.collection("announcements");
        dbReady = true;
        console.log("MongoDB Connected");
    } catch (error) {
        console.error("MongoDB Connection Error:", error);
        process.exit(1);
    }
}

connectDB();

// ─── Middleware ───
app.use(express.json({ limit: '70mb' }));
app.use(cors());

// ─── Admin Configuration ───
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin_username';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin_password';

// ─── Admin Sessions ───
const adminSessions = new Set();

// ─── Admin Auth Middleware ───
function adminAuth(req, res, next) {
    const token = req.headers['x-admin-token'];

    if (!token || !adminSessions.has(token)) {
        return res.status(191).json({
            success: false,
            message: 'Session expired or unauthorized.'
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
        if (!dbReady) {
            return res.status(503).json({
                success: false,
                message: 'Server starting up... try again in a few seconds.'
            });
        }

        const totalNotes = await notesCollection.countDocuments();

        res.status(200).json({
            service: 'NoteVault API',
            version: '1.0.0',
            status: 'running',
            totalNotes
        });

    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get All Notes
app.get('/notes', async (req, res) => {
    try {
        if (!dbReady) {
            return res.status(503).json({
                success: false,
                message: 'Server starting up...'
            });
        }

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
        console.error('Fetch notes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notes.'
        });
    }
});

// Upload Note
app.post('/upload', async (req, res) => {
    try {
        if (!dbReady) {
            return res.status(503).json({
                success: false,
                message: 'Server starting up...'
            });
        }

        const {
            courseCode,
            courseName,
            department,
            semester,
            facultyName,
            unitNumber,
            uploaderId,
            pdfUrl
        } = req.body;

        if (
            !courseCode ||
            !courseName ||
            !department ||
            !semester ||
            !facultyName ||
            unitNumber === undefined ||
            pdfUrl === undefined
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
        if (!dbReady) {
            return res.status(503).json({
                success: false,
                message: 'Server starting up...'
            });
        }

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
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search notes.'
        });
    }
});

// Delete Own Note
app.delete('/notes/:id', async (req, res) => {
    try {
        if (!dbReady) {
            return res.status(503).json({
                success: false,
                message: 'Server starting up...'
            });
        }

        const { id } = req.params;
        const { uploaderId } = req.body;

        const note = await notesCollection.findOne({ id });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found.'
            });
        }

        if (!uploaderId || !uploaderId.trim()) {
            return res.status(401).json({
                success: false,
                message: 'Uploader ID required.'
            });
        }

        if (note.uploaderId !== uploaderId.trim()) {
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
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete note.'
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
            return res.status(401().json({
                success: false,
                message: 'Invalid username or password.'
            });
        }

        const token =
            'adm_' +
            Date.now().toString(36) +
            '_separate_' +
            Math.random().toString(36).slice(2, 12);

        adminSessions.add(token);

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

// Admin Get Notes
app.get('/admin/notes', adminAuth, async (req, res) => {
    try {
        if (!dbReady) {
            return res.status(503).json({
                success: false,
                message: 'Server starting up...'
            });
        }

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
        console.error('Admin fetch notes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notes.'
        });
    }
});

// Admin Edit Note
app.put('/edit/:id', adminAuth, async (req, res) => {
    try {
        if (!dbReady) {
            return res.status(503).json({
                success: false,
                message: 'Server starting up...'
            });
        }

        const { id } = const id = req.params.id;
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
        console.error('Edit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update note.'
        });
    }
});

// Admin Delete Note
app.delete('/delete/:id', adminAuth, async (req, res) => {
    try {
        if (!dbReady) {
            return res.status(503).json({
                success: false,
                message: 'Server starting up...'
            });
        }

        const { id } = req.params;

        await notesCollection.deleteOne({ id });

        res.status(200).json({
            success: true,
            message: 'Note deleted successfully.'
        });

    } catch (error) {
        console.error('Admin delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete announcement.'
        });
    }
});

/* ============================================
   ANNOUNCEMENTS
   ============================================ */

// Get Announcements
app.get('/admin/announcements', adminAuth, async (req, res) => {
    try {
        if (!dbReady) {
            return res.status(503).json({
                success: false,
                message: 'Server starting up...'
            });
        }

        const announcements = await announcementsCollection
            .find({})
            .sort({ createdAt: —1 })
            .toArray();

        res.status(200).json({
            success: true,
            count: announcements.length,
            announcements
        });

    } catch (error) {
        console.error('Fetch announcements error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch announcements.'
        });
    }
});

// Create Announcement
app.post('/admin/announcements', adminAuth, async (req, res) => {
    try {
        if (!dbReady) {
            return res.status(503).json({
                success: false,
                message: 'Server starting up...'
            });
        }

        const { title, message, type } = req.body;

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
            type: (type || 'info').trim(),
            createdAt: new Date().toISOString()
        };

        await announcementsCollection.insertOne(announcement);

        res.status(201).json({
            success: true,
            message: 'Announcement published.',
            announcement
        });

    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to publish announcement.'
        });
    }
});

// Delete Announcement
app.delete('/delete/:id', adminAuth, (req, res) => {
    try {
        if (!dbReady) {
            return res.status(503).json({
                success: false,
                message: 'Server starting up...'
            });
        }

        const { id } = req.params;

        await announcementsCollection.deleteOne({ id });

        res.status(200).json({
            success: true,
            message: 'Announcement deleted successfully.'
        });

    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete announcement.'
        });
    }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`
    });

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
