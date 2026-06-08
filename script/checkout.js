function get(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function set(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function getCart() { return JSON.parse(localStorage.getItem("cart")) || []; }
function clearCart() { localStorage.removeItem("cart"); }
function formatPrice(value) { return `EGP ${parseFloat(value).toFixed(2)}`; }

function confirmLogout(event) {
    if (event) event.preventDefault();
    window.location.href = '/logout-confirm';
}

function createToastContainer() {
    let c = document.getElementById("toast-container");
    if (!c) { c = document.createElement("div"); c.id = "toast-container"; document.body.appendChild(c); }
    return c;
}

function showToast(message, type = "success") {
    const c = createToastContainer();
    const t = document.createElement("div");
    t.className = `toast-message ${type}`;
    t.textContent = message;
    c.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 250); }, 2200);
}

/* ── Pickup time selection ── */
let selectedPickup = "asap";

function selectPickup(el) {
    document.querySelectorAll(".pickup-chip").forEach(c => c.classList.remove("selected"));
    el.classList.add("selected");
    selectedPickup = el.dataset.value;
    const customWrap = document.getElementById("custom-time-wrap");
    if (selectedPickup === "custom") {
        customWrap.classList.add("visible");
    } else {
        customWrap.classList.remove("visible");
    }
}

function resolvePickupTime() {
    if (selectedPickup === "asap") return null;
    if (selectedPickup === "custom") {
        const val = document.getElementById("custom-time").value;
        if (!val) return null;
        // Convert HH:MM to a full ISO string today
        const [h, m] = val.split(":").map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d.toISOString();
    }
    const mins = parseInt(selectedPickup, 10);
    const d = new Date(Date.now() + mins * 60 * 1000);
    return d.toISOString();
}

function formatPickupLabel(isoString) {
    if (!isoString) return "As soon as possible";
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ── Loyalty ── */
async function loadLoyalty() {
    const email = localStorage.getItem("userEmail");
    if (!email || email === "guest") return;
    try {
        const res  = await fetch(`/api/users/loyalty/${encodeURIComponent(email)}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
        });
        if (!res.ok) return;
        const data = await res.json();

        const banner = document.getElementById("loyalty-banner");
        const balEl  = document.getElementById("loyalty-balance");
        if (banner && balEl) {
            balEl.textContent = data.loyaltyPoints.toLocaleString() + " pts";
            banner.style.display = "flex";
        }
    } catch (_) {}
}

function updateEarnPreview() {
    const cart     = getCart();
    const subtotal = cart.reduce((s, i) => s + parseFloat(i.price) * (i.quantity || i.qty || 1), 0);
    const tax      = subtotal * 0.05;
    const total    = subtotal + tax;
    const earn     = Math.max(1, Math.round(total));
    const el       = document.getElementById("loyalty-earn-preview");
    if (el) el.textContent = `+${earn} pts`;
}

/* ── Cart render ── */
function renderCart() {
    const orderList    = document.getElementById("orderList");
    const totalElement = document.getElementById("total");
    const cart         = getCart();

    if (!orderList || !totalElement) return;

    orderList.innerHTML = "";

    if (cart.length === 0) {
        orderList.innerHTML = "<li>Your cart is empty.</li>";
        totalElement.textContent = "EGP 0.00";
        return;
    }

    let subtotal = 0;
    cart.forEach(item => {
        const qty       = item.quantity || item.qty || 1;
        const lineTotal = parseFloat(item.price) * qty;
        subtotal += lineTotal;
        orderList.innerHTML += `<li>${item.name} x${qty} — ${formatPrice(lineTotal)}</li>`;
    });

    const tax   = subtotal * 0.05;
    const total = subtotal + tax;
    totalElement.textContent = formatPrice(total);
    updateEarnPreview();
}

/* ── Place order ── */
async function placeOrder() {
    const cart = getCart();
    if (cart.length === 0) { showToast("Your cart is empty.", "info"); return; }

    const token = localStorage.getItem("token") || "";
    if (!token) {
        showToast("Please log in to place an order.", "danger");
        setTimeout(() => window.location.href = "/login", 1200);
        return;
    }

    const subtotal   = cart.reduce((s, i) => s + parseFloat(i.price) * (i.quantity || i.qty || 1), 0);
    const tax        = subtotal * 0.05;
    const total      = subtotal + tax;
    const comment    = document.getElementById("orderComment").value.trim();
    const pickupTime = resolvePickupTime();
    const restaurantId = cart[0]?.restaurantId || null;

    const order = {
        items: cart,
        total: parseFloat(total.toFixed(2)),
        status: "Pending",
        comment,
        email: localStorage.getItem("userEmail") || "guest",
        restaurantId,
        ...(pickupTime ? { pickupTime } : {})
    };

    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(order)
        });

        if (!response.ok) {
            const err = await response.json();
            showToast(err.error || "Could not place order.", "danger");
            return;
        }

        const created = await response.json();
        localStorage.setItem("lastOrderId", created._id);
        clearCart();
        showToast("Order placed. Redirecting to tracking…", "success");
        setTimeout(() => window.location.href = "/order-tracking", 900);
    } catch (_) {
        showToast("Network error while placing order.", "danger");
    }
}

window.addEventListener("DOMContentLoaded", () => {
    renderCart();
    loadLoyalty();
});

(function () {
    function getBack() { return document.querySelector(".back-arrow"); }
    window.showBackArrow = function () { const b = getBack(); if (b) b.classList.add("show"); };
    window.hideBackArrow = function () { const b = getBack(); if (b) b.classList.remove("show"); };
    const b = getBack();
    if (b && window.history.length > 1) b.classList.add("show");
})();
// ── External API: show USD equivalent ────────────────────────────────────────
(async function showUsdRate() {
    try {
        const res  = await fetch('/api/exchange-rate');
        if (!res.ok) return;
        const data = await res.json();
        if (!data.USD) return;
        const totalEl = document.getElementById('total');
        const usdEl   = document.getElementById('usd-equiv');
        if (!totalEl || !usdEl) return;

        // Watch for total to be populated then show USD
        const observer = new MutationObserver(() => {
            const egp = parseFloat((totalEl.textContent || '').replace(/[^0-9.]/g, ''));
            if (!isNaN(egp) && egp > 0) {
                usdEl.textContent = `≈ $${(egp * data.USD).toFixed(2)} USD`;
            }
        });
        observer.observe(totalEl, { childList: true, characterData: true, subtree: true });
    } catch (_) {}
})();
