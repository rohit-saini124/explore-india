const express = require("express");
const router = express.Router();

const db = require("../database");

// POST a new booking enquiry
router.post("/", async function(req, res) {

    try {
        // 1. Get information sent by frontend
        const {
            name,
            email,
            phone,
            destination_id,
            package_id,
            travel_date,
            travellers,
            budget,
            duration,
            contact_method,
            message
        } = req.body;

        // 2. Check required fields
        if (
            !name || !email || !phone ||
            !destination_id || !travel_date ||
            travellers === undefined || travellers === null
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields."
            });
        }

        // 3. Convert IDs and traveller count into numbers
        const destinationId = Number(destination_id);
        const packageId =
            package_id === undefined || package_id === null || package_id === ""
                ? null
                : Number(package_id);

        const travellerCount = Number(travellers);

        // 4. Validate numeric values
        if (
            !Number.isInteger(destinationId) ||
            destinationId <= 0 ||
            !Number.isInteger(travellerCount) ||
            travellerCount <= 0 ||
            (packageId !== null &&
                (!Number.isInteger(packageId) || packageId <= 0))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid destination, package or traveller count."
            });
        }

        // 5. Check whether destination exists
        const destination = await db.query(
            "SELECT id FROM destinations WHERE id = $1",
            [destinationId]
        );

        if (destination.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Selected destination does not exist."
            });
        }

        // 6. If a package is selected, check its destination
        if (packageId !== null) {

            const selectedPackage = await db.query(`
                SELECT id
                FROM packages
                WHERE id = $1 AND destination_id = $2
            `, [packageId, destinationId]);

            if (selectedPackage.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Selected package is not available for this destination."
                });
            }
        }

        // 7. Save enquiry in Supabase
        const result = await db.query(`
            INSERT INTO enquiries (
                name,
                email,
                phone,
                destination_id,
                package_id,
                travel_date,
                travellers,
                budget,
                duration,
                contact_method,
                message
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
        `, [
            name.trim(),
            email.trim(),
            phone.trim(),
            destinationId,
            packageId,
            travel_date,
            travellerCount,
            budget || null,
            duration || null,
            contact_method || null,
            message || null
        ]);

        // 8. Send success response
        res.status(201).json({
            success: true,
            message: "Your enquiry has been submitted successfully!",
            enquiry_id: result.rows[0].id
        });

    } catch (error) {
        console.error("Error submitting enquiry:", error);

        res.status(500).json({
            success: false,
            message: "Could not submit your enquiry."
        });
    }
});

module.exports = router;
