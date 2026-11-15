
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

function clean(text) {
  return String(text || '').trim().toLowerCase();
}

// ---------- create default admin if none exists ----------
async function createAdmin() {
  try {
    const result = await db.query('SELECT COUNT(*) AS c FROM admins');

    if (Number(result.rows[0].c) === 0) {
      await db.query(
        `INSERT INTO admins (username, password_hash, question, answer_hash)
         VALUES ($1, $2, $3, $4)`,
        [
          'niteesh',
          makeHash('niteesh123'),
          'Which Indian destination is your favourite?',
          makeHash('goa')
        ]
      );
    }
  } catch (error) {
    console.log('Error creating admin:', error);
  }
}

createAdmin();

// ---------- stop guessing: 5 wrong tries per person ----------
const wrongTries = {};

setInterval(() => {
  for (const ip in wrongTries) delete wrongTries[ip];
}, 15 * 60 * 1000).unref();

const blocked = ip => (wrongTries[ip] || 0) >= 5;
const addWrong = ip => {
  wrongTries[ip] = (wrongTries[ip] || 0) + 1;
};

const BLOCK_MSG = {
  error: 'Too many wrong attempts. Try again in 15 minutes.'
};

// ---------- middleware ----------
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: 'Please log in as admin' });
}

router.use((req, res, next) => {
  if (!req.session) {
    return res.status(500).json({
      error: 'Server setup missing: add express-session in server.js'
    });
  }

  if (!req.body) req.body = {};
  next();
});

// ---------- login / logout ----------
router.post('/login', async (req, res) => {
  try {
    if (blocked(req.ip)) return res.status(429).json(BLOCK_MSG);

    const result = await db.query(
      'SELECT * FROM admins WHERE username = $1',
      [String(req.body.username || '').trim()]
    );

    const user = result.rows[0];

    if (user && matches(req.body.password, user.password_hash)) {
      delete wrongTries[req.ip];

      req.session.admin = true;
      req.session.userId = user.id;

      return res.json({ success: true });
    }

    addWrong(req.ip);
    res.status(401).json({ error: 'Invalid username or password' });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

router.get('/check', (req, res) => {
  res.json({ loggedIn: !!req.session.admin });
});

router.get('/me', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT username, question FROM admins WHERE id = $1',
      [req.session.userId]
    );

    const user = result.rows[0];

    if (!user) return res.status(404).json({ error: 'Admin not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Could not get admin details' });
  }
});

// ---------- change password ----------
router.post('/change-password', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM admins WHERE id = $1',
      [req.session.userId]
    );

    const user = result.rows[0];
    const newPassword = String(req.body.newPassword || '');

    if (!user || !matches(req.body.currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    if (newPassword === req.body.currentPassword) {
      return res.status(400).json({ error: 'New password must be different from the current one' });
    }

    await db.query(
      'UPDATE admins SET password_hash = $1 WHERE id = $2',
      [makeHash(newPassword), user.id]
    );

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ error: 'Could not change password' });
  }
});

// ---------- change recovery question ----------
router.post('/security', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM admins WHERE id = $1',
      [req.session.userId]
    );

    const user = result.rows[0];
    const question = String(req.body.question || '').trim();
    const answer = clean(req.body.answer);

    if (!user || !matches(req.body.currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    if (!question || answer.length < 2) {
      return res.status(400).json({
        error: 'Enter a question and an answer (at least 2 characters)'
      });
    }

    await db.query(
      'UPDATE admins SET question = $1, answer_hash = $2 WHERE id = $3',
      [question, makeHash(answer), user.id]
    );

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ error: 'Could not update security question' });
  }
});

// ---------- forgot password ----------
router.post('/forgot/question', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT question FROM admins WHERE username = $1',
      [String(req.body.username || '').trim()]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        error: 'No admin account with that username'
      });
    }

    res.json({ question: user.question });

  } catch (error) {
    res.status(500).json({ error: 'Could not get security question' });
  }
});

router.post('/forgot/reset', async (req, res) => {
  try {
    if (blocked(req.ip)) return res.status(429).json(BLOCK_MSG);

    const result = await db.query(
      'SELECT * FROM admins WHERE username = $1',
      [String(req.body.username || '').trim()]
    );

    const user = result.rows[0];
    const newPassword = String(req.body.newPassword || '');

    if (!user || !matches(clean(req.body.answer), user.answer_hash)) {
      addWrong(req.ip);
      return res.status(400).json({ error: 'That answer is not correct' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters'
      });
    }

    await db.query(
      'UPDATE admins SET password_hash = $1 WHERE id = $2',
      [makeHash(newPassword), user.id]
    );

    delete wrongTries[req.ip];
    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ error: 'Could not reset password' });
  }
});

