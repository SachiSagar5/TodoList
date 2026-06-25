import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'db.json');
const PORT = process.env.PORT || 3001;

function readDB() {
  try {
    return JSON.parse(readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return { users: [], sessions: [], todos: [], events: [], notes: [] };
  }
}

function writeDB(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

const app = express();
app.use(cors());
app.use(express.json());

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  const db = readDB();
  const session = db.sessions.find(s => s.token === token);
  if (!session) return res.status(401).json({ error: 'Invalid token' });
  req.userUid = session.uid;
  req.db = db;
  next();
}

/* ── Auth ── */

app.post('/api/auth/signup', (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const db = readDB();
  if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ code: 'auth/email-already-in-use' });
  }
  if (password.length < 6) {
    return res.status(400).json({ code: 'auth/weak-password' });
  }
  const uid = randomUUID();
  const user = { uid, email, displayName, password, createdAt: Date.now() };
  db.users.push(user);
  const token = randomUUID();
  db.sessions.push({ uid, token });
  writeDB(db);
  res.json({ token, user: { uid, email, displayName, photoURL: null } });
});

app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ code: 'auth/user-not-found' });
  if (user.password !== password) return res.status(401).json({ code: 'auth/wrong-password' });
  const token = randomUUID();
  db.sessions.push({ uid: user.uid, token });
  writeDB(db);
  res.json({ token, user: { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: null } });
});

app.post('/api/auth/signout', authMiddleware, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  req.db.sessions = req.db.sessions.filter(s => s.token !== token);
  writeDB(req.db);
  res.json({ ok: true });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = req.db.users.find(u => u.uid === req.userUid);
  if (!user) return res.status(401).json({ error: 'User not found' });
  res.json({ user: { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: null } });
});

/* ── Data CRUD ── */

app.get('/api/data/:collection', authMiddleware, (req, res) => {
  const { collection } = req.params;
  if (!['todos', 'events', 'notes'].includes(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }
  const items = req.db[collection].filter(item => item.uid === req.userUid);
  const sorted = [...items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json(sorted);
});

app.post('/api/data/:collection', authMiddleware, (req, res) => {
  const { collection } = req.params;
  if (!['todos', 'events', 'notes'].includes(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }
  const item = { ...req.body, uid: req.userUid };
  const existing = req.db[collection].find(i => i.id === item.id && i.uid === req.userUid);
  if (existing) {
    req.db[collection] = req.db[collection].map(i =>
      i.id === item.id && i.uid === req.userUid ? item : i
    );
  } else {
    req.db[collection].push(item);
  }
  writeDB(req.db);
  res.json(item);
});

app.delete('/api/data/:collection/:id', authMiddleware, (req, res) => {
  const { collection, id } = req.params;
  if (!['todos', 'events', 'notes'].includes(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }
  req.db[collection] = req.db[collection].filter(
    i => !(i.id === id && i.uid === req.userUid)
  );
  writeDB(req.db);
  res.json({ ok: true });
});

app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'TaskMaster API server running' });
});

app.listen(PORT, () => {
  console.log(`TaskMaster server running on http://localhost:${PORT}`);
});
