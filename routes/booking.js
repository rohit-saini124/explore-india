const express = require("express");
const router = express.Router();
const db = require("../database");

// Save a booking enquiry. This does not confirm or charge for a booking.
router.post("/", async (req, res) => {
    try {
        const {
            name, email, phone, destination_id, package_id,
            travel_date, travellers, budget, duration, contact_method, message
        } = req.body;

        if (!name || !email || !phone || !destination_id || !travel_date || !travellers) {
            return res.status(400).json({ message: "Please fill in all required fields." });
        }

        const cleanName = String(name).trim();
        const cleanEmail = String(email).trim();
        const cleanPhone = String(phone).trim();
        const destinationId = Number(destination_id);
        const packageId = package_id ? Number(package_id) : null;
        const travellerCount = Number(travellers);

        if (cleanName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({ message: "Please enter a valid name and email address." });
        }
        if (!/^\d{10}$/.test(cleanPhone)) {
            return res.status(400).json({ message: "Please enter a 10-digit phone number." });
        }
        if (!Number.isInteger(destinationId) || destinationId < 1 ||
            !Number.isInteger(travellerCount) || travellerCount < 1 ||
            (packageId !== null && (!Number.isInteger(packageId) || packageId < 1))) {
            return res.status(400).json({ message: "Please select a valid destination, package and traveller count." });
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(travel_date))) {
            return res.status(400).json({ message: "Please select a valid travel date." });
        }

        const destination = await db.query(
            "SELECT id FROM destinations WHERE id = $1",
            [destinationId]
        );
        if (destination.rows.length === 0) {
            return res.status(400).json({ message: "Selected destination does not exist." });
        }

        // A package must belong to the destination selected in the form.
        if (packageId !== null) {
            const selectedPackage = await db.query(
                "SELECT id FROM packages WHERE id = $1 AND destination_id = $2",
                [packageId, destinationId]
            );
            if (selectedPackage.rows.length === 0) {
                return res.status(400).json({ message: "That package does not belong to the selected destination." });
            }
        }

        const result = await db.query(`
            INSERT INTO enquiries (
                name, email, phone, destination_id, package_id, travel_date,
                travellers, budget, duration, contact_method, message
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
        `, [
            cleanName, cleanEmail, cleanPhone, destinationId, packageId,
            travel_date, travellerCount, budget || null, duration || null,
            contact_method || null, message ? String(message).trim() : null
        ]);

        res.status(201).json({
            success: true,
            message: "Your enquiry has been submitted successfully!",
            enquiry_id: result.rows[0].id
        });
    } catch (error) {
        console.error("Could not submit enquiry:", error);
        res.status(500).json({ message: "Could not submit your enquiry. Please try again." });
    }
});

module.exports = router;
