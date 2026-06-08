function confirmLogout(event) {
    if (event) event.preventDefault();
    window.location.href = '/logout-confirm';
}

const STATUS_STEPS = [
    { key: "Pending",   label: "Received" },
    { key: "Preparing", label: "Preparing" },
    { key: "Ready",     label: "Ready" }
];

function stepIndexOf(status) {
    return STATUS_STEPS.findIndex(s => s.key === status);
}

function formatTime(isoString) {
    if (!isoString) return null;
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderTracking(order, queue) {
    const body = document.getElementById("tracking-body");
    const activeIdx = stepIndexOf(order.status);

    /* ── Status steps ── */
    let stepsHTML = `<div class="status-steps">`;
    STATUS_STEPS.forEach((step, i) => {
        const cls = i < activeIdx ? "done" : i === activeIdx ? "active" : "";
        stepsHTML += `
            <div class="step ${cls}">
                <div class="step-circle">${i < activeIdx ? "✓" : i + 1}</div>
                <span class="step-label">${step.label}</span>
            </div>`;
        if (i < STATUS_STEPS.length - 1) {
            stepsHTML += `<div class="step-line ${i < activeIdx ? "done" : ""}"></div>`;
        }
    });
    stepsHTML += `</div>`;

    /* ── Queue card ── */
    let queueHTML = "";
    if (queue && !queue.isReady) {
        queueHTML = `
        <div class="queue-card">
            <div>
                <div class="queue-stat-label">Position</div>
                <div class="queue-stat-value highlight">#${queue.position}</div>
            </div>
            <div>
                <div class="queue-stat-label">Ahead of you</div>
                <div class="queue-stat-value">${queue.ahead}</div>
            </div>
            <div>
                <div class="queue-stat-label">Est. wait</div>
                <div class="queue-stat-value">${queue.estWaitMins}<span style="font-size:0.85rem;font-weight:600;color:var(--text-muted)"> min</span></div>
            </div>
        </div>`;
    } else if (queue && queue.isReady) {
        queueHTML = `
        <div class="queue-card ready">
            <div style="grid-column:1/-1;text-align:center;">
                <div class="queue-stat-label">Status</div>
                <div class="queue-stat-value green" style="font-size:1.2rem;">Your order is ready for pickup</div>
            </div>
        </div>`;
    }

    /* ── Pickup time banner ── */
    let pickupHTML = "";
    if (order.pickupTime) {
        pickupHTML = `
        <div class="pickup-banner">
            <span class="pickup-banner-label">Scheduled Pickup</span>
            <span class="pickup-banner-time">${formatTime(order.pickupTime)}</span>
        </div>`;
    }

    /* ── Order details ── */
    const items = order.items.map(item => {
        const qty = item.quantity || item.qty || 1;
        return `<li>${item.name} &times;${qty}</li>`;
    }).join("");

    const comment = order.comment?.trim()
        ? `<p><strong>Instructions:</strong> ${order.comment}</p>`
        : "";

    const detailsHTML = `
        <div class="tracking-details">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Total:</strong> EGP ${order.total}</p>
            <p><strong>Items:</strong></p>
            <ul>${items}</ul>
            ${comment}
        </div>`;

    body.innerHTML = stepsHTML + queueHTML + pickupHTML + detailsHTML + `
        <div class="refresh-hint">
            Updates every 30 seconds
            <br><button class="refresh-btn" onclick="refreshTracking()">Refresh now</button>
        </div>`;
}

let currentOrderId = null;

async function refreshTracking() {
    if (!currentOrderId) return;
    try {
        const [orderRes, queueRes] = await Promise.all([
            fetch(`/api/orders/${currentOrderId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')||''}` } }),
            fetch(`/api/orders/queue/${currentOrderId}`)
        ]);
        const order = orderRes.ok ? await orderRes.json() : null;
        const queue = queueRes.ok ? await queueRes.json() : null;
        if (order) renderTracking(order, queue);
    } catch (_) {}
}

window.addEventListener("DOMContentLoaded", async () => {
    const body = document.getElementById("tracking-body");
    currentOrderId = localStorage.getItem("lastOrderId");

    if (!currentOrderId) {
        body.innerHTML = `<p style="color:var(--text-muted);text-align:center;">No recent order found.</p>`;
        return;
    }

    try {
        const [orderRes, queueRes] = await Promise.all([
            fetch(`/api/orders/${currentOrderId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')||''}` } }),
            fetch(`/api/orders/queue/${currentOrderId}`)
        ]);

        if (!orderRes.ok) {
            body.innerHTML = `<p style="color:var(--text-muted);text-align:center;">Could not load order.</p>`;
            return;
        }

        const order = await orderRes.json();
        const queue = queueRes.ok ? await queueRes.json() : null;
        renderTracking(order, queue);

        // Auto-refresh every 30s
        setInterval(refreshTracking, 30000);

    } catch (_) {
        body.innerHTML = `<p style="color:var(--text-muted);text-align:center;">Network error. Please refresh.</p>`;
    }
});