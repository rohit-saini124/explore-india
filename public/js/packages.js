const $ = id => document.getElementById(id);
const CATEGORIES = ['All', 'Mountains', 'Beaches', 'Heritage', 'Spiritual', 'Nature', 'City'];
const FALLBACK_IMG = 'images/taj-mahal.jpg';
let packages = [];
let category = 'All';
let searchTimer;

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
}

function rupees(value) {
    return '₹' + Number(value).toLocaleString('en-IN');
}

function renderCategories() {
    $('chips').innerHTML = CATEGORIES.map(name =>
        `<button class="chip ${name === category ? 'active' : ''}" data-category="${name}">${name}</button>`
    ).join('');
}

async function loadPackages() {
    const params = new URLSearchParams({
        category,
        search: $('search').value.trim(),
        sort: $('sort').value
    });

    try {
        const response = await fetch('/api/packages?' + params);
        if (!response.ok) throw new Error('Could not load packages.');
        packages = await response.json();
        document.getElementById("package-count").textContent =
        packages.length;
        renderPackages();
    } catch (error) {
        $('pk-grid').innerHTML = '';
        $('empty').hidden = false;
        $('empty').textContent = error.message + ' Please check that the server is running.';
    }
}

function renderPackages() {
    $('count').textContent = `Showing ${packages.length} package${packages.length === 1 ? '' : 's'}`;
    $('empty').hidden = packages.length > 0;
    $('empty').textContent = 'No packages found. Try another search or category.';

    $('pk-grid').innerHTML = packages.map((item, index) => `
        <article class="pk-card" data-id="${item.id}">
            <div class="pk-img">
                <img src="${escapeHTML(item.image || FALLBACK_IMG)}" alt="${escapeHTML(item.destination)}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
                <span class="pk-tag">${escapeHTML(item.category || 'Travel')}</span>
                ${item.featured ? '<span class="pk-star">Popular</span>' : ''}
            </div>
            <div class="package-info">
                <h3>${escapeHTML(item.title)}</h3>
                <p class="pk-place">${escapeHTML(item.destination)}, ${escapeHTML(item.state || '')}</p>
                <p class="package-duration">${Number(item.days)} Days / ${Number(item.nights)} Nights</p>
                <p class="package-description">${escapeHTML(item.description || '')}</p>
                <div class="package-bottom">
                    <div><span class="price-label">Starting from</span><h3 class="package-price">${rupees(item.price)}</h3></div>
                    <span class="package-btn">View Details</span>
                </div>
            </div>
        </article>
    `).join('');
}

function openPackageDetails(id) {
    const item = packages.find(pkg => Number(pkg.id) === Number(id));
    if (!item) return;

    $('m-img').src = item.image || FALLBACK_IMG;
    $('m-img').alt = item.destination;
    $('m-duration').textContent = `${item.days} Days / ${item.nights} Nights`;
    $('m-name').textContent = item.title;
    $('m-place').textContent = `${item.destination}, ${item.state || ''} · ${item.category || ''}`;
    $('m-desc').textContent = item.description || '';
    $('m-highlights').innerHTML = (item.highlights || '').split(',').filter(part => part.trim())
        .map(part => `<li>${escapeHTML(part.trim())}</li>`).join('');
    $('m-price').textContent = rupees(item.price);
    $('m-book').href = `booking.html?destination_id=${encodeURIComponent(item.destination_id)}&package_id=${encodeURIComponent(item.id)}`;
    $('modal').hidden = false;
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    $('modal').hidden = true;
    document.body.style.overflow = '';
}

$('chips').addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    category = button.dataset.category;
    renderCategories();
    loadPackages();
});

$('search').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadPackages, 250);
});
$('sort').addEventListener('change', loadPackages);
$('pk-grid').addEventListener('click', event => {
    const card = event.target.closest('.pk-card');
    if (card) openPackageDetails(card.dataset.id);
});
$('modal-close').addEventListener('click', closeModal);
$('modal').addEventListener('click', event => {
    if (event.target === $('modal')) closeModal();
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModal();
});

// A destination card can open this page with ?search=Place.
const initialSearch = new URLSearchParams(location.search).get('search');
if (initialSearch) $('search').value = initialSearch;



renderCategories();
loadPackages();


