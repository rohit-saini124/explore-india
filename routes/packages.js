const express = require('express');
const db = require('../database');
const router = express.Router();

// GET /api/packages?category=&search=&sort=
router.get('/', (req, res) => {
  const { category, search, sort } = req.query;
  let sql = 'SELECT * FROM tour_packages WHERE 1=1';
  const params = [];
  if (category && category !== 'All') { sql += ' AND category = ?'; params.push(category); }
  if (search) {
    sql += ' AND (name LIKE ? OR destination LIKE ? OR state LIKE ?)';
    const q = `%${search}%`; params.push(q, q, q);
  }
  const order = { low: 'price ASC', high: 'price DESC', days: 'days ASC' }[sort] || 'featured DESC, id ASC';
  sql += ' ORDER BY ' + order;
  res.json(db.prepare(sql).all(...params));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM tour_packages WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Package not found' });
  res.json(row);
});

module.exports = router;