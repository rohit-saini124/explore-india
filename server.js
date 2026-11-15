
require("dotenv").config();

const express = require("express");
const session = require("express-session");

const destinationsRoutes = require("./routes/destinations");
const packagesRoutes = require("./routes/packages");
const bookingRoutes = require("./routes/booking");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = 3000;

// Middleware to read JSON data
app.use(express.json({ limit: "10mb" }));
// Middleware to manage admin login sessions
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000
    }
}));

// Serve frontend files
app.use(express.static("public"));

// Register API routes
app.use("/api/destinations", destinationsRoutes);
app.use("/api/packages", packagesRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/admin", adminRoutes);

// Test route
app.get("/api/test", function(req, res) {
    res.send("Explore India backend is working!");
});

// Project information
app.get("/api/info", function(req, res) {
    res.json({
        name: "Explore India",
        type: "Travel Discovery Website",
        backend: "Node.js and Express",
        database: "Supabase PostgreSQL",
        success: true
    });
});

// Start the server
app.listen(PORT, function() {
    console.log(`Server is running at http://localhost:${PORT}`);
});
