# RentCampy

## PostgreSQL and local development

The app uses PostgreSQL for users and products. The Express API creates the `users` and `products` tables the first time it starts.

1. Install PostgreSQL and create an empty database:

   ```powershell
   psql -U postgres -c "CREATE DATABASE rentcampy;"
   ```

2. Copy `.env.example` to `.env` and set your PostgreSQL password, a random `JWT_SECRET` (at least 32 characters), and the admin email/password. Use an admin password of at least 12 characters.

   ```powershell
   Copy-Item .env.example .env
   ```

3. Install dependencies and create the database tables/admin account:

   ```powershell
   npm install
   npm run db:seed-admin
   ```

4. Start the API and frontend in separate terminals:

   ```powershell
   npm run server
   ```

   ```powershell
   npm run dev
   ```

   Open the Vite URL (usually `http://localhost:5173`). The Vite development server proxies `/api` requests to the API on port `3001`.

The admin credentials are the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values in `.env`; new registrations are regular users. Product create, update, and delete endpoints require an admin token. Passwords are stored as bcrypt hashes. The previous MockAPI catalog is no longer queried or automatically imported; add products from the admin page after starting the app.
