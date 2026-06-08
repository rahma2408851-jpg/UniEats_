/**
 * admin.js
 *
 * BUG FIXED:
 *  - All API calls now send the Authorization header with the stored JWT.
 *    Previously every admin request returned 401 because the header was missing.
 */

const API_ROOT = '/api';

function getToken() {
    return localStorage.getItem('token') || '';
}

function authHeaders(extra = {}) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
        ...extra
    };
}

function confirmLogout(event) {
    if (event) event.preventDefault();
    window.location.href = '/logout-confirm';
}

function getCurrentUser() {
    return {
        role : localStorage.getItem('userRole')  || null,
        email: localStorage.getItem('userEmail') || null
    };
}

async function apiGet(path) {
    const response = await fetch(`${API_ROOT}${path}`, {
        headers: authHeaders()
    });
    if (!response.ok) throw new Error(`GET ${path} failed (${response.status})`);
    return response.json();
}

async function apiPost(path, body) {
    const response = await fetch(`${API_ROOT}${path}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `POST ${path} failed`);
    }
    return response.json();
}

async function apiDelete(path, body = null) {
    const options = { method: 'DELETE', headers: authHeaders() };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(`${API_ROOT}${path}`, options);
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `DELETE ${path} failed`);
    }
    return response.json();
}

async function apiPatch(path, body) {
    const response = await fetch(`${API_ROOT}${path}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `PATCH ${path} failed`);
    }
    return response.json();
}

async function loadDashboard() {
    try {
        const [restaurants, users, orders] = await Promise.all([
            apiGet('/restaurants'),
            apiGet('/users'),
            apiGet('/orders')
        ]);
        const counts = {
            resCount  : (Array.isArray(restaurants) ? restaurants : (restaurants.data || [])).length,
            userCount : (Array.isArray(users) ? users : (users.users || [])).length,
            orderCount: (Array.isArray(orders) ? orders : (orders.orders || [])).length
        };
        Object.entries(counts).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        });
    } catch (err) {
        console.error('Could not load dashboard data:', err);
    }
}

async function displayAllOrders() {
    try {
        const orders = await apiGet('/orders');
        // Feed the new styled all-orders page if its hook is present
        if (typeof window._aoHook === 'function') {
            window._aoHook(orders);
            return;
        }
        // Legacy fallback
        const tableBody = document.querySelector('#all-orders-table tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3">No orders found.</td></tr>';
            return;
        }
        orders.forEach(order => {
            const row = document.createElement('tr');
            let action = '';
            if (order.status === 'Pending') {
                action = `<button onclick="updateOrderStatus('${order._id}', 'Preparing')">Mark Preparing</button>`;
            } else if (order.status === 'Preparing') {
                action = `<button onclick="updateOrderStatus('${order._id}', 'Ready')">Mark Ready</button>`;
            } else {
                action = `<span class="order-status">${order.status}</span>`;
            }
            row.innerHTML = `
                <td>…${String(order._id).slice(-8)}</td>
                <td class="status">${order.status}</td>
                <td>${action}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (err) {
        console.error('Could not load orders:', err);
    }
}

async function updateOrderStatus(id, status) {
    try {
        await apiPatch(`/orders/${id}`, { status });
        await displayAllOrders();
        await loadDashboard();
    } catch (err) {
        console.error('Could not update order status:', err);
        alert('Failed to update order status.');
    }
}

async function displayUsers() {
    const usersList = document.getElementById('users');
    if (!usersList) return;
    try {
        const users = await apiGet('/users');
        if (!users.length) {
            usersList.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);">No users registered yet.</div>';
            return;
        }
        // Use card renderer if the new mange-users page loaded it
        if (typeof window.renderUserCards === 'function') {
            window._muAllUsers = users;
            window.renderUserCards(users);
            return;
        }
        // Legacy list fallback
        usersList.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            li.innerHTML = `${user.name || user.email} (${user.role || 'student'}) <button onclick="deleteUser('${user._id}')">Remove</button>`;
            usersList.appendChild(li);
        });
    } catch (err) {
        console.error('Could not load users:', err);
        usersList.innerHTML = '<div style="padding:20px;color:var(--text-secondary);">Unable to load users.</div>';
    }
}

async function deleteUser(id) {
    if (!confirm('Delete this user?')) return;
    try {
        await apiDelete(`/users/${id}`);
        await displayUsers();
        await loadDashboard();
    } catch (err) {
        console.error('Could not delete user:', err);
        alert('Failed to delete user.');
    }
}

async function displayRestaurants() {
    const tableBody = document.querySelector('#restaurantsTableBody') || document.querySelector('#restaurants-table tbody');
    if (!tableBody) return;
    try {
       const raw = await apiGet('/restaurants');
        const restaurants = Array.isArray(raw) ? raw : (raw.data || []);
        tableBody.innerHTML = '';
        if (!restaurants.length) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-secondary);">No restaurants found.</td></tr>';
            return;
        }
        restaurants.forEach(restaurant => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="mr-name">${restaurant.name}</td>
                <td class="mr-desc">${restaurant.description || '—'}</td>
                <td class="mr-id">…${String(restaurant._id).slice(-8)}</td>
                <td><button class="mr-delete-btn" onclick="deleteRestaurant('${restaurant._id}')">Delete</button></td>
            `;
            tableBody.appendChild(row);
        });
    } catch (err) {
        console.error('Could not load restaurants:', err);
    }
}

