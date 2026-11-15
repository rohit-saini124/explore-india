const express = require('express');
const db = require('../database');
const router = express.Router();

const ADMIN_USER = process.env.ADMIN_USER || 'niteesh';
const ADMIN_PASS = process.env.ADMIN_PASS || 'niteesh123';

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: 'Please log in as admin' });
}

function clean(b) {
  const days = parseInt(b.days), price = parseInt(b.price);
  if (!b.name?.trim() || !b.destination?.trim()) return { error: 'Name and destination are required' };
  if (!(days > 0) || !(price > 0)) return { error: 'Days and price must be positive numbers' };
  return { v: [b.name.trim(), b.destination.trim(), (b.state || '').trim(), b.category || 'Nature',
    days, days - 1, price, (b.description || '').trim(), (b.highlights || '').trim(),
    (b.image || '').trim() || 'images/taj-mahal.jpg', b.featured ? 1 : 0] };
}

// Clear message if server.js is missing the session / JSON setup
router.use((req, res, next) => {
  if (!req.session) return res.status(500).json({ error: 'Server setup missing: add express-session in server.js (see server.snippet.js) and restart.' });
  if (req.body === undefined) req.body = {};
  next();
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.admin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid username or password' });
});

router.post('/logout', (req, res) => req.session.destroy(() => res.json({ success: true })));
router.get('/check', (req, res) => res.json({ loggedIn: !!(req.session && req.session.admin) }));

router.get('/stats', requireAdmin, (req, res) => {
  const p = db.prepare('SELECT COUNT(*) total, COALESCE(AVG(price),0) avg, SUM(featured) featured FROM tour_packages').get();
  let bookings = 0;
  try { bookings = db.prepare('SELECT COUNT(*) c FROM bookings').get().c; } catch (e) {}
  res.json({ total: p.total, avgPrice: Math.round(p.avg), featured: p.featured || 0, bookings });
});

router.post('/packages', requireAdmin, (req, res) => {
  const c = clean(req.body); if (c.error) return res.status(400).json({ error: c.error });
  const r = db.prepare(`INSERT INTO tour_packages
    (name,destination,state,category,days,nights,price,description,highlights,image,featured)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(...c.v);
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put('/packages/:id', requireAdmin, (req, res) => {
  const c = clean(req.body); if (c.error) return res.status(400).json({ error: c.error });
  const r = db.prepare(`UPDATE tour_packages SET name=?,destination=?,state=?,category=?,days=?,nights=?,
    price=?,description=?,highlights=?,image=?,featured=? WHERE id=?`).run(...c.v, req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Package not found' });
  res.json({ success: true });
});

router.delete('/packages/:id', requireAdmin, (req, res) => {
  const r = db.prepare('DELETE FROM tour_packages WHERE id = ?').run(req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Package not found' });
  res.json({ success: true });
});

// Enquiries submitted by teammate's booking module
router.get('/bookings', requireAdmin, (req, res) => {
  try { res.json(db.prepare('SELECT * FROM bookings ORDER BY id DESC').all()); }
  catch (e) { res.json([]); }
});

module.exports = router;