# MiniShop

Burmese clothing shop web app — customer storefront + admin panel.
Live: https://clothing-store-d9135.web.app

## Stack

- **Hosting:** Firebase Hosting
- **Database:** Firebase Realtime Database (asia-southeast1)
- **Auth:** Firebase Authentication (email/password) for the admin panel

## Structure

```
site/
  index.html      customer storefront (home, product, cart, checkout, tracking)
  styles.css
  app.js
  admin.html      admin panel (login, dashboard, orders, products, reports, settings)
  admin.css
  admin.js
  images/         product photos + hero banner
firebase.json           hosting config (no-cache HTML, versioned CSS/JS)
database.rules.json     RTDB security rules
seed-products.json      sample product catalog
seed-config.json        sample shop config
```

## Key behaviors

- Public can **create** orders and read a **single order by ID** (tracking); listing all orders is denied.
- Admin access requires Firebase Auth login **plus** UID in `/admins/{uid} = true` in RTDB.
- Product images uploaded in the admin panel are resized (800px max, JPEG q0.75) and stored as **base64 data URLs** in RTDB — no Storage bucket needed.
- `?v=N` query tags on CSS/JS refs (bump on every deploy) + `no-cache` on HTML to avoid stale caches after deploys.

## Deploy

```bash
cd ~/workspace/minishop
firebase deploy --only hosting
```
