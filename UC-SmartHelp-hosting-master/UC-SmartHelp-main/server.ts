import express, { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

// FIX: Allow your Vercel URL to connect to this backend
app.use(cors({
  origin: ["https://uc-smart-help-hosting.vercel.app", "http://localhost:5173"],
  credentials: true
}));

// FIX: Use Environment Variables for the live database
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  ssl: { rejectUnauthorized: false } 
});

// ... (Keep your existing routes: /api/login, /api/register, etc.)

// FIX: This must be at the very bottom of server.ts
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is live on port ${PORT}`);
});