async function deleteRestaurant(id) {
    if (!confirm('Delete this restaurant?')) return;
    try {
        await apiDelete(`/restaurants/${id}`);
        await displayRestaurants();
        await loadDashboard();
    } catch (err) {
        console.error('Could not delete restaurant:', err);
        alert('Failed to delete restaurant.');
    }
}

async function populateRestaurantsSelect() {
    const sel = document.getElementById('restaurantsSelect');
    if (!sel) return;
    try {
        const raw = await apiGet('/restaurants');
        const restaurants = Array.isArray(raw) ? raw : (raw.data || []);
        sel.innerHTML = '';
        restaurants.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r._id;
            opt.textContent = `${r.name} (ID:${r._id})`;
            sel.appendChild(opt);
        });
    } catch (err) {
        console.error('Could not load restaurants for owner mapping:', err);
    }
}

async function getOwnerMappings() {
    try { return await apiGet('/owner-mappings'); }
    catch (err) { console.error('Could not load owner mappings:', err); return {}; }
}

async function renderOwnerMappings() {
    const table = document.querySelector('#ownerMappingsTable tbody');
    if (!table) return;
    const mappings = await getOwnerMappings();
    table.innerHTML = '';
    const query = (document.getElementById('ownerSearch')?.value || '').trim().toLowerCase();
    // API returns an array of { email, restaurantIds } documents
    const list = Array.isArray(mappings) ? mappings : [];
    if (list.length === 0) {
        table.innerHTML = '<tr><td colspan="3">No owner mappings yet.</td></tr>';
        return;
    }
    for (const mapping of list) {
        const email = mapping.email;
        const ids   = mapping.restaurantIds || [];
        if (query && !email.toLowerCase().includes(query)) continue;
        const tr = document.createElement('tr');
        const idsText = ids.join(', ');
        tr.innerHTML = `<td>${email}</td><td>${idsText}</td><td>
            <button onclick="editOwner('${email}')">Edit</button>
            <button onclick="removeOwner('${email}')">Remove</button>
        </td>`;
        table.appendChild(tr);
    }
}

let editingOwnerEmail = null;

async function assignOwner() {
    const emailEl = document.getElementById('ownerEmail');
    const sel     = document.getElementById('restaurantsSelect');
    if (!emailEl || !sel) return;
    const email    = emailEl.value.trim().toLowerCase();
    if (!email) { alert('Enter owner email'); return; }
    const selected = Array.from(sel.selectedOptions).map(o => o.value); // ObjectIds must stay as strings
    if (selected.length === 0) { alert('Select at least one restaurant'); return; }
    try {
        await apiPost('/owner-mappings', { email, restaurantIds: selected });
        await renderOwnerMappings();
        emailEl.value    = '';
        sel.selectedIndex = -1;
        editingOwnerEmail = null;
        const btn = document.querySelector('button[onclick="assignOwner()"]');
        if (btn) btn.textContent = 'Assign';
        alert('Assigned successfully');
    } catch (err) {
        alert(err.message || 'Assignment failed.');
    }
}

async function removeOwner(email) {
    if (!confirm('Remove owner mapping for ' + email + '?')) return;
    try {
        await apiDelete(`/owner-mappings/${encodeURIComponent(email)}`);
        await renderOwnerMappings();
    } catch (err) {
        alert('Failed to remove owner mapping.');
    }
}

async function editOwner(email) {
    try {
        const mappings = await getOwnerMappings();
        const entry    = Array.isArray(mappings) ? mappings.find(m => m.email === email) : null;
        if (!entry) return;
        const ids    = Array.isArray(entry.restaurantIds) ? entry.restaurantIds : [];
        const emailEl = document.getElementById('ownerEmail');
        const sel    = document.getElementById('restaurantsSelect');
        if (!emailEl || !sel) return;
        emailEl.value = email;
        Array.from(sel.options).forEach(o => { o.selected = ids.map(String).includes(String(o.value)); });
        const btn = document.querySelector('button[onclick="assignOwner()"]');
        if (btn) btn.textContent = 'Save';
        editingOwnerEmail = email;
    } catch (err) {
        console.error('Could not load owner mapping for edit:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    if (body.querySelector('#resCount'))            loadDashboard();
    if (body.querySelector('#all-orders-table') || body.querySelector('#all-orders-body'))    displayAllOrders();
    if (body.querySelector('#users'))               displayUsers();
    if (body.querySelector('#restaurants-table') || body.querySelector('#restaurantsTableBody'))   displayRestaurants();
    if (body.querySelector('#restaurantsSelect'))   populateRestaurantsSelect();
    if (body.querySelector('#ownerMappingsTable'))  renderOwnerMappings();

    const search = document.getElementById('ownerSearch');
    if (search) search.addEventListener('input', renderOwnerMappings);
});