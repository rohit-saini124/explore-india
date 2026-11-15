const bookingForm = document.getElementById("booking-form");
const formMessage = document.getElementById("form-message");
const travelDate = document.getElementById("travel-date");
const destinationSelect = document.getElementById("destination");
const packageSelect = document.getElementById("package");
const submitButton = bookingForm.querySelector('button[type="submit"]');

let allPackages = [];

// Do not allow a travel date in the past.
const today = new Date();
travelDate.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

async function loadFormOptions() {
    try {
        const [destinationResponse, packageResponse] = await Promise.all([
            fetch('/api/destinations'),
            fetch('/api/packages')
        ]);
        if (!destinationResponse.ok || !packageResponse.ok) {
            throw new Error('Could not load destinations or packages.');
        }

        const destinations = await destinationResponse.json();
        allPackages = await packageResponse.json();

        destinationSelect.innerHTML = '<option value="">Select a destination</option>';
        destinations.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.name;
            destinationSelect.appendChild(option);
        });

        // Preselect a package when the user came from the packages page.
        const params = new URLSearchParams(location.search);
        const requestedDestination = params.get('destination_id');
        const requestedPackage = params.get('package_id');
        if (requestedDestination) {
            destinationSelect.value = requestedDestination;
            updatePackageOptions();
            if (requestedPackage) packageSelect.value = requestedPackage;
        }
    } catch (error) {
        console.error(error);
        formMessage.textContent = 'Could not load destinations. Please refresh the page.';
        formMessage.className = 'form-message error';
    }
}

function updatePackageOptions() {
    const destinationId = Number(destinationSelect.value);
    packageSelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';

    if (!destinationId) {
        defaultOption.textContent = 'Select a destination first';
        packageSelect.appendChild(defaultOption);
        packageSelect.disabled = true;
        return;
    }

    const matchingPackages = allPackages.filter(item => Number(item.destination_id) === destinationId);
    defaultOption.textContent = matchingPackages.length ? 'Not decided yet' : 'No package available';
    packageSelect.appendChild(defaultOption);

    matchingPackages.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.title} - ₹${Number(item.price).toLocaleString('en-IN')}`;
        packageSelect.appendChild(option);
    });

    packageSelect.disabled = false;
}

destinationSelect.addEventListener('change', updatePackageOptions);

bookingForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!bookingForm.checkValidity()) {
        bookingForm.reportValidity();
        return;
    }

    const bookingData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        destination_id: destinationSelect.value,
        package_id: packageSelect.value || null,
        travel_date: travelDate.value,
        travellers: document.getElementById('people').value,
        budget: document.getElementById('budget').value,
        duration: document.getElementById('duration').value,
        contact_method: document.getElementById('contact-method').value,
        message: document.getElementById('message').value.trim()
    };

    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
        formMessage.textContent = '';

        const response = await fetch('/api/booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not submit enquiry.');

        formMessage.textContent = `${result.message} Enquiry ID: ${result.enquiry_id}`;
        formMessage.className = 'form-message success';
        bookingForm.reset();
        updatePackageOptions();
    } catch (error) {
        formMessage.textContent = error.message;
        formMessage.className = 'form-message error';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = '✈ Submit Enquiry';
    }
});

loadFormOptions();
