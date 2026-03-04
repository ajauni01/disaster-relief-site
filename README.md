# Wayne Disaster Relief Hub

Full-stack disaster response portal implemented with:
- Client: HTML, CSS, JavaScript
- Server: Node.js + Express + Mongoose
- Database: MongoDB

## Features Implemented

- Full homepage experience from the provided ZIP design:
  - Emergency strip + sticky navigation
  - Hero + CTA cards
  - Active alert banner
  - Community status tiles
  - Immediate help shortcuts
  - Live update feed
  - Donation call-to-action
  - Preparedness resources
- Additional pages:
  - `alerts.html`
  - `map.html`
  - `shelters.html`
  - `request-help.html`
  - `volunteer.html`
  - `donations.html`
  - `resources.html`
  - `updates.html`
  - `admin.html`
  - `Events.html` (wired to updates view)
- API-backed forms:
  - Help requests
  - Volunteer signups
  - Donation intents
- Secure admin authentication:
  - Email/password login
  - JWT session
  - Role-based access (`super-admin`, `admin`)
  - Logout flow
- Admin operations:
  - Overview dashboard (requests/volunteers/resources/recent activity)
  - Help request management (filter, details, status update, volunteer assignment)
  - Volunteer management (approve/reject, availability, manual add, remove)
  - Resource inventory management (add/update/remove + low stock tracking)
  - Basic CMS controls (emergency message, hotlines, announcements, publish/unpublish)
  - Basic analytics (urgency distribution, resolved/unresolved, most requested help type)
  - Super admin controls (manage admins, roles, activity log)
- Mongoose schemas for all core entities
- Seeded data for alerts, status tiles, updates, shelters, preparedness resources, inventory, and site content

## Project Structure

- `client/`: static frontend pages + shared `main.js` and `styles.css`
- `server/src/config`: env and database connection
- `server/src/models`: Mongoose schemas
- `server/src/controllers`: business logic
- `server/src/routes`: API routing
- `server/src/data/seedData.js`: initial data seeding
- `server/src/middleware`: error and 404 handling

## Setup

1. Install dependencies:
   ```bash
   cd server
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   ```
3. Set `MONGO_URI` to your MongoDB connection string.
4. Set admin/auth environment values:
   - `JWT_SECRET`
   - `SUPER_ADMIN_EMAIL`
   - `SUPER_ADMIN_PASSWORD`
5. Start server:
   ```bash
   npm run dev
   ```
6. Open app:
   - `http://localhost:3000/`

## API Endpoints

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/alerts`
- `GET /api/updates`
- `GET /api/shelters`
- `GET /api/shelters?openOnly=true`
- `GET /api/resources`
- `GET /api/help-requests`
- `POST /api/help-requests`
- `GET /api/volunteers`
- `POST /api/volunteers`
- `GET /api/donations`
- `POST /api/donations`
- `GET /api/site-info`

### Admin Auth
- `POST /api/admin/auth/login`
- `GET /api/admin/auth/me`
- `POST /api/admin/auth/logout`

### Admin Dashboard/Analytics
- `GET /api/admin/overview`
- `GET /api/admin/analytics`

### Admin Help Requests
- `GET /api/admin/help-requests`
- `GET /api/admin/help-requests/:id`
- `PATCH /api/admin/help-requests/:id/status`
- `PATCH /api/admin/help-requests/:id/assign-volunteer`

### Admin Volunteers
- `GET /api/admin/volunteers`
- `POST /api/admin/volunteers`
- `PATCH /api/admin/volunteers/:id/approval`
- `PATCH /api/admin/volunteers/:id/availability`
- `DELETE /api/admin/volunteers/:id`

### Admin Inventory
- `GET /api/admin/inventory`
- `POST /api/admin/inventory`
- `PATCH /api/admin/inventory/:id`
- `DELETE /api/admin/inventory/:id`

### Admin CMS
- `GET /api/admin/cms`
- `PUT /api/admin/cms/emergency-message`
- `PUT /api/admin/cms/hotlines`
- `POST /api/admin/cms/announcements`
- `PATCH /api/admin/cms/announcements/:announcementId/publish`

### Super Admin
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id/role`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/activity-logs`

## Notes

- The server serves static frontend files directly from `client/`.
- On startup, seed data is inserted only if collections are empty.
