const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('notes.db');

const app = express();
app.use(express.json());

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// User registration
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hashedPassword], function(err) {
            if (err) {
                return res.status(500).send("Error registering user.");
            }
            res.sendStatus(201);
        });
    } catch {
        res.status(500).send();
    }
});

// User login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err) {
                return res.status(500).send("Server error.");
            }
            if (!user) {
                return res.status(404).send("User not found.");
            }
            if (await bcrypt.compare(password, user.password_hash)) {
                const accessToken = jwt.sign({ username: user.username }, process.env.ACCESS_TOKEN_SECRET);
                res.json({ accessToken: accessToken });
            } else {
                res.status(401).send("Invalid password.");
            }
        });
    } catch {
        res.status(500).send();
    }
});

// CRUD operations for notes (simplified examples)
// Create a new note
app.post('/notes', authenticateToken, (req, res) => {
    const { title, content, color, tags } = req.body;
    const userId = req.user.id; // Assuming you have userId available after authentication
    db.run('INSERT INTO notes (title, content, color, userId) VALUES (?, ?, ?, ?)', [title, content, color, userId], function(err) {
        if (err) {
            return res.status(500).send("Error creating note.");
        }
        const noteId = this.lastID;
        // Insert tags
        if (tags && tags.length > 0) {
            tags.forEach(tag => {
                db.run('INSERT INTO tags (name, noteId) VALUES (?, ?)', [tag, noteId], function(err) {
                    if (err) {
                        console.error("Error inserting tag:", err);
                    }
                });
            });
        }
        res.status(201).json({ id: noteId });
    });
});

// Retrieve all notes for a user
app.get('/notes', authenticateToken, (req, res) => {
    const userId = req.user.id;
    db.all('SELECT * FROM notes WHERE userId = ? AND trashed = 0 ORDER BY createdAt DESC', [userId], (err, rows) => {
        if (err) {
            return res.status(500).send("Error retrieving notes.");
        }
        res.json(rows);
    });
});

// Other CRUD endpoints for notes, tags, and special views (archived notes, notes by tag, etc.)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
