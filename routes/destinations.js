const express = require("express");
const router = express.Router();
const db = require("../database");

// Return destinations for the destination page and booking form.
router.get("/", async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, name, state, description, image FROM destinations ORDER BY name"
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Could not load destinations:", error);
        res.status(500).json({ message: "Could not load destinations." });
    }
});

module.exports = router;
