document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const loginForm    = document.getElementById("loginForm");

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ─── REGISTRATION ────────────────────────────────────────────────────────

  if (registerForm) {
    registerForm.setAttribute("novalidate", "true");

    const submitBtn       = document.getElementById("submitBtn");
    const password        = document.getElementById("password");
    const confirm         = document.getElementById("confirm");
    const usernameInput   = document.getElementById("username");
    const usernameCounter = document.getElementById("usernameCounter");
    const emailInput      = document.getElementById("email");
    const mnumberInput    = document.getElementById("mnumber");
    const bdateInput      = document.getElementById("bdate");

    function updateUsernameCounter() {
      const len = usernameInput.value.length;
      usernameCounter.textContent = `${len}/20`;
      if (len >= 18)      usernameCounter.style.color = "#f4b400";
      else if (len === 20) usernameCounter.style.color = "#d93025";
      else                usernameCounter.style.color = "#666";
    }

    function updateSubmitButtonState() {
      const allValid =
        usernameInput.validity.valid &&
        emailInput.value !== "" && isValidEmail(emailInput.value) &&
        password.validity.valid &&
        confirm.value !== "" && password.value === confirm.value &&
        mnumberInput.validity.valid &&
        bdateInput.validity.valid;
      submitBtn.disabled = !allValid;
    }

    const debounce = (func, delay = 300) => {
      let t;
      return (...args) => { clearTimeout(t); t = setTimeout(() => func(...args), delay); };
    };

    const validateInput = (input) => {
      input.parentElement.querySelector(".error-msg")?.remove();
      let isValid = true, errorMessage = "";

      if (input === emailInput) {
        const v = emailInput.value.trim();
        if (!v)                  { isValid = false; errorMessage = "Email is required."; }
        else if (!isValidEmail(v)) { isValid = false; errorMessage = "Please enter a valid email address."; }
      } else {
        if (!input.validity.valid) {
          isValid = false;
          errorMessage = input.validity.valueMissing ? "This field is required." : (input.title || "Invalid input format.");
        }
      }

      if (input === confirm && confirm.value !== password.value) {
        isValid = false; errorMessage = "Passwords do not match.";
      }

      input.setAttribute("aria-invalid", String(!isValid));
      input.style.borderColor = isValid ? "#34a853" : "#d93025";

      if (!isValid) {
        const span = document.createElement("span");
        span.className = "error-msg";
        span.style.cssText = "color:#d93025;font-size:0.85rem;display:block;margin-top:4px;";
        span.setAttribute("role", "alert");
        span.textContent = errorMessage;
        input.parentElement.appendChild(span);
      }

      updateSubmitButtonState();
    };

    usernameInput.addEventListener("input",  debounce(() => { validateInput(usernameInput); updateUsernameCounter(); }));
    usernameInput.addEventListener("blur",   () => { usernameInput.value = usernameInput.value.trim(); validateInput(usernameInput); updateUsernameCounter(); });
    emailInput.addEventListener("input",     () => validateInput(emailInput));
    emailInput.addEventListener("blur",      () => { emailInput.value = emailInput.value.trim(); validateInput(emailInput); });
    password.addEventListener("input",       debounce(() => { validateInput(password); if (confirm.value) validateInput(confirm); updateSubmitButtonState(); }));
    password.addEventListener("blur",        () => validateInput(password));
    confirm.addEventListener("input",        () => { validateInput(confirm); updateSubmitButtonState(); });
    confirm.addEventListener("blur",         () => validateInput(confirm));
    mnumberInput.addEventListener("input",   debounce(() => validateInput(mnumberInput)));
    mnumberInput.addEventListener("blur",    () => validateInput(mnumberInput));
    bdateInput.addEventListener("input",     () => validateInput(bdateInput));
    bdateInput.addEventListener("blur",      () => {
      const val = new Date(bdateInput.value);
      if (bdateInput.value && (val < new Date("1906-01-01") || val > new Date("2013-01-01"))) {
        bdateInput.parentElement.querySelector(".error-msg")?.remove();
        bdateInput.style.borderColor = "#d93025";
        const span = document.createElement("span");
        span.className = "error-msg";
        span.style.cssText = "color:#d93025;font-size:0.85rem;display:block;margin-top:4px;";
        span.textContent = "Please enter a valid birth date.";
        bdateInput.parentElement.appendChild(span);
      } else { validateInput(bdateInput); }
    });

    // Password toggle
    registerForm.querySelectorAll("input[type='password']").forEach(input => {
      const btn = document.createElement("button");
      btn.type = "button"; btn.textContent = "Show";
      btn.style.cssText = "margin-left:5px;padding:2px 6px;cursor:pointer;font-size:0.8rem;vertical-align:middle;";
      input.insertAdjacentElement("afterend", btn);
      btn.addEventListener("click", () => {
        const isPass = input.type === "password";
        input.type = isPass ? "text" : "password";
        btn.textContent = isPass ? "Hide" : "Show";
      });
    });

    // Password strength
    const strengthText = document.createElement("span");
    strengthText.style.cssText = "font-size:0.85rem;font-weight:bold;margin-left:10px;vertical-align:middle;";
    strengthText.setAttribute("aria-live", "polite");
    password.parentElement.appendChild(strengthText);
    const updateStrength = (val) => {
      if (!val) { strengthText.textContent = ""; return; }
      let s = 0;
      if (val.length >= 8) s++;
      if (/[A-Z]/.test(val)) s++;
      if (/[a-z]/.test(val)) s++;
      if (/[0-9]/.test(val)) s++;
      if (/[^A-Za-z0-9]/.test(val)) s++;
      if (s <= 2) { strengthText.textContent = "Weak 🔴";   strengthText.style.color = "#d93025"; }
      else if (s <= 4) { strengthText.textContent = "Medium 🟡"; strengthText.style.color = "#f4b400"; }
      else             { strengthText.textContent = "Strong 🟢"; strengthText.style.color = "#34a853"; }
    };
    password.addEventListener("input", () => { updateStrength(password.value); updateSubmitButtonState(); });

    updateUsernameCounter();
    updateSubmitButtonState();

    let isSubmitting = false, submissionAttempts = 0;

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      document.getElementById("main-form-error")?.remove();

      validateInput(usernameInput); validateInput(emailInput);
      validateInput(password); validateInput(confirm);
      updateSubmitButtonState();

      if (submitBtn.disabled) {
        showFormError("Please fix the highlighted errors before submitting.", "main-form-error", registerForm);
        return;
      }
      if (++submissionAttempts > 5) {
        showFormError("Too many attempts. Please try again later.", "main-form-error", registerForm);
        return;
      }

      isSubmitting = true;
      const origText = submitBtn.textContent;
      submitBtn.textContent = "Processing..."; submitBtn.disabled = true;
      submitBtn.style.opacity = "0.7"; submitBtn.style.cursor = "wait";

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name    : usernameInput.value.trim(),
            email   : emailInput.value.trim(),
            password: password.value,
            role    : 'student',
            mnumber : mnumberInput.value.trim(),
            bdate   : bdateInput.value
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Registration failed.');
        }
        submitBtn.textContent = "Success! Redirecting...";
        submitBtn.style.backgroundColor = "#34a853";
        setTimeout(() => window.location.href = "/login", 1000);
      } catch (err) {
        showFormError(err.message || "Registration failed. Please try again.", "main-form-error", registerForm);
        isSubmitting = false;
        submitBtn.textContent = origText; submitBtn.disabled = false;
        submitBtn.style.opacity = "1"; submitBtn.style.cursor = "pointer";
        updateSubmitButtonState();
      }
    });
  }

  // ─── LOGIN ───────────────────────────────────────────────────────────────

  if (loginForm) {
    const loginBtn        = loginForm.querySelector("button[type='submit']");
    const identifierInput = document.getElementById("login_identifier");
    const passwordInput   = document.getElementById("password");

    // Restaurant IDs are always fetched from /api/owner-mappings after login — never hardcoded.
    const validateInput = (input) => {
      input.parentElement.querySelector(".error-msg")?.remove();
      let isValid = true, errorMessage = "";
      if (input === identifierInput) {
        const v = identifierInput.value.trim();
        if (!v)                   { isValid = false; errorMessage = "Email is required."; }
        else if (!isValidEmail(v)) { isValid = false; errorMessage = "Please enter a valid email address."; }
      } else if (input === passwordInput) {
        if (!passwordInput.value)              { isValid = false; errorMessage = "Password is required."; }
        else if (passwordInput.value.length < 6) { isValid = false; errorMessage = "Password must be at least 6 characters."; }
      }
      input.setAttribute("aria-invalid", String(!isValid));
      input.style.borderColor = isValid ? "#34a853" : "#d93025";
      if (!isValid) {
        const span = document.createElement("span");
        span.className = "error-msg";
        span.style.cssText = "color:#d93025;font-size:0.85rem;display:block;margin-top:4px;";
        span.setAttribute("role", "alert");
        span.textContent = errorMessage;
        input.parentElement.appendChild(span);
      }
      updateLoginButtonState();
    };

    function updateLoginButtonState() {
      loginBtn.disabled =
        !identifierInput.value.trim() || !isValidEmail(identifierInput.value.trim()) ||
        !passwordInput.value || passwordInput.value.length < 6;
    }

    identifierInput.addEventListener("input", () => validateInput(identifierInput));
    identifierInput.addEventListener("blur",  () => { identifierInput.value = identifierInput.value.trim(); validateInput(identifierInput); });
    passwordInput.addEventListener("input",   () => { validateInput(passwordInput); updateLoginButtonState(); });
    passwordInput.addEventListener("blur",    () => validateInput(passwordInput));
    identifierInput.focus();

    let isLoggingIn = false, loginAttempts = 0;

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (isLoggingIn || loginBtn.disabled) return;
      document.getElementById("login-error")?.remove();

      if (++loginAttempts > 5) {
        showFormError("Too many failed attempts. Please try again later.", "login-error", loginForm);
        loginBtn.disabled = true; loginBtn.style.opacity = "0.5";
        return;
      }

      isLoggingIn = true;
      const origText = loginBtn.textContent;
      loginBtn.textContent = "Authenticating..."; loginBtn.disabled = true; loginBtn.style.cursor = "wait";

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifierInput.value.trim(), password: passwordInput.value })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Invalid email or password.');
        }

        const data = await res.json();

        // FIX: token is at data.token, not data.user.token
        localStorage.setItem('token',     data.token);
        localStorage.setItem('userRole',  data.role  || data.user?.role  || 'student');
        localStorage.setItem('userEmail', data.email || data.user?.email || identifierInput.value.trim());
        localStorage.setItem('userName',  data.name  || data.user?.name  || '');

        const role  = localStorage.getItem('userRole');
        const email = localStorage.getItem('userEmail');

        // Store ownerUsername so all owner.js can look up the restaurant mapping via API
        if (role === 'owner') {
            localStorage.setItem('ownerUsername', email);
        }

        loginBtn.textContent = "Welcome back!";
        loginBtn.style.backgroundColor = "#34a853";

        const page = role === 'owner' ? '/manage-menu' : role === 'admin' ? '/admin-dashboard' : '/student-home';
        setTimeout(() => window.location.href = page, 1000);

      } catch (err) {
        showFormError(err.message || "Invalid email or password.", "login-error", loginForm);
        isLoggingIn = false;
        loginBtn.textContent = origText; loginBtn.disabled = false; loginBtn.style.cursor = "pointer";
        passwordInput.value = ""; passwordInput.focus();
      }
    });

    updateLoginButtonState();
  }

  // ─── Shared helper ───────────────────────────────────────────────────────

  function showFormError(message, id, form) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      el.style.cssText = "color:#d93025;margin-bottom:15px;font-weight:bold;text-align:center;";
      el.setAttribute("role", "alert");
      form.insertBefore(el, form.firstChild);
    }
    el.textContent = message;
  }
});