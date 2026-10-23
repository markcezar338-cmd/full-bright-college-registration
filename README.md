# Fullbright College - Student Registration System

A professional, responsive Student Registration System built with HTML5, CSS3, Vanilla JavaScript, Bootstrap 5, and Supabase (Authentication, PostgreSQL Database, Storage).

## Project Structure

```
Student-Registration-System/
├── index.html                  # Home page
├── login.html                  # Login page
├── reset-password.html         # Set a new password from a reset email
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
│   ├── reset-password.js         # Password reset completion logic
│   ├── register.js               # Registration page logic
│   ├── dashboard.js              # Student dashboard logic
│   ├── admin.js                  # Admin dashboard logic
│   ├── registrar.js              # Registrar dashboard logic
│   └── validation.js             # Form validation
├── images/
│   └── logo.svg                # School logo (replace with your own if desired)
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
3. Copy the **Publishable key**. If your dashboard only shows legacy keys, use the **anon (public)** key.
   Do not use the `service_role` or secret key in a website.

### Step 3: Update supabase-config.js
1. Open `js/supabase-config.js` in Visual Studio Code
2. Replace the placeholder values:

```javascript
const SUPABASE_URL = "https://xyzcompanyid.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_your_key_here";
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

### Step 4b: Apply the incremental database fixes
If the database was created before the duplicate-check, admin-delete, and
status-protection fixes, open a new SQL Editor query, paste `sql/admin-fixes.sql`,
and click **Run**. It is safe to run again and does not modify student records.

### Step 5: Configure Authentication
1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Enable **Email** provider
3. For first-time testing, disable **Confirm email** so a new account can immediately create its registration record.
4. Keep **Confirm email** disabled for this static site. The registration page must create the `public.users` and `student_registrations` rows immediately after signup; enabling confirmation requires a backend job before that can happen.

### Step 5b: Configure Password Reset URLs
Forgot Password sends the user to `reset-password.html`. Supabase must allow that address.

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**.
2. Set **Site URL** to the address where the site is running.
   - For local testing: `http://localhost:5500` (use your actual local server port if it is different).
   - For production: your deployed address, such as `https://your-site.netlify.app`.
3. Under **Redirect URLs**, add:
   - `http://localhost:5500/reset-password.html`
   - `https://your-site.netlify.app/reset-password.html` after deployment
4. Click **Save**.

If a requested redirect is not in the allow list, Supabase falls back to the Site URL. That is why a reset link can point to `localhost:3000` or only work on the computer running the local server. Always request a new reset email after changing these settings because older emails still contain the old address.

Open the project through a local web server (for example, VS Code Live Server on port 5500), not by double-clicking the HTML file. A `localhost` reset link can only open on the computer that is running that local server; deploy the site before testing the email link on a phone or another computer.

### Step 6: Set Up Storage
1. In Supabase Dashboard, go to **Storage**
2. Click **New Bucket**
3. Name it: `profile_pictures`
4. Set it to **Public** (so profile pictures can be viewed)
5. Click **Create bucket**

### Step 7: Create Admin and Registrar Accounts
1. Go to **Authentication** > **Users** > **Add user** and create an email/password account for each staff member.
2. In **SQL Editor**, run the matching command (replace the email):

```sql
INSERT INTO public.users (id, email, role)
SELECT id, email, 'admin' FROM auth.users WHERE email = 'admin@example.com'
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

INSERT INTO public.users (id, email, role)
SELECT id, email, 'registrar' FROM auth.users WHERE email = 'registrar@example.com'
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
```

3. Log in at `login.html`, selecting **Admin** or **Registrar** to match the account role.

### Step 8: Configure Row Level Security (RLS)
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
4. Password: choose a strong, unique password and store it in a password manager. Never commit it to this repository.
5. Click **Add user**
6. Go to **Table Editor** > `users`
7. Find the admin user and update the row:
   - `role`: `admin`
   - `name`: `System Admin`
   - `student_number`: `ADMIN001`

#### Create Registrar Account
1. Add another user:
   - Email: `registrar@fullbright.edu`
   - Password: choose a strong, unique password and keep it private.
2. Update the row in `users` table:
   - `role`: `registrar`
   - `name`: `Registrar Office`
   - `student_number`: `REG001`

#### Create a Test Student Account
1. Register a new student through the website (register.html)
2. Or manually add a user in the `users` table and then create a registration in `student_registrations`

## Staff Login Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fullbright.edu | Set during setup; keep private |
| Registrar | registrar@fullbright.edu | Set during setup; keep private |
| Student | Any registered student email | Their own password |

Never store working passwords in a public repository, README, or screenshot.

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
3. **Replace the supplied school logo** in the `images/` folder if desired.
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
