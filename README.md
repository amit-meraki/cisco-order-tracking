# Cisco Order Tracking

A simple static web app to manage Cisco orders. No backend required — runs entirely in the browser and stores data in `localStorage`.

## Features

- **Orders table** with columns: Order No, Status, Description, Ticket Number
- **Add** a single order via the form
- **Update** an order by order number (click Edit on a row)
- **Delete** an order by order number (click Delete on a row)
- **Bulk add** — paste a JSON array of orders
- **Bulk update** — paste a JSON array with `orderNo` and fields to change
- **Bulk delete** — paste order numbers (one per line or comma-separated)
- **Search** orders in the table
- **Export / Import** orders as JSON for backup or sharing

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit http://localhost:8080

## Deploy to GitHub Pages (public app)

1. Create a new GitHub repository (e.g. `cisco-order-tracking`).
2. Push this folder to the repo:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Cisco order tracking app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/cisco-order-tracking.git
   git push -u origin main
   ```

3. On GitHub: **Settings → Pages**
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**
5. Choose branch **main** and folder **/ (root)**
6. Save. Your app will be live at:

   `https://YOUR_USERNAME.github.io/cisco-order-tracking/`

## Bulk JSON examples

**Bulk add:**

```json
[
  {"orderNo": "PO-1001", "status": "Pending", "description": "Core switch", "ticketNumber": "INC001"},
  {"orderNo": "PO-1002", "status": "Shipped", "ticketNumber": "INC002"}
]
```

**Bulk update:**

```json
[
  {"orderNo": "PO-1001", "status": "Delivered"},
  {"orderNo": "PO-1002", "status": "Cancelled", "description": "Returned"}
]
```

**Bulk delete:** enter order numbers in the textarea:

```
PO-1001
PO-1002
```

## Notes

- **Order ID** = **Order No** (unique identifier per order)
- Data is stored in the browser only. Clearing site data or using another device/browser will not show the same orders unless you export/import JSON.
- For team-wide shared data, you would need a backend (e.g. Firebase, Supabase) — this app is designed for simple GitHub Pages hosting.
