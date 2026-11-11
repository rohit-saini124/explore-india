// Get the sticky booking bar
const stickyBooking = document.getElementById("sticky-booking");

// Get the original booking banner
const originalBanner = document.querySelector(".booking-banner");

// Detect when the original banner enters the screen
const bannerObserver = new IntersectionObserver(
    function(entries) {

        const bannerVisible = entries[0].isIntersecting;

        // If original banner is visible, hide sticky bar
        if (bannerVisible) {
            stickyBooking.classList.remove("show");
        }
    }
);

// Observe the original booking banner
bannerObserver.observe(originalBanner);


// Detect scrolling
window.addEventListener("scroll", function() {

    // Check whether the original banner is visible
    const bannerPosition = originalBanner.getBoundingClientRect();

    const bannerVisible =
        bannerPosition.top < window.innerHeight &&
        bannerPosition.bottom > 0;

    // Show sticky bar after scrolling, unless original banner is visible
    if (window.scrollY > 50 && !bannerVisible) {
        stickyBooking.classList.add("show");
    } else {
        stickyBooking.classList.remove("show");
    }

});
