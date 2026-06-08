/**
 * all owner.js
 * FIX: restaurant IDs are now MongoDB ObjectId strings, not numeric.
 * FIX: order actions use o._id instead of o.id.
 * FIX: getCurrentRestaurantId() reads from OwnerMapping which now returns ObjectIds.
 */

const API_ROOT = '/api';

// Restaurant IDs are fetched at runtime from /api/owner-mappings — never hardcoded.
// This ensures the app keeps working after any DB re-seed.

function getToken() {
    return localStorage.getItem('token') || '';
}

function authHeaders() {
    return {
        'Content-Type' : 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

function confirmLogout(event) {
    if (event) event.preventDefault();
    window.location.href = '/logout-confirm';
}

function getCurrentOwner() {
    const username = localStorage.getItem('ownerUsername');
    if (!username) return null;
    return { username, isAuthenticated: true };
}

function isOwnerAuthenticated() { return getCurrentOwner() !== null; }

async function apiGet(path) {
    const r = await fetch(`${API_ROOT}${path}`, { headers: authHeaders() });
    if (!r.ok) throw new Error(`GET ${path} failed`);
    return r.json();
}

async function apiPost(path, body) {
    const r = await fetch(`${API_ROOT}${path}`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body)
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || `POST ${path} failed`); }
    return r.json();
}

async function apiPut(path, body) {
    const r = await fetch(`${API_ROOT}${path}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(body)
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || `PUT ${path} failed`); }
    return r.json();
}

async function apiPatch(path, body) {
    const r = await fetch(`${API_ROOT}${path}`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body)
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || `PATCH ${path} failed`); }
    return r.json();
}

async function apiDelete(path, body = null) {
    const opts = { method: 'DELETE', headers: authHeaders() };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(`${API_ROOT}${path}`, opts);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || `DELETE ${path} failed`); }
    return r.json();
}

async function getCurrentRestaurantId() {
    const owner = getCurrentOwner();
    if (!owner) return null;

    // Always fetch from owner-mappings API — hardcoded IDs break on any DB re-seed
    try {
        const mappings = await apiGet('/owner-mappings');
        const mapping  = Array.isArray(mappings)
            ? mappings.find(m => m.email === owner.username.toLowerCase())
            : null;
        if (mapping && mapping.restaurantIds && mapping.restaurantIds.length) {
            return String(mapping.restaurantIds[0]);
        }
    } catch (_) {}

    return null;
}

async function getRestaurantData(restaurantId) {
    if (!restaurantId) return null;
    return await apiGet(`/restaurants/${restaurantId}`);
}

function flattenMenu(restaurant) {
    if (!restaurant || !Array.isArray(restaurant.categories)) return [];
    return restaurant.categories.flatMap(cat =>
        (cat.items || []).map(item => ({ ...item, category: cat.name || 'Uncategorized' }))
    );
}

async function displayRestaurantOptions() {
    const el    = document.getElementById('restaurantName');
    const owner = getCurrentOwner();
    if (!el) return;
    if (!owner) { el.textContent = 'Please login first'; return; }
    const id = await getCurrentRestaurantId();
    if (!id)   { el.textContent = 'Restaurant not assigned'; return; }
    try {
        const r = await getRestaurantData(id);
        el.textContent = r.name || owner.restaurantName;
    } catch (_) {
        el.textContent = owner.restaurantName || 'Restaurant';
    }
}

function encodeItemId(category, name) {
    return encodeURIComponent(category || 'Uncategorized') + '|' + encodeURIComponent(name);
}

function decodeItemId(itemId) {
    const [category, name] = itemId.split('|').map(decodeURIComponent);
    return { category, name };
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, m =>
        ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m])
    );
}

async function addItem() {
    const name         = document.getElementById('itemName')?.value?.trim();
    const price        = document.getElementById('itemPrice')?.value?.trim();
    const category     = document.getElementById('itemCategory')?.value?.trim() || 'Uncategorized';
    const imageInput   = document.getElementById('itemImage');
    const restaurantId = await getCurrentRestaurantId();

    if (!name || !price || !restaurantId) {
        alert('Please fill in all required fields and ensure your restaurant is assigned.');
        return;
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) { alert('Please enter a valid price'); return; }
    if (!isOwnerAuthenticated()) { alert('You must be logged in as an owner'); return; }

    // FIX: upload image via multipart (Multer) instead of storing raw base64 in MongoDB
    let imageUrl = '';
    if (imageInput?.files?.[0]) {
        try {
            const formData = new FormData();
            formData.append('image', imageInput.files[0]);
            const uploadRes = await fetch('/api/restaurants/upload', {
                method : 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}` },
                body   : formData   // Do NOT set Content-Type — browser handles multipart boundary
            });
            if (!uploadRes.ok) {
                const err = await uploadRes.json().catch(() => ({}));
                throw new Error(err.error || 'Image upload failed.');
            }
            const { url } = await uploadRes.json();
            imageUrl = url;
        } catch (uploadErr) {
            alert(uploadErr.message || 'Image upload failed. Item will be saved without image.');
        }
    }

    try {
        await apiPost(`/restaurants/${restaurantId}/items`, { category, name, price: parseFloat(price), image: imageUrl });
        document.getElementById('itemName').value     = '';
        document.getElementById('itemPrice').value    = '';
        document.getElementById('itemCategory').value = '';
        if (document.getElementById('itemImage')) document.getElementById('itemImage').value = '';
        const preview = document.getElementById('imagePreview');
        if (preview) { preview.style.backgroundImage = ''; preview.classList.remove('has-image'); }
        await displayMenu();
    } catch (err) { alert(err.message || 'Failed to add item.'); }
}

