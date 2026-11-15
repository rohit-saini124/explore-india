const express = require("express");
const router = express.Router();
const db = require("../database");

// GET /api/packages?category=Mountains&search=Manali&sort=low
router.get("/", async (req, res) => {
    try {
        const { category, search, sort } = req.query;
        const conditions = [];
        const values = [];

        if (category && category !== "All") {
            values.push(category);
            conditions.push(`packages.category = $${values.length}`);
        }

        if (search && search.trim()) {
            values.push(`%${search.trim()}%`);
            const p = `$${values.length}`;
            conditions.push(`(packages.title ILIKE ${p} OR destinations.name ILIKE ${p} OR destinations.state ILIKE ${p})`);
        }

        const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
        const orderBy = {
            low: "packages.price ASC",
            high: "packages.price DESC",
            days: "packages.days ASC"
        }[sort] || "packages.featured DESC, packages.id ASC";

        const result = await db.query(`
            SELECT
                packages.id,
                packages.title,
                packages.destination_id,
                destinations.name AS destination,
                destinations.state,
                packages.category,
                packages.days,
                packages.nights,
                packages.price,
                packages.duration,
                packages.description,
                packages.highlights,
                COALESCE(packages.image, destinations.image) AS image,
                packages.featured
            FROM packages
            JOIN destinations ON packages.destination_id = destinations.id
            ${where}
            ORDER BY ${orderBy}
        `, values);

        res.json(result.rows);
    } catch (error) {
        console.error("Could not load packages:", error);
        res.status(500).json({ message: "Could not load packages." });
    }
});

// Get one package by ID.
router.get("/:id", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT packages.*, destinations.name AS destination,
                   destinations.state, COALESCE(packages.image, destinations.image) AS image
            FROM packages
            JOIN destinations ON packages.destination_id = destinations.id
            WHERE packages.id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Package not found." });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Could not load package:", error);
        res.status(500).json({ message: "Could not load package." });
    }
});

module.exports = router;
