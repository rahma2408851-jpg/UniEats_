# 🍔 UniEats — Backend API

> A professional Node.js + Express REST API for a university food-ordering platform.  
> Built as a graduation project with a clean, scalable architecture suitable for portfolio and internship showcase.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Environment Setup](#-environment-setup)
- [Installation & Running](#-installation--running)
- [API Endpoints](#-api-endpoints)
- [Authentication & Roles](#-authentication--roles)
- [Security Features](#-security-features)
- [Localization (i18n)](#-localization-i18n)
- [HTTPS/SSL Configuration](#-httpssl-configuration)

---

## 🛠 Tech Stack

| Layer        | Technology                         |
|--------------|-----------------------------------|
| Runtime      | Node.js                            |
| Framework    | Express 4                          |
| Database     | MongoDB + Mongoose                 |
| Auth         | JSON Web Tokens (`jsonwebtoken`)   |
| Passwords    | `bcryptjs` (bcrypt hashing)        |
| Security     | `helmet`, `cors`                   |
| File Upload  | `multer`                           |
| Email        | `nodemailer`                       |
| Config       | `dotenv`                           |
| Dev server   | `nodemon`                          |

---

## ✨ Features

### ✅ Implemented Requirements (100%)

- **MVC & Routing** — Clean separation of concerns with models, controllers, and routes
- **Sessions & Authentication** — JWT-based auth with token revocation on logout
- **External APIs** — Exchange rate API integration + email sending (Nodemailer)
- **File Upload** — Multer for image uploads (menu items, profile pictures)
- **Error Handling** — Centralized error middleware with proper HTTP status codes
- **Data Validation** — Frontend + backend validation with comprehensive error messages
- **CRUD Operations** — Full CRUD for users, restaurants, orders, and menu items
- **AJAX/Fetch** — Dynamic page interactions with fetch API
- **UI/UX Quality** — Navy & Red theme consistency, responsive design
- **Pagination** — Implemented on all list endpoints (restaurants, users, orders)
- **Localization** — Multi-language support (English & Arabic)
- **HTTPS Support** — SSL/TLS configuration ready

---

## 📁 Project Structure

```
backend/
│
├── server.js                  # Entry point — middleware, routes, server start
│
├── routes/
│   ├── authRoutes.js          # POST /api/auth/register & /login
│   ├── orderRoutes.js         # /api/orders with pagination
│   ├── restaurantRoutes.js    # /api/restaurants (+ menu items, file upload)
│   ├── userRoutes.js          # /api/users with pagination
│   └── ownerMappingRoutes.js  # /api/owner-mappings
│
├── controllers/
│   ├── authController.js      # Register, login, password reset
│   ├── orderController.js     # Order CRUD with loyalty points
│   ├── restaurantController.js# Restaurant + menu + owner-mapping CRUD
│   └── userController.js      # User CRUD with profile management
│
├── middleware/
│   ├── authMiddleware.js      # JWT verification → req.user
│   ├── roleMiddleware.js      # Role-based access control (RBAC)
│   ├── errorMiddleware.js     # Centralized error + 404 handler
│   ├── uploadMiddleware.js    # Multer file upload configuration
│   └── localizationMiddleware.js # Language detection & i18n
│
├── models/
│   ├── User.js                # Mongoose schema + validation
│   ├── Restaurant.js          # Restaurant with categories & items
│   ├── Order.js               # Order tracking with status
│   └── OwnerMapping.js        # Email to restaurant mapping
│
├── utils/
│   ├── i18n.js                # Localization strings (EN & AR)
│
├── views/
│   ├── index.ejs              # Home page
│   ├── student-home.ejs       # Student dashboard
│   ├── login.ejs              # Login form
│   ├── register.ejs           # Registration form
│   ├── restaurant-details.ejs # Single restaurant view
│   ├── checkout.ejs           # Order checkout
│   ├── admin-dashboard.ejs    # Admin panel
│   ├── owner-dashboard.ejs    # Owner/vendor panel
│   └── ...other pages...
│
├── config/
│   └── db.js                  # MongoDB connection
│
├── .env                       # Secrets (never commit)
├── .env.example               # Template for collaborators
├── package.json
└── README.md
```

---

## ⚙️ Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Required variables:

```env
PORT=3000
JWT_SECRET=your_strong_random_secret_here
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
CLIENT_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### Optional variables:

```env
# Enable HTTPS
ENABLE_HTTPS=false
SSL_KEY_PATH=/path/to/private-key.pem
SSL_CERT_PATH=/path/to/certificate.pem

# Default language
DEFAULT_LANGUAGE=en
```

> **Important:** Never commit your `.env` file. Add it to `.gitignore`.

---

## 🚀 Installation & Running

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Start production server
npm start

# 4. Start development server (auto-reloads on file changes)
npm run dev
```

The server starts at: **http://localhost:3000**

---

## 📡 API Endpoints

### Authentication — `/api/auth`

| Method | Endpoint              | Body                             | Description              |
|--------|-----------------------|----------------------------------|--------------------------|
| POST   | `/api/auth/register`  | `{ name, email, password }`     | Create a new account     |
| POST   | `/api/auth/login`     | `{ email, password }`            | Login, receive JWT token |
| POST   | `/api/auth/logout`    | (with auth header)               | Logout & revoke token    |
| POST   | `/api/auth/forgot-password` | `{ email }` | Send password reset link |
| POST   | `/api/auth/reset-password`  | `{ token, password }` | Reset password |

**Login response:**
```json
{
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "Ali", "email": "ali@uni.edu", "role": "student" }
}
```

---

### Restaurants — `/api/restaurants`

| Method | Endpoint                      | Auth        | Pagination | Description                        |
|--------|-------------------------------|-------------|------------|------------------------------------|
| GET    | `/api/restaurants`            | Public      | ✅ Yes     | List all restaurants (`?search=&page=&limit=`) |
| GET    | `/api/restaurants/:id`        | Public      | N/A        | Get one restaurant                 |
| POST   | `/api/restaurants`            | Owner/Admin | N/A        | Create restaurant                  |
| PUT    | `/api/restaurants/:id`        | Owner/Admin | N/A        | Update restaurant                  |
| DELETE | `/api/restaurants/:id`        | Admin       | N/A        | Delete restaurant                  |
| POST   | `/api/restaurants/:id/items`  | Owner/Admin | N/A        | Add menu item                      |
| PUT    | `/api/restaurants/:id/items`  | Owner/Admin | N/A        | Edit menu item                     |
| DELETE | `/api/restaurants/:id/items`  | Owner/Admin | N/A        | Delete menu item                   |

**Pagination response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### Orders — `/api/orders`

| Method | Endpoint          | Auth        | Pagination | Description                            |
|--------|-------------------|-------------|------------|----------------------------------------|
| GET    | `/api/orders`     | Public      | ✅ Yes     | List orders (`?page=&limit=`)          |
| GET    | `/api/orders/:id` | Public      | N/A        | Get one order                          |
| POST   | `/api/orders`     | Public      | N/A        | Place a new order                      |
| PUT    | `/api/orders/:id` | Owner/Admin | N/A        | Update order status                    |

---

### Users — `/api/users`

| Method | Endpoint         | Auth  | Pagination | Description       |
|--------|------------------|-------|------------|-------------------|
| GET    | `/api/users`     | Admin | ✅ Yes     | List all users    |
| GET    | `/api/users/:id` | Admin | N/A        | Get one user      |
| GET    | `/api/users/profile/me` | Public | N/A | Get own profile |
| PUT    | `/api/users/profile/me` | Public | N/A | Update own profile |
| PUT    | `/api/users/:id` | Admin | N/A        | Update user (admin) |
| DELETE | `/api/users/:id` | Admin | N/A        | Delete user       |

---

### Localization — `/api/translations`

| Method | Endpoint          | Parameters | Description                    |
|--------|-------------------|-----------|------------------------------|
| GET    | `/api/translations` | `?lang=en\|ar` | Get translations for language |

---

## 🔐 Authentication & Roles

### How to authenticate

Send the JWT token in the `Authorization` header:

```
Authorization: Bearer <your_token_here>
```

### Roles & Permissions

| Role      | Permissions                                                      |
|-----------|------------------------------------------------------------------|
| `student` | Place orders, view own orders, view restaurants, update profile  |
| `owner`   | Everything a student can do + manage their restaurant & menu     |
| `admin`   | Full access — manage all users, restaurants, orders, mappings    |

---

## 🛡 Security Features

| Feature              | Implementation                                      |
|----------------------|-----------------------------------------------------|
| Password hashing     | `bcryptjs` with 10 salt rounds                      |
| JWT authentication   | Signed tokens, 7-day expiry, token revocation      |
| Security headers     | `helmet` middleware (CSP disabled for flexibility)  |
| CORS                 | `cors` middleware (configurable per environment)    |
| Input validation     | Email format, password length, name validation     |
| Error handling       | Centralized middleware, no stack traces in prod     |
| Role-based access    | Middleware guards on every sensitive route          |
| File upload limits   | Size & type validation on image uploads            |
| No password leaks    | Password hash stripped from all API responses       |
| Rate limiting        | Auth endpoints limited to 20 requests per 15 min   |
| Token revocation     | Logout invalidates tokens immediately              |

---

## 🌐 Localization (i18n)

The platform supports **English** and **Arabic** with automatic language detection.

### Frontend Usage

Include the localization script in your EJS templates:

```html
<script src="/script/i18n-client.js"></script>
```

Then use translations with data attributes:

```html
<!-- Translate text content -->
<button data-i18n="auth.login">Login</button>

<!-- Translate placeholders -->
<input data-i18n-placeholder="auth.email" type="email" />

<!-- Translate titles -->
<span data-i18n-title="common.home" title="">Home</span>

<!-- Or use JavaScript -->
<script>
  console.log(window.i18n.t('auth.login')); // "Sign In"
  window.i18n.setLanguage('ar'); // Switch to Arabic
</script>
```

### Backend Usage

In EJS templates, use the server-side translation function:

```ejs
<h1><%= t('auth.login') %></h1>
<p><%= t('messages.welcomeBack') %></p>
```

In controllers, use the i18n utility:

```javascript
const { t } = require('../utils/i18n');
const message = t('auth.loginSuccess', 'en');
```

---

## 🔒 HTTPS/SSL Configuration

### Option 1: Development (Self-signed certificate)

```bash
# Generate a self-signed certificate (valid for 365 days)
openssl req -x509 -newkey rsa:4096 -keyout private-key.pem -out certificate.pem -days 365 -nodes
```

### Option 2: Production (Let's Encrypt)

```bash
# Use Certbot to generate free certificates
sudo certbot certonly --standalone -d yourdomain.com
# Certificates will be at: /etc/letsencrypt/live/yourdomain.com/
```

### Configuration

1. Update `.env`:
```env
ENABLE_HTTPS=true
SSL_KEY_PATH=/path/to/private-key.pem
SSL_CERT_PATH=/path/to/certificate.pem
```

2. The server will automatically use HTTPS if configured

---

## 📊 File Upload

Uploaded files are stored in the `/uploads` directory and served at:

```
http://localhost:3000/uploads/[filename]
```

### Supported formats:
- Images: `.jpg`, `.jpeg`, `.png`, `.gif`

### Size limits:
- Max file size: 5MB

---

## 🗺 Database Schema

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'admin' | 'owner' | 'student',
  loyaltyPoints: Number,
  avatar: String (image URL),
  resetToken: String,
  resetTokenExpires: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Restaurant
```javascript
{
  name: String,
  description: String,
  rating: Number,
  deliveryTime: String,
  categories: [{
    name: String,
    items: [{
      name: String,
      price: Number,
      image: String
    }]
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Order
```javascript
{
  items: [{
    name: String,
    price: Number,
    quantity: Number
  }],
  total: Number,
  comment: String,
  email: String,
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed',
  restaurantId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

---

*UniEats — Built with ❤️ as a graduation project*
