const $ = id => document.getElementById(id);

async function api(url, method, body) {
    const res = await fetch(url, {
        method: method || 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    });
    let data = {};
    try { data = await res.json(); } catch (e) { data = { error: 'Server error (' + res.status + '). Open the site at http://localhost:3000' }; }

    if (res.status === 401 && $('pk-body')) location.href = 'admin-login.html';   // not logged in
    if (!res.ok) throw new Error(data.error || 'Request failed (' + res.status + ')');
    return data;
}

// Show a red message (or green if ok = true) in a message box
function showMsg(id, text, ok) {
    $(id).textContent = text || '';
    $(id).className = ok ? 'alert ok' : 'alert';
    $(id).hidden = !text;
}

// Escape text before putting it inside HTML
function safe(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : text;
    return div.innerHTML.replace(/"/g, '&quot;');
}

function rupees(n) { return '₹' + Number(n).toLocaleString('en-IN'); }


/* =============== LOGIN PAGE =============== */
if ($('login-form')) {

    // already logged in? go to dashboard
    api('/api/admin/check').then(d => { if (d.loggedIn) location.href = 'admin-dashboard.html'; }).catch(() => {});

    // show / hide password
    $('toggle-pw').onclick = function () {
        $('password').type = $('password').type === 'password' ? 'text' : 'password';
    };

    // login
    $('login-form').onsubmit = async function (e) {
        e.preventDefault();
        showMsg('login-error', '');
        try {
            await api('/api/admin/login', 'POST', { username: $('username').value, password: $('password').value });
            location.href = 'admin-dashboard.html';
        } catch (err) {
            showMsg('login-error', err.message);
        }
    };

    // ----- forgot password: step 1 = username, step 2 = answer + new password -----
    let step = 1;

    function openForgot(show) {
        $('login-form').hidden = show;
        $('forgot-form').hidden = !show;
        step = 1;
        $('step1').hidden = false;
        $('step2').hidden = true;
        $('fp-btn').textContent = 'Continue';
        showMsg('forgot-msg', '');
    }

    $('forgot-link').onclick = function (e) { e.preventDefault(); openForgot(true); };
    $('back-login').onclick = function (e) { e.preventDefault(); openForgot(false); };

    $('forgot-form').onsubmit = async function (e) {
        e.preventDefault();
        showMsg('forgot-msg', '');
        const username = $('fp-username').value.trim();

        try {
            if (step === 1) {
                if (!username) throw new Error('Please enter your username');
                const data = await api('/api/admin/forgot/question', 'POST', { username: username });
                $('fp-question').textContent = '❓ ' + data.question;
                $('step1').hidden = true;
                $('step2').hidden = false;
                $('fp-btn').textContent = 'Reset Password';
                step = 2;
            } else {
                if (!$('fp-answer').value.trim()) throw new Error('Please type your answer');
                if ($('fp-new').value.length < 8) throw new Error('New password must be at least 8 characters');
                if ($('fp-new').value !== $('fp-confirm').value) throw new Error('Passwords do not match');

                await api('/api/admin/forgot/reset', 'POST',
                    { username: username, answer: $('fp-answer').value, newPassword: $('fp-new').value });

                openForgot(false);
                $('username').value = username;
                showMsg('login-error', '✅ Password reset. Please log in with your new password.', true);
            }
        } catch (err) {
            showMsg('forgot-msg', err.message);
        }
    };
}


/* =============== DASHBOARD =============== */
if ($('pk-body')) {

    let packages = [];          // all packages
    let deleteId = null;        // package waiting to be deleted
    let uploading = false;      // true while a photo is uploading

    // small message at the bottom of the screen
    function toast(text, isError) {
        $('toast').textContent = text;
        $('toast').className = isError ? 'toast show error' : 'toast show';
        setTimeout(() => { $('toast').className = 'toast'; }, 2500);
    }

    // ----- load data -----
    async function start() {
        const check = await api('/api/admin/check');
        if (!check.loggedIn) { location.href = 'admin-login.html'; return; }

        const me = await api('/api/admin/me');
        $('dash-name').textContent = '👤 ' + me.username;
        $('sq-question').value = me.question;

        loadPackages();
        loadStats();
        loadBookings();
    }

    async function loadStats() {
        const s = await api('/api/admin/stats');
        $('s-total').textContent = s.total;
        $('s-featured').textContent = s.featured;
        $('s-avg').textContent = rupees(s.avgPrice);
        $('s-bookings').textContent = s.bookings;
    }

    async function loadPackages() {
        packages = await api('/api/packages');
        showTable();
    }

    // ----- packages table -----
    function showTable() {
        const search = $('a-search').value.toLowerCase();
        let rows = '';

        packages.forEach(p => {
            const text = (p.name + ' ' + p.destination + ' ' + p.state + ' ' + p.category).toLowerCase();
            if (!text.includes(search)) return;

            rows += `<tr>
                <td>${p.id}</td>
                <td><div class="cell-pk">
                    <img src="${safe(p.image)}" alt="" onerror="this.src='images/taj-mahal.jpg'">
                    <strong>${safe(p.name)}</strong></div></td>
                <td>${safe(p.destination)}<br><small>${safe(p.state)}</small></td>
                <td><span class="badge">${safe(p.category)}</span></td>
                <td>${p.days}D / ${p.nights}N</td>
                <td><strong>${rupees(p.price)}</strong></td>
                <td>${p.featured ? '<span class="badge star">⭐ Featured</span>' : '—'}</td>
                <td><button class="act" data-edit="${p.id}">✏️</button>
                    <button class="act" data-del="${p.id}">🗑️</button></td>
            </tr>`;
        });

        $('pk-body').innerHTML = rows || '<tr><td colspan="8" class="empty">No packages found.</td></tr>';
    }

    $('a-search').oninput = showTable;

    // clicking ✏️ or 🗑️ in the table
    $('pk-body').onclick = function (e) {
        const editBtn = e.target.closest('[data-edit]');
        const delBtn = e.target.closest('[data-del]');

        if (editBtn) {
            openForm(packages.find(p => p.id == editBtn.dataset.edit));
        }
        if (delBtn) {
            const p = packages.find(x => x.id == delBtn.dataset.del);
            deleteId = p.id;
            $('del-text').textContent = '"' + p.name + '" will be permanently removed.';
            $('del-modal').hidden = false;
        }
    };

    // ----- enquiries table -----
   async function loadBookings() {
    const rows = await api('/api/admin/bookings');

    $('bk-empty').hidden = rows.length > 0;

    if (rows.length === 0) {
        $('bk-head').innerHTML = '';
        $('bk-body').innerHTML = '';
        return;
    }

    const columns = Object.keys(rows[0]);

    $('bk-head').innerHTML = '<tr>' +
        columns.map(c => '<th>' + safe(c.replace(/_/g, ' ')) + '</th>').join('') +
        '</tr>';

    $('bk-body').innerHTML = rows.map(r =>
        '<tr>' + columns.map(c => {
            if (c === 'status') {
                return `<td>
                    <select class="booking-status" data-id="${r.id}">
                        <option value="Pending" ${r.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Contacted" ${r.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="Confirmed" ${r.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                    </select>
                </td>`;
            }

            return '<td>' + safe(r[c]) + '</td>';
        }).join('') + '</tr>'
    ).join('');
}

    $('bk-body').addEventListener('change', async function(e) {
        if (!e.target.classList.contains('booking-status')) return;

        const id = e.target.dataset.id;
        const status = e.target.value;

        try {
            await api('/api/admin/bookings/' + id + '/status', 'PUT', {
                status: status
            });

            toast('Enquiry status updated successfully');

        } catch (error) {
            toast(error.message, true);
            loadBookings();
        }
    });

    // ----- photo preview -----
    function showPhoto(path) {
        $('img-preview').hidden = !path;
        $('upload-text').hidden = !!path;
        $('clear-img').hidden = !path;
        if (path) $('img-preview').src = path;
    }

    function photoStatus(text, isError) {
        $('upload-status').textContent = text;
        $('upload-status').className = isError ? 'hint err' : 'hint';
    }

    // shrink the chosen photo (max 1280px wide) and turn it into JPEG text
    function shrinkPhoto(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = function () {
                const scale = Math.min(1, 1280 / img.width);
                const canvas = document.createElement('canvas');
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.onerror = () => reject(new Error('Could not read that image'));
            img.src = URL.createObjectURL(file);
        });
    }

    // when a photo is chosen: shrink it, upload it, remember its path
    $('f-file').onchange = async function () {
        const file = $('f-file').files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { photoStatus('Please choose an image file', true); return; }

        uploading = true;
        photoStatus('Uploading...');
        try {
            const data = await shrinkPhoto(file);
            const result = await api('/api/admin/upload', 'POST', { data: data });
            $('f-image').value = result.path;
            showPhoto(result.path);
            photoStatus('✅ Photo uploaded');
        } catch (err) {
            photoStatus(err.message, true);
        }
        uploading = false;
        $('f-file').value = '';
    };

    $('upload-box').onclick = () => $('f-file').click();
    $('pick-img').onclick = () => $('f-file').click();
    $('clear-img').onclick = function () { $('f-image').value = ''; showPhoto(''); photoStatus(''); };

    // ----- add / edit form -----
    const fields = ['name', 'destination', 'state', 'category', 'days', 'price', 'image', 'description', 'highlights'];

    function openForm(p) {            // p = package to edit, or nothing for a new one
        $('form-title').textContent = p ? 'Edit Package' : 'Add Package';
        $('f-id').value = p ? p.id : '';

        fields.forEach(name => {
            $('f-' + name).value = p ? p[name] : '';
        });
        if (!p) $('f-category').value = 'Nature';

        $('f-featured').checked = p ? !!p.featured : false;
        showPhoto($('f-image').value);
        photoStatus('');
        showMsg('form-error', '');
        $('form-modal').hidden = false;
    }

    $('add-btn').onclick = () => openForm();

    $('pk-form').onsubmit = async function (e) {
        e.preventDefault();
        if (uploading) { showMsg('form-error', 'Please wait, the photo is still uploading'); return; }

        const body = { featured: $('f-featured').checked };
        fields.forEach(name => { body[name] = $('f-' + name).value; });

        const id = $('f-id').value;
        try {
            if (id) await api('/api/admin/packages/' + id, 'PUT', body);
            else await api('/api/admin/packages', 'POST', body);

            $('form-modal').hidden = true;
            toast(id ? '✅ Package updated' : '✅ Package added');
            loadPackages();
            loadStats();
        } catch (err) {
            showMsg('form-error', err.message);
        }
    };

    // ----- delete -----
    $('del-confirm').onclick = async function () {
        try {
            await api('/api/admin/packages/' + deleteId, 'DELETE');
            $('del-modal').hidden = true;
            toast('🗑️ Package deleted');
            loadPackages();
            loadStats();
        } catch (err) {
            toast(err.message, true);
        }
    };

    // ----- settings: change password -----
    $('pw-form').onsubmit = async function (e) {
        e.preventDefault();
        const newPassword = $('cp-new').value;

        if (newPassword.length < 8) { showMsg('pw-msg', 'New password must be at least 8 characters'); return; }
        if (newPassword !== $('cp-confirm').value) { showMsg('pw-msg', 'New passwords do not match'); return; }

        try {
            await api('/api/admin/change-password', 'POST', { currentPassword: $('cp-current').value, newPassword: newPassword });
            $('pw-form').reset();
            showMsg('pw-msg', '✅ Password updated', true);
        } catch (err) {
            showMsg('pw-msg', err.message);
        }
    };

    // ----- settings: recovery question -----
    $('sq-form').onsubmit = async function (e) {
        e.preventDefault();
        try {
            await api('/api/admin/security', 'POST',
                { currentPassword: $('sq-current').value, question: $('sq-question').value, answer: $('sq-answer').value });
            $('sq-answer').value = '';
            $('sq-current').value = '';
            showMsg('sq-msg', '✅ Recovery question saved', true);
        } catch (err) {
            showMsg('sq-msg', err.message);
        }
    };

    // ----- tabs -----
    document.querySelectorAll('.tab').forEach(tab => {
        tab.onclick = function () {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.panel').forEach(p => { p.hidden = (p.id !== 'tab-' + tab.dataset.tab); });
        };
    });

    // ----- close popups (Cancel / X buttons, click outside, Esc key) -----
    function closePopups() {
        $('form-modal').hidden = true;
        $('del-modal').hidden = true;
    }
    document.querySelectorAll('[data-close]').forEach(b => { b.onclick = closePopups; });
    document.querySelectorAll('.modal').forEach(m => { m.onclick = e => { if (e.target === m) closePopups(); }; });
    document.onkeydown = e => { if (e.key === 'Escape') closePopups(); };

    // ----- logout -----
    $('logout').onclick = async function () {
        await api('/api/admin/logout', 'POST');
        location.href = 'admin-login.html';
    };

    start();
}