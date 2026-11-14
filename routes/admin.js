const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('../database');
const router = express.Router();

// ---------- password helpers ----------
function makeHash(text) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(text), salt, 64).toString('hex');
  return salt + ':' + hash;
}
function matches(text, saved) {
  const parts = String(saved).split(':');
  return crypto.scryptSync(String(text), parts[0], 64).toString('hex') === parts[1];
}
function clean(text) {               // answers are not case sensitive
  return String(text || '').trim().toLowerCase();
}

// ---------- admin table (created on first run) ----------
db.exec(`CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  question TEXT NOT NULL,
  answer_hash TEXT NOT NULL
)`);

if (db.prepare('SELECT COUNT(*) c FROM admin_users').get().c === 0) {
  db.prepare('INSERT INTO admin_users (username, password_hash, question, answer_hash) VALUES (?,?,?,?)')
    .run('niteesh', makeHash('niteesh123'), 'Which Indian destination is your favourite?', makeHash('goa'));
}

// ---------- stop guessing: 5 wrong tries per person, reset every 15 minutes ----------
const wrongTries = {};
setInterval(() => { for (const ip in wrongTries) delete wrongTries[ip]; }, 15 * 60 * 1000).unref();
const blocked = ip => (wrongTries[ip] || 0) >= 5;
const addWrong = ip => { wrongTries[ip] = (wrongTries[ip] || 0) + 1; };
const BLOCK_MSG = { error: 'Too many wrong attempts. Try again in 15 minutes.' };

// ---------- middleware ----------
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: 'Please log in as admin' });
}

router.use((req, res, next) => {
  if (!req.session) return res.status(500).json({ error: 'Server setup missing: add express-session in server.js' });
  if (!req.body) req.body = {};
  next();
});

// ---------- login / logout ----------
router.post('/login', (req, res) => {
  if (blocked(req.ip)) return res.status(429).json(BLOCK_MSG);

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(String(req.body.username || '').trim());
  if (user && matches(req.body.password, user.password_hash)) {
    delete wrongTries[req.ip];
    req.session.admin = true;
    req.session.userId = user.id;
    return res.json({ success: true });
  }
  addWrong(req.ip);
  res.status(401).json({ error: 'Invalid username or password' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

router.get('/check', (req, res) => {
  res.json({ loggedIn: !!req.session.admin });
});

router.get('/me', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT username, question FROM admin_users WHERE id = ?').get(req.session.userId);
  if (!user) return res.status(404).json({ error: 'Admin not found' });
  res.json(user);
});

// ---------- change password (when logged in) ----------
router.post('/change-password', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.session.userId);
  const newPassword = String(req.body.newPassword || '');

  if (!user || !matches(req.body.currentPassword, user.password_hash))
    return res.status(400).json({ error: 'Current password is incorrect' });
  if (newPassword.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  if (newPassword === req.body.currentPassword)
    return res.status(400).json({ error: 'New password must be different from the current one' });

  db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(makeHash(newPassword), user.id);
  res.json({ success: true });
});

// ---------- change recovery question (when logged in) ----------
router.post('/security', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.session.userId);
  const question = String(req.body.question || '').trim();
  const answer = clean(req.body.answer);

  if (!user || !matches(req.body.currentPassword, user.password_hash))
    return res.status(400).json({ error: 'Current password is incorrect' });
  if (!question || answer.length < 2)
    return res.status(400).json({ error: 'Enter a question and an answer (at least 2 characters)' });

  db.prepare('UPDATE admin_users SET question = ?, answer_hash = ? WHERE id = ?').run(question, makeHash(answer), user.id);
  res.json({ success: true });
});

// ---------- forgot password (not logged in) ----------
router.post('/forgot/question', (req, res) => {
  const user = db.prepare('SELECT question FROM admin_users WHERE username = ?').get(String(req.body.username || '').trim());
  if (!user) return res.status(404).json({ error: 'No admin account with that username' });
  res.json({ question: user.question });
});

