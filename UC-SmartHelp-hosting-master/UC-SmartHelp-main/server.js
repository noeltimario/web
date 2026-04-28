const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(express.json({ limit: '10mb' }));

// FIX: Trusts all your Vercel deployment URLs to prevent CORS blocks
app.use(cors({
  origin: [
    "https://uc-smart-help-hosting.vercel.app", 
    "https://uc-smart-help-hosting-git-master-noeltimarios-projects.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true
}));

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 27244,
  ssl: { rejectUnauthorized: false } // REQUIRED for Aiven
});

// --- AUTHENTICATION ---

app.post('/api/google-auth', async (req, res) => {
  const { email, firstName, lastName, profileImage } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ? OR gmail_account = ?', [email, email]);
    let user = rows[0];

    if (!user) {
      const [result] = await db.query(
        'INSERT INTO users (first_name, last_name, username, role, image, gmail_account) VALUES (?, ?, ?, ?, ?, ?)',
        [firstName, lastName, email, 'student', profileImage || null, email]
      );
      user = { id: result.insertId, first_name: firstName, last_name: lastName, username: email, role: 'student' };
    }
    res.json({ id: user.id, role: user.role, firstName: user.first_name, lastName: user.last_name, username: user.username });
  } catch (error) {
    res.status(500).json({ error: "Google Auth failed", details: error.message });
  }
});

app.post('/api/register', async (req, res) => {
  const { firstName, lastName, username, password, email } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (first_name, last_name, username, password, role, gmail_account) VALUES (?, ?, ?, ?, ?, ?)',
      [firstName, lastName, username, hashedPassword, 'student', email]
    );
    res.status(201).json({ message: "User registered", id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: "Registration failed", details: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (user && user.password && await bcrypt.compare(password, user.password)) {
      res.json({ id: user.id, role: user.role, firstName: user.first_name, lastName: user.last_name });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Backend live on port ${PORT}`));
