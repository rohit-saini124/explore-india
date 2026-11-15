const $ = id => document.getElementById(id);

async function api(url, method = 'GET', body) {
    const options = { method, headers: {} };
    if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    let data = {};
    try { data = await response.json(); } catch (error) { data = {}; }
    if (!response.ok) {
        if (response.status === 401 && document.body.classList.contains('dash-body')) {
            location.href = 'admin-login.html';
        }
        throw new Error(data.error || data.message || 'Something went wrong.');
    }
    return data;
}

function showMessage(id, message, success = false) {
    const element = $(id);
    element.textContent = message;
    element.hidden = !message;
    element.className = success ? 'alert ok' : 'alert';
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
}

function showToast(message, isError = false) {
    $('toast').textContent = message;
    $('toast').className = isError ? 'toast show error' : 'toast show';
    setTimeout(() => { $('toast').className = 'toast'; }, 2500);
}

// Login page
if ($('login-form')) {
    api('/api/admin/check').then(result => {
        if (result.loggedIn) location.href = 'admin-dashboard.html';
    }).catch(() => {});

    $('login-form').addEventListener('submit', async event => {
        event.preventDefault();
        showMessage('login-error', '');
        try {
            await api('/api/admin/login', 'POST', {
                username: $('username').value.trim(),
                password: $('password').value
            });
            location.href = 'admin-dashboard.html';
        } catch (error) {
            showMessage('login-error', error.message);
        }
    });
}

