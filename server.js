const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(function(req, res, next) {
    console.log("A request has arrived!");
    next();
});

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.use(session({
    secret: "explore-india-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 2 * 60 * 60 * 1000 }
}));

// Load a route file only if it exists (teammates' files may not be merged yet)
function useRoute(urlPath, file) {
    if (fs.existsSync(path.join(__dirname, "routes", file + ".js"))) {
        app.use(urlPath, require("./routes/" + file));
        console.log("Loaded route: " + urlPath);
    } else {
        console.log("Skipped " + urlPath + " (routes/" + file + ".js not found yet)");
    }
}

useRoute("/api/destinations", "destinations");
useRoute("/api/packages", "packages");
useRoute("/api/booking", "booking");
useRoute("/api/admin", "admin");

app.get("/api/test", function(req, res) {
    res.send("Explore India backend is working!");
});

app.get("/api/info", function(req, res) {
    res.json({
        name: "Explore India",
        type: "Travel Discovery Website",
        backend: "Node.js and Express",
        database: "SQLite",
        success: true
    });
});

app.listen(PORT, function() {
    console.log(`Server is running at http://localhost:${PORT}`);
});