
const $ = id => document.getElementById(id);
const CATEGORIES = ['All', 'Mountains', 'Beaches', 'Heritage', 'Spiritual', 'Nature', 'City'];
const FALLBACK_IMG = 'images/taj-mahal.jpg';
let packages = [], category = 'All', timer;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = n => '₹' + Number(n).toLocaleString('en-IN');
const imgTag = (src, alt) => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">`;

function renderChips() {
    $('chips').innerHTML = CATEGORIES.map(c =>
        `<button class="chip ${c === category ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('');
}

async function load() {
    const q = new URLSearchParams({ category, search: $('search').value.trim(), sort: $('sort').value });
    try {
        const res = await fetch('/api/packages?' + q);
        if (!res.ok) throw new Error();
        packages = await res.json();
        render();
    } catch {
        $('pk-grid').innerHTML = '';
        $('empty').hidden = false;
        $('empty').textContent = '⚠️ Could not load packages. Please make sure the server is running.';
    }
}

function render() {
    $('count').textContent = `Showing ${packages.length} package${packages.length === 1 ? '' : 's'}`;
    $('empty').hidden = packages.length > 0;
    if (!packages.length) $('empty').textContent = '😕 No packages found. Try a different search or category.';
    $('pk-grid').innerHTML = packages.map((p, i) => `
        <div class="pk-card" data-id="${p.id}" style="animation-delay:${Math.min(i, 8) * 50}ms">
            <div class="pk-img">${imgTag(p.image, p.destination)}
                <span class="pk-tag">${esc(p.category)}</span>
                ${p.featured ? '<span class="pk-star">⭐ Popular</span>' : ''}
            </div>
            <div class="package-info">
                <h3>${esc(p.name)}</h3>
                <p class="pk-place">📍 ${esc(p.destination)}${p.state ? ', ' + esc(p.state) : ''}</p>
                <p class="package-duration">${p.days} Days / ${p.nights} Nights</p>
                <p class="package-description">${esc(p.description)}</p>
                <div class="package-bottom">
                    <div><span class="price-label">Starting from</span>
                        <h3 class="package-price">${inr(p.price)}</h3></div>
                    <span class="package-btn">View Details</span>
                </div>
            </div>
        </div>`).join('');
}

function openModal(id) {
    const p = packages.find(x => x.id == id); if (!p) return;
    $('m-img').outerHTML = `<img id="m-img" src="${esc(p.image)}" alt="${esc(p.destination)}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">`;
    $('m-duration').textContent = `${p.days} Days / ${p.nights} Nights`;
    $('m-name').textContent = p.name;
    $('m-place').textContent = `📍 ${p.destination}${p.state ? ', ' + p.state : ''}  •  ${p.category}`;
    $('m-desc').textContent = p.description;
    $('m-highlights').innerHTML = (p.highlights || '').split(',').filter(h => h.trim())
        .map(h => `<li>${esc(h.trim())}</li>`).join('');
    $('m-price').textContent = inr(p.price);
    $('m-book').href = `booking.html?package=${encodeURIComponent(p.name)}`;
    $('modal').hidden = false;
    document.body.style.overflow = 'hidden';
}
function closeModal() { $('modal').hidden = true; document.body.style.overflow = ''; }

$('chips').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    category = b.dataset.cat; renderChips(); load();
});
$('search').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(load, 300); });
$('sort').addEventListener('change', load);
$('pk-grid').addEventListener('click', e => {
    const c = e.target.closest('.pk-card'); if (c) openModal(c.dataset.id);
});
$('modal-close').addEventListener('click', closeModal);
$('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

renderChips();
load();