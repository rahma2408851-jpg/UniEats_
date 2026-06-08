function getToken() {
  return localStorage.getItem('token') || '';
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
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 250); }, 2500);
}

const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Crect width='100%25' height='100%25' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%236b7280'%3E%2B%3C/text%3E%3C/svg%3E";

async function saveProfile() {
  const nameEl  = document.getElementById("name");
  const emailEl = document.getElementById("email");
  if (!nameEl || !emailEl) return;

  const name  = nameEl.value.trim();
  const email = emailEl.value.trim();
  if (!name || !email) { showToast("Name and email are required.", "danger"); return; }

  try {
    const response = await fetch('/api/users/me', {
      method : 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body   : JSON.stringify({ name, email })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save profile.');
    }
    const updated = await response.json();
    localStorage.setItem("userName",   updated.name);
    localStorage.setItem("userEmail",  updated.email);
    showToast("Profile saved ✅", "success");
  } catch (err) {
    showToast(err.message || "Could not save profile.", "danger");
  }
}

async function loadProfile() {
  const nameEl         = document.getElementById("name");
  const emailEl        = document.getElementById("email");
  const profilePreview = document.getElementById("profilePreview");

  // Optimistic load from localStorage
  if (nameEl)  nameEl.value  = localStorage.getItem("userName")  || "";
  if (emailEl) emailEl.value = localStorage.getItem("userEmail") || "";

  // Fetch fresh data from backend (includes avatar URL if previously uploaded)
  try {
    const response = await fetch('/api/users/me', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) return;
    const user = await response.json();
    if (nameEl  && user.name)  { nameEl.value  = user.name;  localStorage.setItem("userName",  user.name); }
    if (emailEl && user.email) { emailEl.value = user.email; localStorage.setItem("userEmail", user.email); }
    if (profilePreview) {
      profilePreview.src = user.avatar || defaultAvatar;
    }
  } catch (_) {
    if (profilePreview) profilePreview.src = defaultAvatar;
  }
}

/**
 * Called when user picks a file.
 * Previews immediately then uploads to /api/users/me/avatar via real multipart upload.
 */
async function previewProfilePic() {
  const fileInput      = document.getElementById("profilePic");
  const profilePreview = document.getElementById("profilePreview");
  if (!fileInput || !profilePreview || !fileInput.files?.length) return;

  const file = fileInput.files[0];

  // Show a local preview instantly
  const localUrl = URL.createObjectURL(file);
  profilePreview.src = localUrl;

  // Upload to server
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await fetch('/api/users/me/avatar', {
      method : 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body   : formData          // Do NOT set Content-Type — browser sets multipart boundary
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Upload failed.');
    }

    const { url } = await res.json();
    profilePreview.src = url;   // Switch to permanent server URL
    showToast("Profile picture updated ✅", "success");
  } catch (err) {
    showToast(err.message || "Could not upload picture.", "danger");
    profilePreview.src = defaultAvatar;
  } finally {
    URL.revokeObjectURL(localUrl);
  }
}

window.addEventListener("DOMContentLoaded", loadProfile);
