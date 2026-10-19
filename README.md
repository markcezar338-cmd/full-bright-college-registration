# Fullbright College - Student Registration System

A professional, responsive Student Registration System built with HTML5, CSS3, Vanilla JavaScript, Bootstrap 5, and Supabase (Authentication, PostgreSQL Database, Storage).

## Project Structure

```
Student-Registration-System/
├── index.html                  # Home page
├── login.html                  # Login page
├── register.html               # Student registration form
├── student-dashboard.html      # Student dashboard
├── registrar-dashboard.html    # Registrar dashboard
├── admin-dashboard.html        # Admin dashboard
├── profile.html                # Profile page
├── about.html                  # About page
├── contact.html                # Contact page
├── privacy.html                # Privacy policy
├── terms.html                  # Terms and conditions
├── 404.html                    # 404 error page
├── css/
│   ├── style.css               # Main stylesheet
│   └── responsive.css          # Responsive styles
├── js/
│   ├── supabase-config.js      # Supabase client configuration
│   ├── auth.js                   # Authentication logic (Supabase)
│   ├── login.js                  # Login page logic
│   ├── register.js               # Registration page logic
│   ├── dashboard.js              # Student dashboard logic
│   ├── admin.js                  # Admin dashboard logic
│   ├── registrar.js              # Registrar dashboard logic
│   └── validation.js             # Form validation
├── images/
│   └── logo.png                # School logo (add your own)
├── sql/
│   └── schema.sql              # Supabase database schema
└── README.md
```

## Supabase Setup Guide

### Step 1: Create a Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Enter:
   - **Organization**: Create or select one
   - **Project Name**: `fullbright-college-registration`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Select closest to your location
4. Click **Create new project**
5. Wait for the project to be provisioned (1-2 minutes)

### Step 2: Get Your Supabase Credentials
1. In Supabase Dashboard, go to **Settings** > **API**
2. Copy the **Project URL** (looks like `https://xyzcompanyid.supabase.co`)
3. Copy the **anon (public) key**

### Step 3: Update supabase-config.js
1. Open `js/supabase-config.js` in Visual Studio Code
2. Replace the placeholder values:

```javascript
const SUPABASE_URL = "https://xyzcompanyid.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Step 4: Set Up the Database Schema
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open the file `sql/schema.sql` from this project
4. Copy the entire contents and paste into the SQL Editor
5. Click **Run**

This will create all the necessary tables:
- `users` — user accounts with roles (student, registrar, admin)
- `student_registrations` — student registration data
- `courses` — course catalog
- `sections` — section catalog
- `settings` — website settings
- `logs` — activity logs

### Step 5: Configure Authentication
1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Go to **Authentication** > **Settings**
4. Configure email confirmation as needed (for production, enable email confirmation)

### Step 6: Set Up Storage
1. In Supabase Dashboard, go to **Storage**
2. Click **New Bucket**
3. Name it: `profile_pictures`
4. Set it to **Public** (so profile pictures can be viewed)
5. Click **Create bucket**

### Step 7: Configure Row Level Security (RLS)
After running the SQL schema, RLS policies are already set up. The key policies are:
- **Users**: Users can read/update their own data. Admins can read/write all users.
- **Student Registrations**: Authenticated users can read all registrations. Students can insert their own. Admins and registrars can update.
- **Courses & Sections**: Anyone can read. Only admins can write.
- **Settings**: Anyone can read. Only admins can write.
- **Logs**: Authenticated users can insert. Anyone can read.

### Step 8: Create Default Accounts

#### Create Admin Account
1. In Supabase Dashboard, go to **Authentication** > **Users**
2. Click **Add user**
3. Email: `admin@fullbright.edu`
4. Password: `Admin123456`
5. Click **Add user**
6. Go to **Table Editor** > `users`
7. Find the admin user and update the row:
   - `role`: `admin`
   - `name`: `System Admin`
   - `student_number`: `ADMIN001`

#### Create Registrar Account
1. Add another user:
   - Email: `registrar@fullbright.edu`
   - Password: `Registrar1234`
2. Update the row in `users` table:
   - `role`: `registrar`
   - `name`: `Registrar Office`
   - `student_number`: `REG001`

#### Create a Test Student Account
1. Register a new student through the website (register.html)
2. Or manually add a user in the `users` table and then create a registration in `student_registrations`

## Default Login Credentials (After Setup)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fullbright.edu | Admin123456 |
| Registrar | registrar@fullbright.edu | Registrar1234 |
| Student | Any registered student email | Their password |

## Deploying to GitHub + Supabase

### Step 1: Initialize Git
```bash
cd "C:\Users\admin\Desktop\Student-Registration-System"
git init
git add .
git commit -m "Initial commit: Student Registration System with Supabase"
```

### Step 2: Create GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Create a new repository: `student-registration-system`
3. Do NOT initialize with README (files already exist)

### Step 3: Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/student-registration-system.git
git branch -M main
git push -u origin main
```

### Step 4: Deploy to Netlify (Recommended for Static Sites)
1. Go to [Netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click **Add new site** > **Import an existing project**
4. Select your `student-registration-system` repository
5. Build settings:
   - **Build command**: (leave empty)
   - **Publish directory**: `.` (root directory)
6. Click **Deploy site**

### Alternative: Deploy to Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Select your Firebase project
5. Set public directory to `.`
6. Deploy: `firebase deploy`

## Features

- Supabase Authentication (Email/Password)
- Role-based access (Student, Registrar, Admin)
- PostgreSQL database for registrations
- Supabase Storage for profile pictures
- Responsive design (Desktop, Tablet, Mobile)
- Dark mode toggle
- Toast notifications
- Loading spinners
- Form validation
- Registration slip PDF download
- Search functionality
- Pagination-ready tables
- Hamburger menu on mobile
- 404 error page
- About, Contact, Privacy, Terms pages

## Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript, Bootstrap 5, Font Awesome 6
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Hosting:** Netlify / Firebase Hosting / GitHub Pages
- **Fonts:** Google Fonts (Poppins)

## Notes for Beginners

1. **Replace `YOUR_SUPABASE_URL_HERE`** in `js/supabase-config.js` with your actual Supabase URL.
2. **Replace `YOUR_SUPABASE_ANON_KEY_HERE`** with your actual anon key.
3. **Add your school logo** to the `images/` folder as `logo.png`.
4. **Run the SQL schema** in Supabase's SQL Editor to create all tables.
5. **Test locally** by opening `index.html` in a browser, or use a local server like Live Server in VS Code.
6. **Never commit your anon key to a public repository** in production. Use environment variables instead.
7. **For production**, enable email confirmation in Supabase Authentication settings.

## Supabase vs Firebase

| Feature | Supabase | Firebase |
|---------|----------|----------|
| Database | PostgreSQL (SQL) | Firestore (NoSQL) |
| Authentication | Built-in | Built-in |
| Storage | Built-in | Built-in |
| Real-time | Built-in | Built-in |
| Pricing | Free tier generous | Free tier generous |
| Querying | Full SQL | Limited queries |
| Scalability | PostgreSQL scales well | Firestore scales well |

## Support

For questions or issues, contact the Fullbright College IT Department at info@fullbright.edu.