router.post('/forgot/reset', (req, res) => {
  if (blocked(req.ip)) return res.status(429).json(BLOCK_MSG);

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(String(req.body.username || '').trim());
  const newPassword = String(req.body.newPassword || '');

  if (!user || !matches(clean(req.body.answer), user.answer_hash)) {
    addWrong(req.ip);
    return res.status(400).json({ error: 'That answer is not correct' });
  }
  if (newPassword.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters' });

  db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(makeHash(newPassword), user.id);
  delete wrongTries[req.ip];
  res.json({ success: true });
});

// ---------- photo upload (browser sends a resized JPEG as text) ----------
router.post('/upload', requireAdmin, (req, res) => {
  const start = 'data:image/jpeg;base64,';
  const data = String(req.body.data || '');
  if (!data.startsWith(start)) return res.status(400).json({ error: 'Please choose a valid image (JPG or PNG)' });

  const file = Buffer.from(data.slice(start.length), 'base64');
  if (file.length > 4 * 1024 * 1024) return res.status(400).json({ error: 'Image is too large (max 4 MB)' });
  if (file[0] !== 0xFF || file[1] !== 0xD8) return res.status(400).json({ error: 'That file is not a valid image' });

  const folder = path.join(__dirname, '..', 'public', 'images', 'uploads');
  fs.mkdirSync(folder, { recursive: true });

  const name = 'package-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex') + '.jpg';
  fs.writeFileSync(path.join(folder, name), file);
  res.json({ path: 'images/uploads/' + name });
});

// ---------- packages ----------
function packageError(b) {            // returns an error text, or '' if all good
  if (!b.name || !b.name.trim() || !b.destination || !b.destination.trim()) return 'Name and destination are required';
  if (!(parseInt(b.days) > 0) || !(parseInt(b.price) > 0)) return 'Days and price must be positive numbers';
  return '';
}
function packageValues(b) {
  const days = parseInt(b.days);
  let image = String(b.image || '').trim();
  if (!image.startsWith('images/') || image.includes('..')) image = 'images/taj-mahal.jpg';
  return [b.name.trim(), b.destination.trim(), (b.state || '').trim(), b.category || 'Nature',
          days, days - 1, parseInt(b.price), (b.description || '').trim(), (b.highlights || '').trim(),
          image, b.featured ? 1 : 0];
}

router.post('/packages', requireAdmin, (req, res) => {
  const error = packageError(req.body);
  if (error) return res.status(400).json({ error });

  const result = db.prepare(`INSERT INTO tour_packages
    (name, destination, state, category, days, nights, price, description, highlights, image, featured)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(...packageValues(req.body));
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/packages/:id', requireAdmin, (req, res) => {
  const error = packageError(req.body);
  if (error) return res.status(400).json({ error });

  const result = db.prepare(`UPDATE tour_packages SET name=?, destination=?, state=?, category=?, days=?, nights=?,
    price=?, description=?, highlights=?, image=?, featured=? WHERE id=?`).run(...packageValues(req.body), req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Package not found' });
  res.json({ success: true });
});

router.delete('/packages/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM tour_packages WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Package not found' });
  res.json({ success: true });
});

// ---------- dashboard numbers + enquiries ----------
router.get('/stats', requireAdmin, (req, res) => {
  const p = db.prepare('SELECT COUNT(*) total, COALESCE(AVG(price),0) avg, SUM(featured) featured FROM tour_packages').get();
  let bookings = 0;
  try { bookings = db.prepare('SELECT COUNT(*) c FROM bookings').get().c; } catch (e) { }   // bookings table may not exist yet
  res.json({ total: p.total, avgPrice: Math.round(p.avg), featured: p.featured || 0, bookings: bookings });
});

router.get('/bookings', requireAdmin, (req, res) => {
  try { res.json(db.prepare('SELECT * FROM bookings ORDER BY id DESC').all()); }
  catch (e) { res.json([]); }
});

module.exports = router;
