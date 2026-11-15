require("dotenv").config();

const db = require("./database");

async function testConnection() {
    try {
        const result = await db.query("SELECT NOW()");

        console.log("Connected to Supabase successfully!");
        console.log("Database time:", result.rows[0].now);
    } catch (error) {
        console.error("Database connection failed:");
        console.error(error.message);
    } finally {
        await db.end();
    }
}

testConnection();