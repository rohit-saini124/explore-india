require("dotenv").config();

const path = require("path");
const express = require("express");
const session = require("express-session");
const db = require("./database");

const destinationsRoutes = require("./routes/destinations");
const packagesRoutes = require("./routes/packages");
const bookingRoutes = require("./routes/booking");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

// Vercel runs behind a proxy. Required for secure session cookies.
app.set("trust proxy", 1);

app.use(express.json({ limit: "1mb" }));

// Use PostgreSQL to store sessions.
const PgSession = require("connect-pg-simple")(session);

app.use(session({
    store: new PgSession({
        pool: db,
        tableName: "user_sessions",
        createTableIfMissing: true
    }),

    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 8 * 60 * 60 * 1000
    }
}));

// Serve frontend files.
app.use(express.static(path.join(__dirname, "public")));

// API routes.
app.use("/api/destinations", destinationsRoutes);
app.use("/api/packages", packagesRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/test", (req, res) => {
    res.send("Explore India backend is working!");
});

app.get("/api/info", (req, res) => {
    res.json({
        name: "Explore India",
        type: "Travel Discovery and Booking Enquiry Management System",
        backend: "Node.js and Express",
        database: "PostgreSQL",
        success: true
    });
});

app.listen(PORT, () => {
    console.log(`Explore India is running at http://localhost:${PORT}`);
});
