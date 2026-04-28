const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

// FIX: CORS must include your specific Vercel deployment URLs
app.use(cors({
  origin: [
    "https://uc-smart-help-hosting.vercel.app", 
    "https://uc-smart-help-hosting-git-master-noeltimarios-projects.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true
}));

// MySQL connection pool using Environment Variables
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 27244,
  ssl: { rejectUnauthorized: false } // Required for Aiven/Railway
});

// Database Initialization (Auto-run migrations)
const initializeDatabase = async () => {
  try {
    const connection = await db.getConnection();
    console.log("🗄️ Database connected successfully");
    
    // Ensure is_disabled column exists
    const [userColumns] = await connection.query("SHOW COLUMNS FROM users");
    const userColumnNames = userColumns.map((c) => c.Field);
    if (!userColumnNames.includes('is_disabled')) {
      await connection.query("ALTER TABLE users ADD COLUMN is_disabled TINYINT(1) DEFAULT 0");
    }

    // Ensure website_feedback table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS website_feedback (
        web_feedback_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        is_helpful BOOLEAN NOT NULL,
        comment TEXT,
        date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    connection.release();
  } catch (err) {
    console.error("❌ DB Init Error:", err.message);
  }
};

initializeDatabase();

// --- AUTHENTICATION ROUTES ---

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
      userId: user.id || user.user_id, 
      role: user.role, 
      firstName: user.first_name, 
      lastName: user.last_name, 
      username: user.username,
      image: user.image || profileImage
    });
  } catch (error) {
    res.status(500).json({ error: "Google Auth error", details: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    
    if (user && user.password && await bcrypt.compare(password, user.password)) {
      res.json({
        id: user.id || user.user_id,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// --- TICKET & FEEDBACK ROUTES ---

app.post('/api/tickets', async (req, res) => {
  const { subject, description, department, sender_id } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO tickets (subject, description, department, user_id, status) VALUES (?, ?, ?, ?, ?)',
      [subject, description, department, sender_id, 'pending']
    );
    res.status(201).json({ ticketId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

app.post('/api/website-feedback', async (req, res) => {
  const { user_id, is_helpful, comment } = req.body;
  try {
    await db.query(
      'INSERT INTO website_feedback (user_id, is_helpful, comment) VALUES (?, ?, ?)',
      [user_id || null, is_helpful, comment || null]
    );
    res.status(201).json({ message: "Feedback saved" });
  } catch (error) {
    res.status(500).json({ error: "Feedback failed" });
  }
});

// FIX: CRITICAL - Render dynamic port binding for production
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 UC SmartHelp Backend live on port ${PORT}`);
});
