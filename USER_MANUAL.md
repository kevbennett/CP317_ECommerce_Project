# Canadian Catalog � User Manual & Quick Start

This guide explains how to run the system locally, provides test credentials, and walks through the major features.

**System Overview**
Canadian Catalog is a full-stack e-commerce demo built with a Django REST backend and a React (Vite) frontend. The frontend runs on `http://127.0.0.1:5173` and talks to the backend on `http://127.0.0.1:8000` via the `/api` proxy. A SQLite database (`db.sqlite3`) is already included with sample products and categories.

---

## Quick Start (Install & Run)

**Prerequisites**
- Python 3.10+ (for Django)
- Node.js 18+ (for Vite/React)

**1) Backend (Django REST API)**
1. Open a terminal in the project root: `c:\Users\iramu.SPEEDY\OneDrive\Documents\CP317_ECommerce_Project`.
2. Install Python dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. Run database migrations (safe even if already applied):
   ```powershell
   python manage.py migrate
   ```
4. Start the backend server:
   ```powershell
   python manage.py runserver
   ```
   The backend will run at `http://127.0.0.1:8000`.

**2) Frontend (React + Vite)**
1. Open a second terminal.
2. Move into the frontend folder:
   ```powershell
   cd frontend
   ```
3. Install Node dependencies:
   ```powershell
   npm install
   ```
4. Start the frontend dev server:
   ```powershell
   npm run dev
   ```
5. Open the app at `http://127.0.0.1:5173`.

---

## Test Credentials (Ready to Use)
Use these accounts to log in immediately (no signup required):
- **Admin (Django admin panel):**
  - Username: `admin`
  - Password: `Test1234!`
  - Admin UI: `http://127.0.0.1:8000/admin`
- **Sample shopper accounts (frontend app):**
  - Username: `iram` / Password: `Test1234!`
  - Username: `Mushrur` / Password: `Test1234!`

You can also create new user accounts via the **Sign up** page in the frontend.

---

## Major Features � Step by Step

### 1) Browse Products
1. Go to **Products** in the top navigation.
2. Use the **Category** dropdown to filter products.
3. Use **Sort by Name** or **Sort by Price** with Asc/Desc ordering.
4. Click any product card to open **Product Details**.

### 2) Product Details
1. Open a product from the Products list.
2. Review description, price, and category tag.
3. Click **Add to cart** or **Add to wishlist** (requires login).

### 3) Cart Management
1. Go to **Cart** in the top navigation.
2. Adjust quantities with the numeric stepper.
3. Use **Remove** to delete an item.
4. Use **Move to Wishlist** or **Move All to Wishlist** to save items.
5. Use **Clear Cart** to remove everything.

### 4) Checkout (Mock Payment)
1. In **Cart**, click **Checkout**.
2. Enter mock card data (e.g., `4242 4242 4242 4242`, any valid MM/YYYY, any CVC).
3. Click **Place Order** to create an order (no real payment is charged).
4. The system redirects to the new **Order Details** page.

### 5) Orders & Order Details
1. Open **Orders** to view past orders.
2. Click **View** on any order to open **Order Details**.
3. View shipping information, items, and order total.
4. If the order is paid, click **Return** to create a return request.
   - Provide a reason and select all or part of the order.
5. Return history appears at the bottom of the Order Details page.

### 6) Wishlist
1. Open **Wishlist** from the navigation (login required).
2. Remove items or move items to the cart.
3. Use **Move All to Cart** for bulk transfer.

### 7) Profile
1. Open **Profile** to view account details and shipping info.
2. Click **Refresh** to reload the latest user profile.

---

## Admin Management (Optional)
Use the Django admin panel to manage products, categories, and orders.
1. Go to `http://127.0.0.1:8000/admin`.
2. Log in with `admin / Test1234!`.
3. Add/edit **Categories** and **Products** to change the catalog.

---

## Notes & Tips
- The database is SQLite and already seeded with sample products and categories.
- The frontend uses a Vite proxy, so API calls are sent to the backend automatically.
- If products do not show up, ensure the backend is running on port `8000`.

End of manual.
