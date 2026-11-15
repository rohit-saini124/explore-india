// Getting HTML elements
const bookingForm = document.getElementById("booking-form");
const formMessage = document.getElementById("form-message");
const travelDate = document.getElementById("travel-date");

const destination = document.getElementById("destination");
const packageSelect = document.getElementById("package");

const submitButton = bookingForm.querySelector('button[type="submit"]');

// Store packages received from the backend
let allPackages = [];


// Set today's date as the minimum travel date
const today = new Date();

const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate()).padStart(2, "0");

travelDate.min = `${year}-${month}-${day}`;


// Load destinations and packages from backend
async function loadFormOptions() {
    try {
        // Fetch destinations
        const destinationResponse = await fetch("/api/destinations");

        if (!destinationResponse.ok) {
            throw new Error("Could not load destinations");
        }

        const destinations = await destinationResponse.json();

        // Fetch packages
        const packageResponse = await fetch("/api/packages");

        if (!packageResponse.ok) {
            throw new Error("Could not load packages");
        }

        allPackages = await packageResponse.json();

        // Clear old hardcoded destination options
        destination.innerHTML = '<option value="">Select a destination</option>';

        // Add destinations received from database
        destinations.forEach(function(item) {
            const option = document.createElement("option");

            option.value = item.id;
            option.textContent = item.name;

            destination.appendChild(option);
        });

        console.log("Destinations and packages loaded successfully!");

    } catch (error) {
        console.error("Error loading form options:", error);

        formMessage.textContent =
            "Could not load destinations. Please refresh the page.";

        formMessage.className = "form-message error";
    }
}


// Filter packages when destination changes
destination.addEventListener("change", function() {

    const selectedDestinationId = Number(destination.value);

    // Clear previous package options
    packageSelect.innerHTML = "";

    // Add default option
    const defaultOption = document.createElement("option");

    defaultOption.value = "";
    defaultOption.textContent = selectedDestinationId
        ? "Not Decided Yet"
        : "Select a destination first";

    packageSelect.appendChild(defaultOption);

    // If no destination is selected
    if (!selectedDestinationId) {
        packageSelect.disabled = true;
        return;
    }

    // Find packages belonging to selected destination
    const matchingPackages = allPackages.filter(function(item) {
        return Number(item.destination_id) === selectedDestinationId;
    });

    // Add matching packages
    matchingPackages.forEach(function(item) {

        const option = document.createElement("option");

        option.value = item.id;
        option.textContent = item.title + " - ₹" + item.price;

        packageSelect.appendChild(option);
    });

    packageSelect.disabled = false;
});


// Submit booking enquiry to backend
bookingForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    // Check HTML form validation
    if (!bookingForm.checkValidity()) {
        bookingForm.reportValidity();
        return;
    }

    // Collect form information
    const bookingData = {
        name: document.getElementById("name").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim(),

        destination_id: destination.value,
        package_id: packageSelect.value || null,

        travel_date: travelDate.value,
        travellers: document.getElementById("people").value,

        budget: document.getElementById("budget").value,
        duration: document.getElementById("duration").value,
        contact_method: document.getElementById("contact-method").value,

        message: document.getElementById("message").value.trim()
    };

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";

        formMessage.textContent = "";

        // Send data to Express backend
        const response = await fetch("/api/booking", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        // Check whether backend accepted the enquiry
        if (!response.ok) {
            throw new Error(result.message || "Could not submit enquiry");
        }

        // Show success message
        formMessage.textContent =
            result.message + " Enquiry ID: " + result.enquiry_id;

        formMessage.className = "form-message success";

        // Reset form
        bookingForm.reset();

        // Reset package dropdown
        packageSelect.innerHTML =
            '<option value="">Select a destination first</option>';

        packageSelect.disabled = true;

    } catch (error) {

        console.error("Booking submission error:", error);

        formMessage.textContent = error.message;
        formMessage.className = "form-message error";

    } finally {

        submitButton.disabled = false;
        submitButton.textContent = "✈ Submit Enquiry";
    }
});


// Load options when page opens
loadFormOptions();
