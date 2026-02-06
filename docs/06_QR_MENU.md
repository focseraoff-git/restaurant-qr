# 📱 QR Menu System - User Guide

The **QR Menu** is the customer-facing part of Focsera OS. It allows diners to scan a code on their table, view the menu, and place orders directly from their smartphones without downloading an app.

## 1. How It Works
1.  **Scan**: The customer opens their phone camera and scans the QR code on the table.
2.  **Browse**: They are taken to a beautiful, mobile-optimized menu (Dark/Glass theme).
3.  **Order**: They select items, customize preferences (e.g., "Spicy"), and place the order.
4.  **Kitchen Sync**: The order instantly appears on the **Kitchen Admin OS** and **Counter Dashboard** (marked as "Pending").

## 2. Setting Up Tables
To generate QR codes effectively:
1.  Go to **Admin Settings** (or Database).
2.  Ensure you have created entries in the `tables` database.
3.  Each table has a unique ID/Number (e.g., T-1, T-5).
4.  The URL structure for the QR code is:
    `https://your-domain.com/menu/:restaurantId/:tableId`

## 3. Customer Features
*   **Visual Menu**: High-quality images for items.
*   **Veg/Non-Veg Indicators**: Clear dietary markers.
*   **Call for Service**: (Upcoming) A button to summon a waiter.
*   **Bill Request**: (Upcoming) A button to request the final bill.

## 4. Updates & Pricing
*   Any price change or item availability toggle made in the **Inventory** or **Counter OS** reflects immediately on the QR Menu. No need to reprint paper menus.