// ---------- photo upload ----------
router.post('/upload', requireAdmin, (req, res) => {
  const start = 'data:image/jpeg;base64,';
  const data = String(req.body.data || '');

  if (!data.startsWith(start)) {
    return res.status(400).json({
      error: 'Please choose a valid image (JPG or PNG)'
    });
  }

  const file = Buffer.from(data.slice(start.length), 'base64');

  if (file.length > 4 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image is too large (max 4 MB)' });
  }

  if (file.length < 2 || file[0] !== 0xFF || file[1] !== 0xD8) {
    return res.status(400).json({ error: 'That file is not a valid image' });
  }

  const folder = path.join(__dirname, '..', 'public', 'images');
  fs.mkdirSync(folder, { recursive: true });

  const name = 'package-' + Date.now() + '-' +
    crypto.randomBytes(3).toString('hex') + '.jpg';

  fs.writeFileSync(path.join(folder, name), file);

  res.json({ path: 'images/' + name });
});

// ---------- packages ----------
function packageError(b) {
  if (!b.name || !b.name.trim() || !b.destination || !b.destination.trim()) {
    return 'Name and destination are required';
  }

  if (!(parseInt(b.days) > 0) || !(parseInt(b.price) > 0)) {
    return 'Days and price must be positive numbers';
  }

  return '';
}

async function packageValues(b) {
  const destination = await db.query(
    'SELECT id FROM destinations WHERE LOWER(name) = LOWER($1)',
    [b.destination.trim()]
  );

  if (destination.rows.length === 0) return null;

  const days = parseInt(b.days);
  const nights = days - 1;

  let image = String(b.image || '').trim();

  if (!image.startsWith('images/') || image.includes('..')) {
    image = 'images/taj-mahal.jpg';
  }

  const featured = b.featured === true ||
                   b.featured === 'true' ||
                   b.featured === 1;

  return [
    b.name.trim(),
    destination.rows[0].id,
    b.category || 'Nature',
    days,
    nights,
    parseInt(b.price),
    (b.description || '').trim(),
    (b.highlights || '').trim(),
    image,
    featured,
    days + ' Days / ' + nights + ' Nights'
  ];
}

router.post('/packages', requireAdmin, async (req, res) => {
  try {
    const error = packageError(req.body);
    if (error) return res.status(400).json({ error });

    const values = await packageValues(req.body);

    if (!values) {
      return res.status(400).json({ error: 'Destination not found' });
    }

    const result = await db.query(
      `INSERT INTO packages
       (title, destination_id, category, days, nights, price,
        description, highlights, image, featured, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      values
    );

    res.status(201).json({ id: result.rows[0].id });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Could not add package' });
  }
});

router.put('/packages/:id', requireAdmin, async (req, res) => {
  try {
    const error = packageError(req.body);
    if (error) return res.status(400).json({ error });

    const values = await packageValues(req.body);

    if (!values) {
      return res.status(400).json({ error: 'Destination not found' });
    }

    const result = await db.query(
      `UPDATE packages SET
       title = $1, destination_id = $2, category = $3, days = $4,
       nights = $5, price = $6, description = $7, highlights = $8,
       image = $9, featured = $10, duration = $11
       WHERE id = $12`,
      [...values, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ success: true });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Could not update package' });
  }
});

router.delete('/packages/:id', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM packages WHERE id = $1',
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({
      error: 'Could not delete package. It may be linked to an enquiry.'
    });
  }
});

// ---------- dashboard numbers + enquiries ----------
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) AS total,
        COALESCE(AVG(price), 0) AS avg,
        COUNT(*) FILTER (WHERE featured = TRUE) AS featured
      FROM packages
    `);

    const bookings = await db.query(
      'SELECT COUNT(*) AS c FROM enquiries'
    );

    const p = result.rows[0];

    res.json({
      total: Number(p.total),
      avgPrice: Math.round(Number(p.avg)),
      featured: Number(p.featured),
      bookings: Number(bookings.rows[0].c)
    });

  } catch (error) {
    res.status(500).json({ error: 'Could not get dashboard statistics' });
  }
});

// ---------- update enquiry status ----------
router.put('/bookings/:id/status', requireAdmin, async (req, res) => {
  try {
    const status = req.body.status;

    if (!['Pending', 'Contacted', 'Confirmed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await db.query(
      'UPDATE enquiries SET status = $1 WHERE id = $2',
      [status, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json({ success: true });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Could not update enquiry status' });
  }
});


router.get('/bookings', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        enquiries.id,
        enquiries.name,
        enquiries.email,
        enquiries.phone,
        destinations.name AS destination,
        packages.title AS package,
        enquiries.travel_date,
        enquiries.travellers,
        enquiries.budget,
        enquiries.status,
        enquiries.created_at
      FROM enquiries
      JOIN destinations
        ON enquiries.destination_id = destinations.id
      LEFT JOIN packages
        ON enquiries.package_id = packages.id
      ORDER BY enquiries.id DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Could not get enquiries' });
  }
});

module.exports = router;
