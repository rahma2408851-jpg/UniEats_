/* ============================================
   SHARED UTILITIES
   ============================================ */
function confirmLogout(event) {
    if (event) event.preventDefault();
    window.location.href = '/logout-confirm';
}

/* ============================================
   RESTAURANTS — loaded entirely from backend
   Local array kept only as offline fallback
   ============================================ */

window.restaurants = [];

async function loadRestaurantsFromBackend() {
    try {
        const response = await fetch('/api/restaurants');
        if (!response.ok) {
            console.warn('Backend restaurants fetch failed.');
            return;
        }
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        if (list.length > 0) {
            window.restaurants = list;
            if (restDiv) renderRestaurants(window.restaurants);
        }
    } catch (error) {
        console.warn('Could not load restaurants from backend:', error);
    }
}

async function getRestaurantFromBackend(id) {
    try {
        const response = await fetch(`/api/restaurants/${id}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.warn('Could not fetch restaurant from backend:', error);
        return null;
    }
}

/* =========================
   RESTAURANTS PAGE
========================= */
let restDiv;
let searchInput;
let searchButton;

function renderRestaurants(list) {
    if (!restDiv) return;
    restDiv.innerHTML = "";

    if (list.length === 0) {
        restDiv.innerHTML = "<p class='no-results'>No restaurants or items found.</p>";
        return;
    }

    list.forEach(r => {
        // Use logo field from MongoDB if available, otherwise build path
        const logoSrc = r.logo
            ? `/${r.logo}`
            : `/assets/${r.name.toLowerCase().replace(/ /g, '')}/logo.jpg`;

        let div = document.createElement("div");
        div.className = "restaurant-card";

        div.innerHTML = `
            <div class="restaurant-image" style="background-image: url('${logoSrc}'); background-size: cover; background-position: center;"></div>
            <div class="restaurant-info">
                <h3>${r.name}</h3>
                <p class="tags">${r.description || 'Delicious food'}</p>
                <div class="card-meta">
                    <span class="rating">⭐ ${r.rating || 4.5}</span>
                    <span class="time">🕒 ${r.deliveryTime || '15 mins'}</span>
                </div>
            </div>
        `;

        // FIX: use _id (MongoDB ObjectId string) instead of numeric id
        div.onclick = () => {
            window.location.href = `/restaurant-details?id=${r._id}`;
        };

        restDiv.appendChild(div);
    });
}

function searchRestaurants() {
    if (!searchInput || !restDiv) return;
    const term = searchInput.value.trim().toLowerCase();
    if (!term) {
        renderRestaurants(window.restaurants);
        return;
    }

    const filtered = window.restaurants.filter(r => {
        const inName = r.name.toLowerCase().includes(term);
        const inItems = (r.categories || []).some(category =>
            (category.items || []).some(item => item.name.toLowerCase().includes(term))
        );
        return inName || inItems;
    });

    renderRestaurants(filtered);
}

document.addEventListener("DOMContentLoaded", () => {
    restDiv    = document.getElementById("restaurants");
    searchInput  = document.getElementById("restaurant-search");
    searchButton = document.getElementById("search-button");

    if (restDiv) {
        loadRestaurantsFromBackend();
    }

    if (searchButton) {
        searchButton.addEventListener("click", searchRestaurants);
    }

    if (searchInput) {
        searchInput.addEventListener("keyup", (e) => {
            if (e.key === "Enter") searchRestaurants();
        });
    }
});

/* =========================
   RESTAURANT DETAILS PAGE
========================= */
let menuDiv;

document.addEventListener("DOMContentLoaded", () => {
    menuDiv = document.getElementById("menu");

    if (menuDiv) {
        (async () => {
            // FIX: id is now a MongoDB ObjectId string — do NOT convert to Number
            const id = new URLSearchParams(window.location.search).get("id");
            window.currentRestaurantId = id;

            // Always fetch from backend — MongoDB is the source of truth
            const restaurant = await getRestaurantFromBackend(id);

            if (restaurant) {
                const nameEl = document.getElementById("rest-name");
                if (nameEl) nameEl.textContent = restaurant.name;
                // Store for cart page display
                localStorage.setItem("cartRestaurantName", restaurant.name);

                const ratingEl = document.getElementById("rest-rating");
                if (ratingEl) ratingEl.textContent = restaurant.rating ? `⭐ ${restaurant.rating}` : '';

                const deliveryEl = document.getElementById("rest-delivery");
                if (deliveryEl) deliveryEl.textContent = restaurant.deliveryTime ? `🕒 ${restaurant.deliveryTime}` : '';

                const descEl = document.getElementById("rest-description");
                if (descEl) descEl.textContent = restaurant.description || '';

                (restaurant.categories || []).forEach(category => {
                    let catDiv = document.createElement("div");
                    catDiv.className = "menu-category";
                    catDiv.innerHTML = `<h4>${category.name}</h4>`;

                    (category.items || []).forEach(item => {
                        let itemDiv = document.createElement("div");
                        itemDiv.className = "menu-item";

                        // Use image field stored in MongoDB, fallback to placeholder
                        const imageSrc = item.image
                            ? `/${item.image}`
                            : '/assets/Gemini_Generated_Image_40czvt40czvt40cz.png';

                        const price = parseFloat(item.price || 0).toFixed(2);

                        itemDiv.innerHTML = `
                            <div class="item-info">
                                <img src="${imageSrc}" alt="${item.name}"
                                     style="width:80px;height:80px;object-fit:cover;margin-bottom:10px;"
                                     onerror="this.src='/assets/Gemini_Generated_Image_40czvt40czvt40cz.png'">
                                <h4>${item.name}</h4>
                                <p class="price">EGP ${price}</p>
                            </div>
                            <button class="add-to-cart-btn" onclick="addToCart('${item.name.replace(/'/g, "\\'")}', ${price})">Add</button>
                        `;

                        catDiv.appendChild(itemDiv);
                    });
                    menuDiv.appendChild(catDiv);
                });

            } else {
                const nameEl = document.getElementById("rest-name");
                if (nameEl) nameEl.textContent = "Restaurant Not Found";
                menuDiv.innerHTML = "<p>Please select a valid restaurant.</p>";
            }
        })();
    }
});

/* =========================
   CART SYSTEM
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
cart = cart.map(item => ({
    ...item,
    quantity: item.quantity ?? item.qty ?? 1
}));

function createToastContainer() {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }
    return container;
}

function showToast(message, type = "success") {
    const container = createToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 250);
    }, 2500);
}

function addToCart(name, price) {
    // FIX: restaurantId is now a string ObjectId, not a number
    const restaurantId = window.currentRestaurantId || null;
    let existing = cart.find(item => item.name === name && item.restaurantId === restaurantId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ name, price: parseFloat(price), quantity: 1, restaurantId });
    }
    saveCart();
    showToast("Added to cart ✅", "success");
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

/* =========================
   LOAD CART PAGE
========================= */
function loadCart() {
    const cartDiv = document.getElementById("cart-items");
    if (!cartDiv) return;

    cartDiv.innerHTML = "";
    let subtotal = 0;

    // Show restaurant name if stored
    const restName = localStorage.getItem("cartRestaurantName");
    const titleEl  = document.getElementById("cart-restaurant-name");
    if (titleEl && restName) titleEl.textContent = `Ordering from: ${restName}`;

    // Empty state
    if (cart.length === 0) {
        cartDiv.innerHTML = `
            <div class="cart-empty">
                <div style="font-size:2.5rem;margin-bottom:12px;">🛒</div>
                <p style="color:var(--text-muted);margin-bottom:16px;">Your cart is empty.</p>
                <a href="/student-home" style="padding:10px 22px;background:var(--primary);color:#fff;border-radius:10px;text-decoration:none;font-weight:600;">Browse Restaurants</a>
            </div>`;
        updateSummary(0);
        return;
    }

    cart.forEach((item, index) => {
        subtotal += item.price * item.quantity;

        let div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <div class="item-info">
                <h4>${item.name}</h4>
                <p>EGP ${item.price.toFixed(2)}</p>
            </div>
            <div class="item-quantity">
                <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
            </div>
            <div class="item-total">EGP ${(item.price * item.quantity).toFixed(2)}</div>
            <button class="remove-btn" onclick="removeItem(${index})">X</button>
        `;
        cartDiv.appendChild(div);
    });

    updateSummary(subtotal);
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
    loadCart();
}

