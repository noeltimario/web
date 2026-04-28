import express, { Request, Response } from 'express';
import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import bcrypt from 'bcrypt';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

// FIX: CORS must include your Vercel deployment URL
app.use(cors({
  origin: ["https://uc-smart-help-hosting.vercel.app", "http://localhost:5173"],
  credentials: true
}));

// FIX: Connect using Environment Variables for production
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  ssl: { rejectUnauthorized: false } // Required for cloud providers like Aiven/Railway
});

// Helper for formatting user responses consistently
const formatUserResponse = (user: any) => {
  const id = user.id ?? user.user_id;
  return {
    id,
    userId: id,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username,
    gmail_account: user.gmail_account || null
  };
};

// --- AUTH ROUTES ---

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

    if (user && await bcrypt.compare(password, user.password)) {
      res.json(formatUserResponse(user));
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Login failed" });
  }
});

// --- CHAT HISTORY ---

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

// FIX: CRITICAL - Render dynamic port binding
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 UC SmartHelp Backend live on port ${PORT}`);
});
