# Explore India

Explore India is a simple travel website developed as a college project. It helps users explore different destinations in India, view travel packages and submit booking enquiries.

This project is built using HTML, CSS, JavaScript, Node.js, Express and PostgreSQL.

## Features

- **Home Page:** Displays popular destinations and information about the website.
- **Destinations:** Allows users to explore destinations and search for places.
- **Travel Packages:** Displays available packages with search, filters and sorting options.
- **Booking Enquiry:** Allows users to submit their travel details through an enquiry form.
- **Admin Login:** Provides login access for the admin.
- **Admin Dashboard:** Allows the admin to view enquiries, update their status and manage travel packages.

*Note: This website is only for submitting travel enquiries. It does not provide online payments or confirmed reservations.*

## Technologies Used

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- PostgreSQL

## How to Run the Project

Follow these steps to run the project on your computer.

### Step 1: Install the Required Software

Make sure you have installed:

- [Node.js]
- [PostgreSQL]

You can use pgAdmin to manage your PostgreSQL database.

### Step 2: Create the Database

Open pgAdmin and create a new database named:

`explore_india`

You can also create it using this SQL command:

```sql
CREATE DATABASE explore_india;
```

### Step 3: Configure the Environment File

In the main project folder, find the `.env.example` file.

Make a copy of it and rename the copy to `.env`.

Open `.env` and enter your PostgreSQL connection details, admin username and password.

For example:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/explore_india

PGSSL=false

SESSION_SECRET=your_secret_key

ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

Keep `.env` private. Do not upload it to GitHub.

### Step 4: Install Project Dependencies

Open the terminal in the main project folder and run:

```bash
npm install
```

This installs the packages required to run the project.

### Step 5: Set Up the Database

Run:

```bash
npm run init-db
```

This command creates the required database tables and adds sample destinations and travel packages.

It also creates the admin account if it does not already exist.

### Step 6: Start the Website

Run the following command:

```bash
npm start
```

Once the server starts, open your browser and visit:

```text
http://localhost:3000
```

The website should now be running.

## Admin Login

To open the admin login page, visit:

```text
http://localhost:3000/admin-login.html
```

Use the admin username and password configured in the `.env` file when the admin account was created.

## Database Tables

The project uses PostgreSQL and contains the following main tables:

- **destinations:** Stores information about travel destinations.
- **packages:** Stores travel packages linked to destinations.
- **enquiries:** Stores the enquiries submitted by users.
- **admins:** Stores admin login details.

  ## Team Contributions

The project was developed by a team of three members. Each member worked on different modules of website.

| Team Member | Contributions |
|---|---|
| [Rohit](https://github.com/rohit-saini124) | Home page, Booking Enquiry module and integration of frontend with backend and database. |
| [Dishank Verma](https://github.com/Dishankverma) | Destinations module, including destination display, search, filters and related things. |
| [B Niteesh](https://github.com/niteesh-nayak) | Travel Packages module and Admin module, including package management and enquiry management. |

All team members contributed to developing their respective modules.