function changeQty(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    saveCart();
    loadCart();
}

function updateSummary(subtotal) {
    const tax   = subtotal * 0.05;
    const total = subtotal + tax;
    if (document.getElementById("subtotal")) document.getElementById("subtotal").textContent = `EGP ${subtotal.toFixed(2)}`;
    if (document.getElementById("tax"))      document.getElementById("tax").textContent      = `EGP ${tax.toFixed(2)}`;
    if (document.getElementById("total"))    document.getElementById("total").textContent    = `EGP ${total.toFixed(2)}`;
}

/* =========================
   SEARCH (legacy form fallback)
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const searchForm = document.getElementById("search-form");
    if (searchForm) {
        searchForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const query = document.getElementById("search-input").value.toLowerCase();
            document.querySelectorAll(".restaurant-card").forEach(card => {
                const name = card.querySelector("h3").innerText.toLowerCase();
                card.style.display = name.includes(query) ? "block" : "none";
            });
        });
    }
});

window.addEventListener("load", () => {
    loadCart();
});

// Back-arrow control utilities
(function () {
    function getBack() { return document.querySelector('.back-arrow'); }
    window.showBackArrow = function () { const b = getBack(); if (b) b.classList.add('show'); };
    window.hideBackArrow = function () { const b = getBack(); if (b) b.classList.remove('show'); };
    const b = getBack();
    if (b && (window.location.search.includes('id=') || window.history.length > 1)) {
        b.classList.add('show');
    }
})();