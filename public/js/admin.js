const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = n => '₹' + Number(n).toLocaleString('en-IN');

async function api(url, method = 'GET', body) {
    const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({ error: `Server error (${res.status}). Open it via http://localhost:3000 and check the terminal.` }));
    if (res.status === 401 && $('pk-body')) { location.href = 'admin-login.html'; }
    if (!res.ok) throw new Error(data.error || ('Request failed (HTTP ' + res.status + ')'));
    return data;
}

/* ================= LOGIN PAGE ================= */
if ($('login-form')) {
    api('/api/admin/check').then(d => { if (d.loggedIn) location.href = 'admin-dashboard.html'; }).catch(() => {});

    $('toggle-pw').addEventListener('click', () => {
        $('password').type = $('password').type === 'password' ? 'text' : 'password';
    });

    $('login-form').addEventListener('submit', async e => {
        e.preventDefault();
        const btn = $('login-btn'); btn.textContent = 'Logging in...'; btn.disabled = true;
        $('login-error').hidden = true;
        try {
            await api('/api/admin/login', 'POST', { username: $('username').value.trim(), password: $('password').value });
            location.href = 'admin-dashboard.html';
        } catch (err) {
            $('login-error').textContent = err.message; $('login-error').hidden = false;
            btn.textContent = 'Login'; btn.disabled = false;
        }
    });
}

/* ================= DASHBOARD ================= */
if ($('pk-body')) {
    let packages = [], deleteId = null, toastTimer;

    const toast = (msg, error) => {
        const t = $('toast'); t.textContent = msg; t.className = 'toast show' + (error ? ' error' : '');
        clearTimeout(toastTimer); toastTimer = setTimeout(() => t.className = 'toast', 2800);
    };

    async function init() {
        try {
            const c = await api('/api/admin/check');
            if (!c.loggedIn) return (location.href = 'admin-login.html');
        } catch { return (location.href = 'admin-login.html'); }
        await Promise.all([loadPackages(), loadStats(), loadBookings()]);
    }

    async function loadStats() {
        const s = await api('/api/admin/stats');
        $('s-total').textContent = s.total; $('s-featured').textContent = s.featured;
        $('s-avg').textContent = inr(s.avgPrice); $('s-bookings').textContent = s.bookings;
    }

    async function loadPackages() {
        packages = await api('/api/packages');
        $('places').innerHTML = [...new Set(packages.map(p => p.destination))].map(d => `<option value="${esc(d)}">`).join('');
        renderTable();
    }

    function renderTable() {
        const q = $('a-search').value.toLowerCase().trim();
        const list = packages.filter(p => !q || `${p.name} ${p.destination} ${p.state} ${p.category}`.toLowerCase().includes(q));
        $('pk-body').innerHTML = list.length ? list.map(p => `
            <tr>
                <td>${p.id}</td>
                <td><div class="cell-pk"><img src="${esc(p.image)}" alt="" onerror="this.onerror=null;this.src='images/taj-mahal.jpg'"><strong>${esc(p.name)}</strong></div></td>
                <td>${esc(p.destination)}<br><small>${esc(p.state)}</small></td>
                <td><span class="badge">${esc(p.category)}</span></td>
                <td>${p.days}D / ${p.nights}N</td>
                <td><strong>${inr(p.price)}</strong></td>
                <td>${p.featured ? '<span class="badge star">⭐ Featured</span>' : '—'}</td>
                <td><button class="act" title="Edit" data-edit="${p.id}">✏️</button>
                    <button class="act" title="Delete" data-del="${p.id}">🗑️</button></td>
            </tr>`).join('') : `<tr><td colspan="8" class="empty">No packages found.</td></tr>`;
    }

    async function loadBookings() {
        const rows = await api('/api/admin/bookings');
        $('bk-empty').hidden = rows.length > 0;
        if (!rows.length) { $('bk-head').innerHTML = ''; $('bk-body').innerHTML = ''; return; }
        const cols = Object.keys(rows[0]);
        $('bk-head').innerHTML = '<tr>' + cols.map(c => `<th>${esc(c.replace(/_/g, ' '))}</th>`).join('') + '</tr>';
        $('bk-body').innerHTML = rows.map(r => '<tr>' + cols.map(c => `<td>${esc(r[c])}</td>`).join('') + '</tr>').join('');
    }

    const F = ['name', 'destination', 'state', 'category', 'days', 'price', 'image', 'description', 'highlights'];

    function openForm(p) {
        $('form-title').textContent = p ? 'Edit Package' : 'Add Package';
        $('f-id').value = p ? p.id : '';
        F.forEach(k => $('f-' + k).value = p ? (p[k] ?? '') : (k === 'category' ? 'Nature' : ''));
        $('f-featured').checked = p ? !!p.featured : false;
        $('form-error').hidden = true;
        $('form-modal').hidden = false;
        $('f-name').focus();
    }

    $('add-btn').addEventListener('click', () => openForm());

    $('pk-form').addEventListener('submit', async e => {
        e.preventDefault();
        const body = {}; F.forEach(k => body[k] = $('f-' + k).value);
        body.featured = $('f-featured').checked;
        const id = $('f-id').value;
        try {
            await api(id ? `/api/admin/packages/${id}` : '/api/admin/packages', id ? 'PUT' : 'POST', body);
            $('form-modal').hidden = true;
            toast(id ? '✅ Package updated' : '✅ Package added');
            await Promise.all([loadPackages(), loadStats()]);
        } catch (err) { $('form-error').textContent = err.message; $('form-error').hidden = false; }
    });

    $('pk-body').addEventListener('click', e => {
        const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
        if (ed) openForm(packages.find(p => p.id == ed.dataset.edit));
        if (del) {
            const p = packages.find(x => x.id == del.dataset.del); deleteId = p.id;
            $('del-text').textContent = `"${p.name}" will be permanently removed.`;
            $('del-modal').hidden = false;
        }
    });

    $('del-confirm').addEventListener('click', async () => {
        try {
            await api(`/api/admin/packages/${deleteId}`, 'DELETE');
            $('del-modal').hidden = true; toast('🗑️ Package deleted');
            await Promise.all([loadPackages(), loadStats()]);
        } catch (err) { toast(err.message, true); }
    });

    $('a-search').addEventListener('input', renderTable);
    document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => {
        $('form-modal').hidden = true; $('del-modal').hidden = true;
    }));
    document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.hidden = true; }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.modal').forEach(m => m.hidden = true); });

    document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
        $('tab-packages').hidden = t.dataset.tab !== 'packages';
        $('tab-bookings').hidden = t.dataset.tab !== 'bookings';
    }));

    $('logout').addEventListener('click', async () => {
        await api('/api/admin/logout', 'POST').catch(() => {});
        location.href = 'admin-login.html';
    });

    init();
}