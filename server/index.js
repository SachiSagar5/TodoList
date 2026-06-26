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

/* ── AI text generation ──
     Uses Ollama (free local AI) if available.
     Falls back to Hugging Face free inference API.
*/

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

async function generateWithOllama(prompt) {
  const model = process.env.AI_MODEL || 'llama3.2';

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt: `Write a detailed note about: ${prompt}`,
      stream: false,
      options: { temperature: 0.7, num_predict: 300 },
    }),
  });

  if (!response.ok) throw new Error(`Ollama: ${response.status}`);
  const data = await response.json();
  const text = (data.response || '').trim();
  if (!text) throw new Error('Ollama returned empty response');
  return text;
}

const HF_API = 'https://api-inference.huggingface.co/models';

async function generateWithHuggingFace(prompt) {
  const model = 'google/flan-t5-base';
  const apiKey = process.env.HUGGINGFACE_API_KEY || '';
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const response = await fetch(`${HF_API}/${model}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      inputs: `Write a note about: ${prompt}`,
      parameters: { max_new_tokens: 200, temperature: 0.7 },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'unknown error');
    throw new Error(`Hugging Face API error (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const generated = (data[0]?.generated_text || '').trim();
  if (!generated) throw new Error('No text generated by model');
  return generated;
}

app.post('/api/ai/generate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  let lastError = '';

  // Try Hugging Face API first (zero setup - works with just internet)
  try {
    const text = await generateWithHuggingFace(prompt);
    return res.json({ text });
  } catch (err) {
    lastError = err.message;
  }

  // Fallback to Ollama (free local AI, needs install)
  try {
    const text = await generateWithOllama(prompt);
    return res.json({ text });
  } catch (err) {
    lastError = err.message;
  }

  console.error('AI generation failed:', lastError);
  res.status(503).json({
    error: 'AI generation unavailable',
    detail: `Last error: ${lastError}. Make sure you have internet access for the free Hugging Face API (no API key needed). Or install Ollama (brew install ollama && ollama pull llama3.2) for offline AI.`,
  });
});

app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'TaskMaster API server running' });
});

app.listen(PORT, () => {
  console.log(`TaskMaster server running on http://localhost:${PORT}`);
});