// Dashboard page
if ($('packages-body')) {
    let packages = [];
    let destinations = [];

    async function loadDestinations() {
        destinations = await api('/api/destinations');
        $('package-destination').innerHTML = destinations.map(destination =>
            `<option value="${destination.id}">${escapeHTML(destination.name)} (${escapeHTML(destination.state)})</option>`
        ).join('');
    }

    async function loadStats() {
        const stats = await api('/api/admin/stats');
        $('s-packages').textContent = stats.packages;
        $('s-enquiries').textContent = stats.enquiries;
        $('s-pending').textContent = stats.pending;
        $('s-confirmed').textContent = stats.confirmed;
    }

    async function loadPackages() {
        packages = await api('/api/packages');
        renderPackages();
    }

    function renderPackages() {
        const search = $('package-search').value.trim().toLowerCase();
        const shown = packages.filter(item =>
            `${item.title} ${item.destination} ${item.category}`.toLowerCase().includes(search)
        );

        $('packages-body').innerHTML = shown.length ? shown.map(item => `
            <tr>
                <td><strong>${escapeHTML(item.title)}</strong></td>
                <td>${escapeHTML(item.destination)}</td>
                <td>${escapeHTML(item.category || '')}</td>
                <td>${item.days}D / ${item.nights}N</td>
                <td>₹${Number(item.price).toLocaleString('en-IN')}</td>
                <td>
                    <button class="act" data-edit="${item.id}" aria-label="Edit package">Edit</button>
                    <button class="act" data-delete="${item.id}" aria-label="Delete package">Delete</button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="6" class="empty">No packages found.</td></tr>';
    }

    async function loadBookings() {
        const bookings = await api('/api/admin/bookings');
        $('bookings-empty').hidden = bookings.length > 0;
        $('bookings-body').innerHTML = bookings.map(item => `
            <tr>
                <td><strong>${escapeHTML(item.name)}</strong><br><small>${escapeHTML(item.email)}</small></td>
                <td>${escapeHTML(item.phone)}<br><small>${escapeHTML(item.contact_method || '')}</small></td>
                <td>${escapeHTML(item.destination)}<br><small>${escapeHTML(item.package || 'No package selected')}</small></td>
                <td>${escapeHTML(String(item.travel_date).slice(0, 10))}</td>
                <td>${item.travellers}</td>
                <td>${escapeHTML(item.message || '—')}</td>
                <td>
                    <select class="booking-status" data-id="${item.id}">
                        <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Contacted" ${item.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="Confirmed" ${item.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                    </select>
                </td>
            </tr>
        `).join('');
    }

    function openPackageForm(item = null) {
        $('package-form').reset();
        $('package-id').value = item ? item.id : '';
        $('package-form-title').textContent = item ? 'Edit Package' : 'Add Package';
        $('package-title').value = item ? item.title : '';
        $('package-destination').value = item ? item.destination_id : (destinations[0]?.id || '');
        $('package-category').value = item ? item.category : 'Nature';
        $('package-days').value = item ? item.days : 4;
        $('package-price').value = item ? item.price : '';
        $('package-image').value = item ? item.image : '';
        $('package-description').value = item ? item.description : '';
        $('package-highlights').value = item ? item.highlights : '';
        $('package-featured').checked = item ? Boolean(item.featured) : false;
        showMessage('package-error', '');
        $('package-modal').hidden = false;
    }

    function closePackageForm() {
        $('package-modal').hidden = true;
    }

    $('add-package').addEventListener('click', () => openPackageForm());
    $('close-package').addEventListener('click', closePackageForm);
    $('cancel-package').addEventListener('click', closePackageForm);
    $('package-modal').addEventListener('click', event => {
        if (event.target === $('package-modal')) closePackageForm();
    });
    $('package-search').addEventListener('input', renderPackages);

    $('packages-body').addEventListener('click', async event => {
        const editButton = event.target.closest('[data-edit]');
        const deleteButton = event.target.closest('[data-delete]');

        if (editButton) {
            const item = packages.find(pkg => Number(pkg.id) === Number(editButton.dataset.edit));
            if (item) openPackageForm(item);
        }

        if (deleteButton) {
            const id = deleteButton.dataset.delete;
            if (!confirm('Delete this package?')) return;
            try {
                await api('/api/admin/packages/' + id, 'DELETE');
                showToast('Package deleted.');
                await Promise.all([loadPackages(), loadStats()]);
            } catch (error) {
                showToast(error.message, true);
            }
        }
    });

    $('package-form').addEventListener('submit', async event => {
        event.preventDefault();
        const id = $('package-id').value;
        const body = {
            title: $('package-title').value.trim(),
            destination_id: $('package-destination').value,
            category: $('package-category').value,
            days: $('package-days').value,
            price: $('package-price').value,
            image: $('package-image').value.trim(),
            description: $('package-description').value.trim(),
            highlights: $('package-highlights').value.trim(),
            featured: $('package-featured').checked
        };

        try {
            if (id) await api('/api/admin/packages/' + id, 'PUT', body);
            else await api('/api/admin/packages', 'POST', body);
            closePackageForm();
            showToast(id ? 'Package updated.' : 'Package added.');
            await Promise.all([loadPackages(), loadStats()]);
        } catch (error) {
            showMessage('package-error', error.message);
        }
    });

    $('bookings-body').addEventListener('change', async event => {
        if (!event.target.classList.contains('booking-status')) return;
        try {
            await api('/api/admin/bookings/' + event.target.dataset.id + '/status', 'PUT', {
                status: event.target.value
            });
            showToast('Enquiry status updated.');
            await loadStats();
        } catch (error) {
            showToast(error.message, true);
            await loadBookings();
        }
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', async () => {
            document.querySelectorAll('.tab').forEach(button => button.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.panel').forEach(panel => {
                panel.hidden = panel.id !== 'tab-' + tab.dataset.tab;
            });
            if (tab.dataset.tab === 'bookings') {
                try { await loadBookings(); } catch (error) { showToast(error.message, true); }
            }
        });
    });

    $('logout').addEventListener('click', async () => {
        try { await api('/api/admin/logout', 'POST'); } finally { location.href = 'admin-login.html'; }
    });

    async function startDashboard() {
        const check = await api('/api/admin/check');
        if (!check.loggedIn) {
            location.href = 'admin-login.html';
            return;
        }
        await loadDestinations();
        await Promise.all([loadPackages(), loadStats()]);
    }

    startDashboard().catch(error => showToast(error.message, true));
}
