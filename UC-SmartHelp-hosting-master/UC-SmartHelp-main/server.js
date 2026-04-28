const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: [
    "https://uc-smart-help-hosting.vercel.app", 
    "https://uc-smart-help-hosting-3qfoa2c9k-noeltimarios-projects.vercel.app",
    "https://uc-smart-help-hosting-n62l6xaly-noeltimarios-projects.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true
}));

// DATABASE CONNECTION POOL
const db = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: {
    // Kani nga part importante para sa Aiven
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, 
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test Database Connection
db.getConnection()
  .then(connection => {
    console.log('✅ Connected to Aiven MySQL Database!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

// ROUTES
app.post('/api/google-auth', async (req, res) => {
  const { email, firstName, lastName, profileImage } = req.body;
  try {
    // Check if user exists
    const [rows] = await db.query('SELECT * FROM users WHERE username = ? OR gmail_account = ?', [email, email]);
    let user = rows[0];

    if (!user) {
      // Register new user if not found
      const [result] = await db.query(
        'INSERT INTO users (first_name, last_name, username, role, image, gmail_account) VALUES (?, ?, ?, ?, ?, ?)',
        [firstName, lastName, email, 'student', profileImage || null, email]
      );
      
      const [newUser] = await db.query('SELECT * FROM users WHERE id = ? OR user_id = ?', [result.insertId, result.insertId]);
      user = newUser[0];
    }

    res.json({ 
      id: user.id || user.user_id, 
      role: user.role, 
      firstName: user.first_name, 
      lastName: user.last_name, 
      username: user.username 
    });
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(500).json({ error: "Google Auth error", details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Backend live on port ${PORT}`));