async function editItem(itemId) {
    const restaurantId = await getCurrentRestaurantId();
    if (!restaurantId || !isOwnerAuthenticated()) return;
    const { category, name } = decodeItemId(itemId);
    const newName = prompt('Edit item name:', name);
    if (!newName?.trim()) return;
    const newPrice = prompt('Edit item price:', '');
    if (!newPrice?.trim() || isNaN(parseFloat(newPrice)) || parseFloat(newPrice) < 0) {
        alert('Please enter a valid price'); return;
    }
    const newCategory = prompt('Edit category:', category || 'Uncategorized');
    try {
        await apiPut(`/restaurants/${restaurantId}/items`, {
            category     : category,
            originalName : name,
            name         : newName.trim(),
            price        : parseFloat(newPrice),
            newCategory  : newCategory || category
        });
        await displayMenu();
    } catch (err) { alert(err.message || 'Failed to update item.'); }
}

async function displayMenu() {
    const list = document.getElementById('menuList');
    if (!list) return;
    const restaurantId = await getCurrentRestaurantId();
    if (!restaurantId) {
        list.innerHTML = '<li style="text-align:center;color:var(--text-secondary);">Please login as an owner or assign a restaurant.</li>';
        return;
    }
    try {
        const restaurant = await getRestaurantData(restaurantId);
        const menu       = flattenMenu(restaurant);
        if (!menu.length) {
            list.innerHTML = '<li style="text-align:center;color:var(--text-secondary);">No items yet. Add your first item!</li>';
            return;
        }
        list.innerHTML = '';
        menu.forEach(item => {
            const itemId    = encodeItemId(item.category, item.name);
           const imageHtml = item.image
          ? `<img src="/${item.image}" alt="${escapeHtml(item.name)}" class="item-image">`
                : `<div class="item-image" style="background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">🍽</div>`;
            list.innerHTML += `
                <li>
                    <div class="item-info">${imageHtml}
                        <div class="item-details">
                            <div class="item-name">${escapeHtml(item.name)}</div>
                            <div class="item-meta">${escapeHtml(item.category || 'Uncategorized')}</div>
                        </div>
                    </div>
                    <div class="item-price">EGP ${parseFloat(item.price || 0).toFixed(2)}</div>
                    <div class="actions">
                        <button class="edit"   onclick="editItem('${itemId}')">Edit</button>
                        <button class="delete" onclick="removeItem('${itemId}')">Delete</button>
                    </div>
                </li>`;
        });
    } catch (err) {
        list.innerHTML = '<li style="text-align:center;color:var(--text-secondary);">Unable to load menu.</li>';
    }
}

