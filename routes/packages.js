
const express = require("express");
const router = express.Router();

const db = require("../database");

// GET all packages with their destination names
router.get("/", async function(req, res) {
    try {
        const result = await db.query(`
            SELECT
                packages.id,
                packages.title,
                packages.price,
                packages.duration,
                packages.destination_id,
                destinations.name AS destination
            FROM packages
            JOIN destinations
            ON packages.destination_id = destinations.id
            ORDER BY packages.id
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("Error fetching packages:", error);

        res.status(500).json({
            success: false,
            message: "Could not fetch packages"
        });
    }
});

module.exports = router;
