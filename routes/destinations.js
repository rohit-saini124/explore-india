const express = require("express");
const router = express.Router();

const db = require("../database");

// GET all destinations
router.get("/", async function(req, res) {
    try {
        const result = await db.query(
            "SELECT * FROM destinations ORDER BY id"
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Error fetching destinations:", error);

        res.status(500).json({
            success: false,
            message: "Could not fetch destinations"
        });
    }
});

module.exports = router;
