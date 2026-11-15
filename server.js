// Import Express
const express = require("express");

const destinationsRoutes = require("./routes/destinations");
const packagesRoutes = require("./routes/packages");
const bookingRoutes = require("./routes/booking");
// Create an Express application
const app = express();

// Define the port number
const PORT = 3000;

app.use(function(req, res, next) {

    console.log(`A request has arrived! with method: ${req.method} and PORT: ${PORT}`);

    next();

});

// Serve frontend files from the public folder
app.use(express.static("public"));
app.use(express.json()); // middleware to help reading json request bodies in post requests

//route registering
app.use("/api/destinations", destinationsRoutes);
app.use("/api/packages", packagesRoutes);
app.use("/api/booking", bookingRoutes);

// First API route
app.get("/api/test", function(req, res) {

    res.send("Explore India backend is working!");

});


app.get("/api/info", function(req, res) {

    const projectInfo = {
        name: "Explore India",
        type: "Travel Discovery Website",
        backend: "Node.js and Express",
        database: "SQLite",
        success: true
    };

    res.json(projectInfo);

});


// Start the server
app.listen(PORT, function() {
    console.log(`Server is running at http://localhost:${PORT}`);
});

