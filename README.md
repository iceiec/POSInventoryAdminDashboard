# PharmacyMed — POS Inventory Admin Dashboard

A full-stack pharmacy management system built with the **MERN stack** (MongoDB, Express, React, Node.js). Designed for drug stores using **Philippine Peso (₱)** as currency with planned **Loyverse API** integration.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
  - [Items](#items)
  - [Categories](#categories)
  - [Modifiers](#modifiers)
  - [Discounts](#discounts)
  - [Sales](#sales)
  - [Analytics](#analytics)
- [Data Models](#data-models)
- [Frontend Architecture](#frontend-architecture)
- [Features](#features)
- [Loyverse Integration](#loyverse-integration)
- [Scripts](#scripts)

---

## Overview

PharmacyMed is a point-of-sale and inventory admin system for pharmacies. It provides:

- A **POS checkout interface** with cart management, discounts, and multiple payment methods (Cash, Card, Digital Wallet)
- An **inventory management** system with items, categories, modifiers, discounts, and low-stock alerts
- A **sales analytics dashboard** with charts for sales summary, by item, by category, by payment type, receipts, and discount usage
- **CSV import/export** for bulk item management
- **Dark mode** support

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, TypeScript, Tailwind CSS, Recharts    |
| Backend   | Node.js, Express 4, Mongoose 8                  |
| Database  | MongoDB                                         |
| Fonts     | DM Sans (UI), JetBrains Mono (numbers/data)     |

---

## Project Structure

```
pharmacymed/
│
├── backend/                        # Express REST API
│   ├── .env.example                # Environment variable template
│   ├── package.json
│   ├── server.js                   # Entry point — connects DB, starts server
│   └── src/
│       ├── app.js                  # Express app, CORS, routes, middleware
│       ├── config/
│       │   └── db.js               # Mongoose connection
│       ├── middleware/
│       │   ├── errorHandler.js     # Central error handler (Mongoose, duplicate, cast)
│       │   └── validate.js         # express-validator result checker
│       ├── models/
│       │   ├── Item.js             # Auto-sets stock status on pre-save
│       │   ├── Category.js
│       │   ├── Modifier.js
│       │   ├── Discount.js
│       │   └── Sale.js
│       ├── controllers/
│       │   ├── itemController.js
│       │   ├── categoryController.js
│       │   ├── modifierController.js
│       │   ├── discountController.js
│       │   ├── saleController.js
│       │   └── analyticsController.js  # MongoDB aggregation pipelines
│       └── routes/
│           ├── items.js
│           ├── categories.js
│           ├── modifiers.js
│           ├── discounts.js
│           ├── sales.js
│           └── analytics.js
│
└── src/                            # React frontend
    ├── api/                        # Fetch-based API service layer
    │   ├── client.ts               # Base fetch wrapper (reads VITE_API_URL)
    │   ├── items.ts
    │   ├── categories.ts
    │   ├── modifiers.ts
    │   ├── discounts.ts
    │   ├── analytics.ts
    │   └── sales.ts
    ├── types/
    │   └── index.ts                # Shared TypeScript interfaces
    ├── app/
    │   └── App.tsx                 # Main React component
    └── styles/
        ├── fonts.css               # Google Fonts imports
        ├── theme.css               # CSS design tokens (colors, spacing)
        └── index.css               # Tailwind base + token mapping
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** v6 or higher (local or Atlas)
- **npm** v9 or higher

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Copy the environment template
cp .env.example .env

# 4. Edit .env with your values (see Environment Variables section)
nano .env

# 5. Start the development server
npm run dev
```

The API will be available at `http://localhost:5000`.

Health check: `GET http://localhost:5000/api/health`

---

### Frontend Setup

```bash
# From the project root (where src/ lives)

# 1. Create a frontend .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env

# 2. Install dependencies (if not already done by the build tool)
npm install

# 3. Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Environment Variables

All variables are defined in `backend/.env.example`. Copy it to `backend/.env` and fill in your values.

| Variable            | Default                                    | Description                                                  |
|---------------------|--------------------------------------------|--------------------------------------------------------------|
| `PORT`              | `5000`                                     | Port the Express server listens on                           |
| `MONGODB_URI`       | `mongodb://localhost:27017/pharmacymed`    | MongoDB connection string. Use Atlas URI for production.     |
| `NODE_ENV`          | `development`                              | `development` or `production`                                |
| `LOYVERSE_API_TOKEN`| —                                          | Your Loyverse API token (for future integration)             |
| `FRONTEND_URL`      | `http://localhost:5173`                    | Allowed CORS origin                                          |

### MongoDB Atlas (Production)

Replace `MONGODB_URI` with your Atlas connection string:

```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/pharmacymed?retryWrites=true&w=majority
```

---

## API Reference

All endpoints are prefixed with `/api`. The server returns JSON for all responses.

**Base URL:** `http://localhost:5000/api`

---

### Items

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | `/items`              | Get all items (filterable)         |
| GET    | `/items/:id`          | Get single item by ID              |
| POST   | `/items`              | Create a new item                  |
| PUT    | `/items/:id`          | Update an item                     |
| DELETE | `/items/:id`          | Delete an item                     |
| POST   | `/items/bulk-delete`  | Delete multiple items by ID array  |
| POST   | `/items/import`       | Bulk import items from CSV parse   |

**GET `/items` — Query Parameters**

| Param      | Type   | Description                                   |
|------------|--------|-----------------------------------------------|
| `category` | string | Filter by category name                       |
| `status`   | string | `IN_STOCK`, `LOW_STOCK`, or `OUT_OF_STOCK`    |
| `search`   | string | Search by item name or SKU                    |

**POST `/items` — Required Body Fields**

```json
{
  "name": "Ibuprofen 200mg",
  "sku": "OTC-001",
  "category": "OTC Medications",
  "price": 10.00,
  "cost": 4.50
}
```

**POST `/items/bulk-delete` — Body**

```json
{ "ids": ["64a...", "64b..."] }
```

**POST `/items/import` — Body**

```json
{
  "items": [
    { "name": "...", "sku": "...", "category": "...", "price": 0, "cost": 0 }
  ]
}
```

Items are upserted by SKU — existing SKUs are updated, new ones are created.

---

### Categories

| Method | Endpoint           | Description             |
|--------|--------------------|-------------------------|
| GET    | `/categories`      | Get all categories      |
| GET    | `/categories/:id`  | Get single category     |
| POST   | `/categories`      | Create a category       |
| PUT    | `/categories/:id`  | Update a category       |
| DELETE | `/categories/:id`  | Delete a category       |

> **Note:** Deleting a category that still has items assigned to it will return a `400` error. Reassign or delete the items first.

**POST `/categories` — Body**

```json
{
  "name": "OTC Medications",
  "color": "#3b82f6"
}
```

---

### Modifiers

| Method | Endpoint           | Description         |
|--------|--------------------|---------------------|
| GET    | `/modifiers`       | Get all modifiers   |
| GET    | `/modifiers/:id`   | Get single modifier |
| POST   | `/modifiers`       | Create a modifier   |
| PUT    | `/modifiers/:id`   | Update a modifier   |
| DELETE | `/modifiers/:id`   | Delete a modifier   |

**POST `/modifiers` — Body**

```json
{
  "name": "Generic Brand",
  "price": -3.00,
  "appliesTo": "OTC Medications"
}
```

Use a negative `price` for reductions, positive for add-ons.

---

### Discounts

| Method | Endpoint                  | Description                         |
|--------|---------------------------|-------------------------------------|
| GET    | `/discounts`              | Get all discounts                   |
| GET    | `/discounts/:id`          | Get single discount                 |
| POST   | `/discounts`              | Create a discount                   |
| PUT    | `/discounts/:id`          | Update a discount                   |
| PATCH  | `/discounts/:id/toggle`   | Toggle between ACTIVE and INACTIVE  |
| DELETE | `/discounts/:id`          | Delete a discount                   |

**POST `/discounts` — Body**

```json
{
  "name": "Senior Discount",
  "type": "percentage",
  "value": "15"
}
```

| Field   | Values                    |
|---------|---------------------------|
| `type`  | `"percentage"` or `"amount"` |
| `value` | String — `"15"` for 15% or `"50.00"` for ₱50 fixed |

---

### Sales

| Method | Endpoint      | Description                       |
|--------|---------------|-----------------------------------|
| GET    | `/sales`      | Get all sales (paginated)         |
| GET    | `/sales/:id`  | Get single sale with line items   |
| POST   | `/sales`      | Complete a sale                   |

**GET `/sales` — Query Parameters**

| Param       | Type   | Description                     |
|-------------|--------|---------------------------------|
| `startDate` | string | `YYYY-MM-DD` filter start       |
| `endDate`   | string | `YYYY-MM-DD` filter end         |
| `page`      | number | Page number (default `1`)       |
| `limit`     | number | Results per page (default `20`) |

**POST `/sales` — Body**

```json
{
  "items": [
    {
      "itemId": "64abc...",
      "name": "Ibuprofen 200mg",
      "quantity": 2,
      "price": 10.00,
      "cost": 4.50
    }
  ],
  "subtotal": 20.00,
  "discountAmount": 2.00,
  "discountLabel": "Senior Discount",
  "total": 18.00,
  "paymentMethod": "cash",
  "amountReceived": 20.00,
  "change": 2.00,
  "customerName": "Juan dela Cruz"
}
```

On a successful sale, stock is automatically decremented for all items with `trackStock: true`.

---

### Analytics

| Method | Endpoint              | Description                              |
|--------|-----------------------|------------------------------------------|
| GET    | `/analytics/summary`  | Aggregated sales metrics for a date range |

**GET `/analytics/summary` — Query Parameters**

| Param       | Type   | Required | Description             |
|-------------|--------|----------|-------------------------|
| `startDate` | string | Yes      | `YYYY-MM-DD`            |
| `endDate`   | string | Yes      | `YYYY-MM-DD`            |

**Response shape**

```json
{
  "metrics": {
    "grossSales": 248750.00,
    "refunds": 0,
    "discounts": 12450.75,
    "netSales": 231478.75,
    "grossProfit": 92591.50
  },
  "metricsChange": {
    "grossSales": 8.7,
    "refunds": 0,
    "discounts": 5.2,
    "netSales": 9.8,
    "grossProfit": 11.3
  },
  "salesTrend": [
    { "date": "Jun 1", "sales": 8200, "profit": 3280 }
  ],
  "salesByCategory": [
    { "name": "OTC Medications", "value": 78400, "color": "#3b82f6" }
  ],
  "salesByPayment": [
    { "name": "Cash", "value": 92350, "color": "#059669" }
  ],
  "receiptData": [
    { "date": "Jun 1", "count": 145, "total": 8200 }
  ],
  "discountData": [
    { "name": "Senior Discount", "usage": 45, "total": 4250 }
  ],
  "topItems": [
    { "name": "Ibuprofen 200mg", "sold": 542, "revenue": 5420.00 }
  ]
}
```

`metricsChange` values are percentage changes compared to an equal-length previous period.

---

## Data Models

### Item

| Field           | Type      | Notes                                              |
|-----------------|-----------|----------------------------------------------------|
| `name`          | String    | Required                                           |
| `sku`           | String    | Required, unique, auto-uppercased                  |
| `barcode`       | String    | Unique when set, sparse index (allows multiple nulls)|
| `category`      | String    | Required                                           |
| `description`   | String    | Default `""`                                       |
| `price`         | Number    | Required, min 0                                    |
| `cost`          | Number    | Required, min 0                                    |
| `stock`         | Number    | Default `0`                                        |
| `status`        | String    | Auto-set: `OUT_OF_STOCK` (0), `LOW_STOCK` (≤30), `IN_STOCK` (>30) |
| `onSale`        | Boolean   | Default `false`                                    |
| `compositeItem` | Boolean   | Default `false`                                    |
| `trackStock`    | Boolean   | Default `true` — disabling skips stock decrement   |
| `color`         | String    | Hex color for POS tile, default `#3b82f6`          |
| `shape`         | String    | POS tile shape: `circle`, `square`, etc.           |
| `variants`      | [String]  | Optional variant labels                            |

### Sale

| Field           | Type    | Notes                                        |
|-----------------|---------|----------------------------------------------|
| `items`         | Array   | `{ itemId, name, quantity, price, cost }`    |
| `subtotal`      | Number  | Pre-discount total                           |
| `discountAmount`| Number  | Amount deducted                              |
| `discountLabel` | String  | Name of applied discount (if any)            |
| `total`         | Number  | Final charged amount                         |
| `paymentMethod` | String  | `cash`, `card`, or `wallet`                  |
| `amountReceived`| Number  | For cash payments                            |
| `change`        | Number  | For cash payments                            |
| `customerName`  | String  | Optional                                     |

---

## Frontend Architecture

The frontend communicates with the backend through a thin API service layer in `src/api/`.

```
src/
├── api/
│   ├── client.ts        # Base fetch wrapper — all requests go through here
│   ├── items.ts         # itemsApi.getAll(), .create(), .update(), .delete(), etc.
│   ├── categories.ts    # categoriesApi.*
│   ├── modifiers.ts     # modifiersApi.*
│   ├── discounts.ts     # discountsApi.* + .toggleStatus()
│   ├── analytics.ts     # analyticsApi.getSummary({ startDate, endDate })
│   └── sales.ts         # salesApi.complete(), .getAll(), .getById()
└── types/
    └── index.ts         # Item, Category, Modifier, Discount, Sale, Analytics types
```

The `VITE_API_URL` environment variable controls the base URL. If not set, it defaults to `http://localhost:5000/api`.

```
VITE_API_URL=http://localhost:5000/api
```

---

## Features

### Settings

All settings are saved to `localStorage` and take effect immediately on Apply. No backend call is needed.

| Setting | Where it reflects |
|---|---|
| **Store Name** | Sidebar header, top bar description |
| **Store Tagline** | Sidebar subtitle beneath the store name |
| **Currency Code** | All `Intl.NumberFormat` calls (e.g. `PHP`, `USD`, `SGD`) |
| **Currency Symbol** | POS input prefix labels |
| **Locale** | Number/currency formatting (e.g. `en-PH`, `en-US`) |
| **Tax Rate (%)** | Calculated and displayed in POS checkout total |
| **Receipt Footer** | Appended to sale confirmation output |
| **Default Low Stock Threshold** | Pre-fills the Low Stock filter dropdown in Items |

Clicking **Reset to Defaults** removes the saved entry from `localStorage` and reverts all values to the compiled defaults.

---

### Dashboard
- Sales summary with gross sales, refunds, discounts, net sales, and gross profit
- Period-over-period percentage change for each metric
- Sales trend line chart (daily)
- Sales by category (pie chart)
- Sales by payment type (pie + breakdown list)
- Receipt count analysis
- Discount usage report
- Date range filter

### Inventory — Items
- Full CRUD with inline table
- Filter by category, stock status, and search
- CSV import (upsert by SKU) and CSV export
- Bulk selection and delete
- Low Stock tab with custom threshold filtering and alert banner

### Inventory — Categories, Modifiers, Discounts
- Full CRUD modals for each
- Category color picker
- Modifier price (positive add-on or negative reduction)
- Discount type: percentage or fixed amount
- Discount status toggle (ACTIVE / INACTIVE)

### POS (Point of Sale)
- Product grid with category filter and search
- Cart with quantity controls
- Apply preset discounts or enter a custom discount
- Payment methods: Cash (with change calculator), Card, Digital Wallet
- Customer name field
- Completes sale → posts to backend → stock auto-decrements

---

## Loyverse Integration

The backend includes a `LOYVERSE_API_TOKEN` environment variable for the planned Loyverse API integration. When implemented, it will sync inventory data between PharmacyMed and your Loyverse account.

Loyverse API base URL: `https://api.loyverse.com/v1.0`

Recommended sync targets:

| Loyverse Resource | PharmacyMed Model |
|-------------------|-------------------|
| Items             | Item              |
| Categories        | Category          |
| Modifiers         | Modifier          |
| Discounts         | Discount          |
| Receipts          | Sale              |

A suggested location for the integration service: `backend/src/services/loyverseService.js`

---

## Scripts

### Backend

```bash
# From /backend
npm run dev      # Start with nodemon (auto-reload on change)
npm start        # Start without auto-reload (production)
```

### Frontend

```bash
# From project root
npm run dev      # Vite dev server
npm run build    # Production build
npm run preview  # Preview production build locally
```
