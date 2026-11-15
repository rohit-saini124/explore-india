// The sticky booking bar exists only on the homepage.
const stickyBooking = document.getElementById('sticky-booking');
const originalBanner = document.querySelector('.booking-banner');

if (stickyBooking && originalBanner) {
    function updateStickyBooking() {
        const banner = originalBanner.getBoundingClientRect();
        const bannerVisible = banner.top < window.innerHeight && banner.bottom > 0;
        if (window.scrollY > 50 && !bannerVisible) {
            stickyBooking.classList.add('show');
        } else {
            stickyBooking.classList.remove('show');
        }
    }

    window.addEventListener('scroll', updateStickyBooking);
    updateStickyBooking();
}
