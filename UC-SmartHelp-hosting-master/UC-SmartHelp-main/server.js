const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(express.json({ limit: '10mb' }));

app.use(cors({
  origin: [
    "https://uc-smart-help-hosting.vercel.app", 
    "https://uc-smart-help-hosting-3qfoa2c9k-noeltimarios-projects.vercel.app",
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
  ssl: { rejectUnauthorized: false }
});

// FIX: This route handles the handshake from auth.tsx
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

    res.json({ 
      id: user.id || user.user_id, 
      role: user.role, 
      firstName: user.first_name, 
      lastName: user.last_name, 
      username: user.username 
    });
  } catch (error) {
    res.status(500).json({ error: "Google Auth error", details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Backend live on port ${PORT}`));
