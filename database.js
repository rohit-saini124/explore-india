// PostgreSQL connection shared by all API routes.
require("dotenv").config();
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add it to your .env file.");
}

const poolOptions = {
    connectionString: process.env.DATABASE_URL
};

// Turn this on for hosted PostgreSQL providers that require SSL (for example, Supabase).
if (process.env.PGSSL === "true") {
    poolOptions.ssl = { rejectUnauthorized: false };
}

const db = new Pool(poolOptions);

db.on("error", function(error) {
    console.error("Unexpected PostgreSQL error:", error);
});

module.exports = db;