async function removeItem(itemId) {
    if (!confirm('Delete this item?')) return;
    const restaurantId = await getCurrentRestaurantId();
    if (!restaurantId || !isOwnerAuthenticated()) return;
    const { category, name } = decodeItemId(itemId);
    try {
        await apiDelete(`/restaurants/${restaurantId}/items`, { category, name });
        await displayMenu();
    } catch (err) { alert('Failed to remove item.'); }
}

function setupImagePreview() {
    const input = document.getElementById('itemImage');
    if (!input) return;
    input.addEventListener('change', function () {
        const preview = document.getElementById('imagePreview');
        if (preview && this.files?.[0]) {
            const reader = new FileReader();
            reader.onload = e => {
                preview.style.backgroundImage = `url('${e.target.result}')`;
                preview.classList.add('has-image');
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
}

async function displayOrders() {
    const list = document.getElementById('ordersList');
    if (!list) return;
    const restaurantId = await getCurrentRestaurantId();
    if (!restaurantId) {
        list.innerHTML = '<li style="text-align:center;padding:24px;">Please login as an owner to see your orders.</li>';
        return;
    }
    try {
        const orders = await apiGet(`/orders?restaurantId=${restaurantId}`);
        if (!orders.length) {
            list.innerHTML = '<li style="text-align:center;padding:24px;">No orders yet</li>';
            return;
        }
        list.innerHTML = '';
        orders.forEach(o => {
            const desc = Array.isArray(o.items)
                ? o.items.map(i => `${i.name} x${i.quantity || i.qty || 1}`).join(', ')
                : '';
            let actionBtn = '', statusClass = '';

            // FIX: use o._id (MongoDB ObjectId) instead of o.id
            if (o.status === 'Pending') {
                statusClass = 'pending';
                actionBtn   = `<button onclick="acceptOrder('${o._id}')">Accept Order</button>`;
            } else if (o.status === 'Preparing') {
                statusClass = 'preparing';
                actionBtn   = `<button onclick="completeOrder('${o._id}')">Mark Ready</button>`;
            } else {
                statusClass = 'ready';
                actionBtn   = `<span class="order-status ${statusClass}">${o.status}</span>`;
            }

            list.innerHTML += `
                <li>
                    <div class="order-header">Order #${o._id}</div>
                    <div style="margin-bottom:12px;color:var(--text-secondary);">${escapeHtml(desc)}</div>
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                        <span class="order-status ${statusClass}">${o.status}</span>
                        ${actionBtn}
                    </div>
                </li>`;
        });
    } catch (err) {
        list.innerHTML = '<li style="text-align:center;padding:24px;">Unable to load orders.</li>';
    }
}

async function acceptOrder(id) {
    try { await apiPatch(`/orders/${id}`, { status: 'Preparing' }); await displayOrders(); await updateDashboard(); }
    catch (err) { alert('Failed to accept order.'); }
}

async function completeOrder(id) {
    try { await apiPatch(`/orders/${id}`, { status: 'Ready' }); await displayOrders(); await updateDashboard(); }
    catch (err) { alert('Failed to complete order.'); }
}

async function updateDashboard() {
    const restaurantId = await getCurrentRestaurantId();
    if (!restaurantId) return;
    try {
        const orders  = await apiGet(`/orders?restaurantId=${restaurantId}`);
        const total   = orders.length;
        const pending = orders.filter(o => o.status === 'Pending').length;
        const ready   = orders.filter(o => o.status === 'Ready').length;
        if (document.getElementById('totalOrders'))     document.getElementById('totalOrders').innerText     = total;
        if (document.getElementById('pendingOrders'))   document.getElementById('pendingOrders').innerText   = pending;
        if (document.getElementById('completedOrders')) document.getElementById('completedOrders').innerText = ready;
    } catch (_) {}
}

document.addEventListener('DOMContentLoaded', async function () {
    setupImagePreview();
    await displayRestaurantOptions();
    await displayMenu();
    await displayOrders();
    await updateDashboard();
});