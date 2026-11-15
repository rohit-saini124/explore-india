# Explore India

A simple **Travel Discovery and Booking Enquiry Management System** built for a college project.

## Features

- Home page with popular destinations and project information.
- Destinations page with search, category filters and image browsing.
- Packages page with search, category filters, sorting and package details.
- Booking enquiry form that saves enquiries in PostgreSQL.
- Admin login.
- Admin dashboard to view enquiries, update their status and add/edit/delete packages.

This is an enquiry system, not a payment or real-time reservation system.

## Technology

- HTML, CSS and JavaScript
- Node.js and Express
- PostgreSQL
- `pg` package for database connection
- Express Session for admin login

## Setup

### 1. Install Node.js and PostgreSQL

Make sure Node.js, npm and PostgreSQL are installed, or create a PostgreSQL database with a hosted provider such as Supabase.

### 2. Create the database

Create a database named `explore_india` in PostgreSQL. For example, in pgAdmin's Query Tool:

```sql
CREATE DATABASE explore_india;
```

### 3. Configure environment variables

Copy `.env.example` and name the copy `.env`.

Set `DATABASE_URL` to your PostgreSQL connection string and set your own `SESSION_SECRET`, `ADMIN_USERNAME` and `ADMIN_PASSWORD`. For Supabase or another hosted provider that requires SSL, set `PGSSL=true`; keep `PGSSL=false` for a normal local PostgreSQL installation.

Example local connection string:

```text
postgresql://postgres:YOUR_PASSWORD@localhost:5432/explore_india
```

Do not upload `.env` to GitHub.

### 4. Install project packages

Run this command in the project folder:

```bash
npm install
```

### 5. Create tables and sample data

```bash
npm run init-db
```

This creates the tables and adds 20 sample destinations and packages. It does not delete existing enquiries. Existing sample packages with the same names are updated rather than duplicated.

The admin user is created from the `ADMIN_USERNAME` and `ADMIN_PASSWORD` values in `.env` if that username does not already exist. The simple session setup is intended for this college project/demo; it is not a production-grade multi-server session store.

### 6. Start the website

```bash
npm start
```

Open:

```text
http://localhost:3000
```

Do not open the HTML files directly from File Explorer. Use the Express server so the API and database connection work.

## Admin

Open `http://localhost:3000/admin-login.html` and use the username and password configured in `.env` when the admin account was first created.

## Main database tables

- `destinations`: places users can explore.
- `packages`: packages linked to a destination through `destination_id`.
- `enquiries`: enquiries submitted through the booking form.
- `admins`: admin usernames and password hashes.

The booking API checks that a selected package belongs to the selected destination before saving the enquiry.
