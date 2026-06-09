import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Cloud save directory
const SAVE_DIR = path.join(process.cwd(), 'cloud_saves');
if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR, { recursive: true });

app.use(express.json());

// Cloud save: save progress
app.post('/api/cloud/save', (req, res) => {
  try {
    const { userId, data } = req.body;
    if (!userId || !data) return res.status(400).json({ error: 'Missing userId or data' });
    const file = path.join(SAVE_DIR, `${userId}.json`);
    fs.writeFileSync(file, JSON.stringify({ ...data, savedAt: new Date().toISOString() }, null, 2));
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Cloud save: load progress
app.get('/api/cloud/load', (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const file = path.join(SAVE_DIR, `${userId}.json`);
    if (!fs.existsSync(file)) return res.json({ exists: false });
    const raw = fs.readFileSync(file, 'utf-8');
    res.json({ exists: true, ...JSON.parse(raw) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Cloud save: delete progress
app.delete('/api/cloud/delete', (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const file = path.join(SAVE_DIR, `${userId}.json`);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Cosmic Server] Astro Kendama engine running on http://localhost:${PORT}`);
  });
}

startServer();
