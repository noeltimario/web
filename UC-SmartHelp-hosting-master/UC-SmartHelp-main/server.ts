import express, { Request, Response } from 'express';
import mysql, { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcrypt';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

// FIX: Added your specific deployment URL to prevent CORS blocks
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
  port: Number(process.env.DB_PORT) || 3306,
  ssl: { rejectUnauthorized: false }
});

const formatUserResponse = (user: any) => {
  const id = user.id ?? user.user_id;
  return {
    id,
    userId: id,
    role: user.role || 'student',
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username || user.email,
    gmail_account: user.gmail_account || user.email || null
  };
};

// --- NEW: GOOGLE AUTH ROUTE (Fixes the 500 error) ---
app.post('/api/google-auth', async (req: Request, res: Response) => {
  const { email, firstName, lastName, photoURL } = req.body;
  
  try {
    // 1. Check if user already exists
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE gmail_account = ? OR username = ?', 
      [email, email]
    );

    if (rows.length > 0) {
      // User exists, log them in
      return res.json(formatUserResponse(rows[0]));
    }

    // 2. New user? Register them automatically
    const [userCount] = await db.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM users');
    const role = (userCount[0] as any).count === 0 ? 'admin' : 'student';

    const [result] = await db.query(
      'INSERT INTO users (first_name, last_name, username, role, gmail_account) VALUES (?, ?, ?, ?, ?)',
      [firstName, lastName, email, role, email]
    );

    const newId = (result as any).insertId;
    res.status(201).json({
      id: newId,
      userId: newId,
      role,
      firstName,
      lastName,
      username: email,
      gmail_account: email
    });
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ error: "Failed to process Google authentication" });
  }
});

// --- EXISTING AUTH ROUTES ---

app.post('/api/register', async (req: Request, res: Response) => {
  const { firstName, lastName, username, password, gmailAccount } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userCount] = await db.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM users');
    const role = (userCount[0] as any).count === 0 ? 'admin' : 'student';

    await db.query(
      'INSERT INTO users (first_name, last_name, username, password, role, gmail_account) VALUES (?, ?, ?, ?, ?, ?)',
      [firstName, lastName, username.toLowerCase(), hashedPassword, role, gmailAccount]
    );
    res.status(201).json({ message: "User registered" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE username = ?', [username.toLowerCase()]);
    const user = rows[0];

    if (user && user.password && await bcrypt.compare(password, user.password)) {
      res.json(formatUserResponse(user));
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.post('/api/chat-history', async (req: Request, res: Response) => {
  const { user_id, message, sender_type } = req.body;
  try {
    await db.execute(
      'INSERT INTO chat_history (user_id, message, sender_type) VALUES (?, ?, ?)',
      [user_id, message, sender_type || 'user']
    );
    res.status(201).json({ message: "Saved" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 UC SmartHelp Backend live on port ${PORT}`);
});
