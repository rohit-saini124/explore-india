
// Getting the elements using javascript

const bookingForm = document.getElementById("booking-form");
const formMessage = document.getElementById("form-message");
const travelDate = document.getElementById("travel-date");


// Set today's date for minimum date
const today = new Date();

const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate()).padStart(2, "0");

travelDate.min = `${year}-${month}-${day}`;


// when we click submit
bookingForm.addEventListener("submit", function(event) {

    // Prevent the page from reloading
    event.preventDefault();

    // Check whether all input values are valid
    if (!bookingForm.checkValidity()) {
        bookingForm.reportValidity();
        return;
    }


    // Display success message
    formMessage.textContent =
        "Your enquiry has been submitted successfully!";

    formMessage.className = "form-message success";


    // Clear all form fields
    bookingForm.reset();

});
