const express = require("express");
const crypto = require("crypto");
const db = require("../database");
const router = express.Router();

function passwordMatches(password, savedHash) {
    try {
        const parts = String(savedHash || "").split(":");
        if (parts.length !== 2) return false;
        const actual = crypto.scryptSync(String(password), parts[0], 64);
        const expected = Buffer.from(parts[1], "hex");
        return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
    } catch (error) {
        return false;
    }
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.adminId) return next();
    return res.status(401).json({ error: "Please log in as admin." });
}

router.get("/check", (req, res) => {
    res.json({ loggedIn: Boolean(req.session && req.session.adminId) });
});

router.post("/login", async (req, res) => {
    try {
        const username = String(req.body.username || "").trim();
        const password = String(req.body.password || "");
        if (!username || !password) {
            return res.status(400).json({ error: "Enter your username and password." });
        }

        const result = await db.query(
            "SELECT id, username, password_hash FROM admins WHERE username = $1",
            [username]
        );
        const admin = result.rows[0];

        if (!admin || !passwordMatches(password, admin.password_hash)) {
            return res.status(401).json({ error: "Incorrect username or password." });
        }

        req.session.regenerate((error) => {
    if (error) {
        return res.status(500).json({
            error: "Could not start admin session."
        });
    }

    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;

    req.session.save((error) => {
        if (error) {
            return res.status(500).json({
                error: "Could not save admin session."
            });
        }

        res.json({ success: true });
    });
});
    } catch (error) {
        console.error("Admin login failed:", error);
        res.status(500).json({ error: "Could not log in." });
    }
});

router.post("/logout", (req, res) => {
    if (!req.session) return res.json({ success: true });
    req.session.destroy((error) => {
        if (error) return res.status(500).json({ error: "Could not log out." });
        res.clearCookie("connect.sid");
        res.json({ success: true });
    });
});

router.get("/stats", requireAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM packages) AS packages,
                (SELECT COUNT(*) FROM enquiries) AS enquiries,
                (SELECT COUNT(*) FROM enquiries WHERE status = 'Pending') AS pending,
                (SELECT COUNT(*) FROM enquiries WHERE status = 'Confirmed') AS confirmed
        `);
        const row = result.rows[0];
        res.json({
            packages: Number(row.packages),
            enquiries: Number(row.enquiries),
            pending: Number(row.pending),
            confirmed: Number(row.confirmed)
        });
    } catch (error) {
        console.error("Could not load admin summary:", error);
        res.status(500).json({ error: "Could not load dashboard summary." });
    }
});

router.get("/bookings", requireAdmin, async (req, res) => {
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
                enquiries.duration,
                enquiries.contact_method,
                enquiries.message,
                enquiries.status,
                enquiries.created_at
            FROM enquiries
            JOIN destinations ON enquiries.destination_id = destinations.id
            LEFT JOIN packages ON enquiries.package_id = packages.id
            ORDER BY enquiries.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Could not load enquiries:", error);
        res.status(500).json({ error: "Could not load enquiries." });
    }
});

router.put("/bookings/:id/status", requireAdmin, async (req, res) => {
    try {
        const status = req.body.status;
        if (!["Pending", "Contacted", "Confirmed"].includes(status)) {
            return res.status(400).json({ error: "Choose a valid enquiry status." });
        }

        const result = await db.query(
            "UPDATE enquiries SET status = $1 WHERE id = $2 RETURNING id",
            [status, req.params.id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Enquiry not found." });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Could not update enquiry:", error);
        res.status(500).json({ error: "Could not update enquiry status." });
    }
});

function validatePackage(body) {
    const title = String(body.title || "").trim();
    const destinationId = Number(body.destination_id);
    const days = Number(body.days);
    const price = Number(body.price);

    if (!title || title.length < 2) return { error: "Enter a package name." };
    if (!Number.isInteger(destinationId) || destinationId < 1) return { error: "Select a destination." };
    if (!Number.isInteger(days) || days < 1 || days > 30) return { error: "Days must be between 1 and 30." };
    if (!Number.isFinite(price) || price <= 0) return { error: "Enter a valid package price." };

    let image = String(body.image || "").trim();
    if (image.includes("..") || (!image.startsWith("/images/") && !image.startsWith("images/"))) {
        image = "";
    }

    return {
        values: {
            title,
            destinationId,
            category: String(body.category || "Nature").trim(),
            days,
            nights: Math.max(0, days - 1),
            price,
            description: String(body.description || "").trim(),
            highlights: String(body.highlights || "").trim(),
            image,
            featured: body.featured === true || body.featured === "true"
        }
    };
}

async function savePackage(body, id) {
    const checked = validatePackage(body);
    if (checked.error) return { error: checked.error };
    const p = checked.values;

    const destination = await db.query(
        "SELECT id, image FROM destinations WHERE id = $1",
        [p.destinationId]
    );
    if (destination.rows.length === 0) return { error: "Selected destination was not found." };

    const image = p.image || destination.rows[0].image || "/images/taj-mahal.jpg";
    const duration = `${p.days} Days / ${p.nights} Nights`;
    const values = [p.title, p.destinationId, p.category || "Nature", p.days,
        p.nights, p.price, duration, p.description, p.highlights, image, p.featured];

    if (id) {
        const result = await db.query(`
            UPDATE packages SET
                title = $1, destination_id = $2, category = $3, days = $4,
                nights = $5, price = $6, duration = $7, description = $8,
                highlights = $9, image = $10, featured = $11
            WHERE id = $12 RETURNING id
        `, [...values, id]);
        return result.rowCount ? { id: result.rows[0].id } : { error: "Package not found." };
    }

    const result = await db.query(`
        INSERT INTO packages
            (title, destination_id, category, days, nights, price, duration,
             description, highlights, image, featured)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
    `, values);
    return { id: result.rows[0].id };
}

router.post("/packages", requireAdmin, async (req, res) => {
    try {
        const result = await savePackage(req.body, null);
        if (result.error) return res.status(400).json({ error: result.error });
        res.status(201).json({ success: true, id: result.id });
    } catch (error) {
        console.error("Could not add package:", error);
        res.status(500).json({ error: "Could not add package." });
    }
});

router.put("/packages/:id", requireAdmin, async (req, res) => {
    try {
        const result = await savePackage(req.body, req.params.id);
        if (result.error) return res.status(400).json({ error: result.error });
        res.json({ success: true, id: result.id });
    } catch (error) {
        console.error("Could not update package:", error);
        res.status(500).json({ error: "Could not update package." });
    }
});

router.delete("/packages/:id", requireAdmin, async (req, res) => {
    try {
        const result = await db.query(
            "DELETE FROM packages WHERE id = $1 RETURNING id",
            [req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: "Package not found." });
        res.json({ success: true });
    } catch (error) {
        // If an old database has a restrictive foreign key, keep the package
        // rather than deleting enquiry history.
        res.status(409).json({ error: "This package is linked to an enquiry, so it cannot be deleted." });
    }
});

module.exports = router;
