# Put BilimBank online (no terminal needed)

You will use four free websites: **Supabase** (database and sign-in), **GitHub** (stores the code), **Vercel** (runs the site) and, later, **Resend** (emails). Plan about 40 minutes. Everything happens in your web browser.

---

## Part 1 · Supabase: the database (about 10 minutes)

1. Go to **supabase.com** → sign in → **New project**.
   - Name: `bilimbank`
   - Database password: press **Generate** and save it somewhere safe.
   - Region: **Central EU (Frankfurt)** is the closest to Uzbekistan.
   - Press **Create new project** and wait about 2 minutes.
2. In the left menu open **SQL Editor** → **New query**.
3. Open the file `supabase/bilimbank.sql` from this folder, copy **everything**, paste it into the editor and press **Run**. You should see "Success. No rows returned."
4. Open **Project Settings → API Keys** (on older dashboards: **Project Settings → API**). Copy three things into a notepad:
   - **Project URL** (looks like `https://abcd.supabase.co`)
   - **anon / publishable** key
   - **service_role / secret** key (keep this one private)

## Part 2 · GitHub: store the code (about 5 minutes)

1. Go to **github.com** → **New repository** → name `bilimbank` → choose **Private** → **Create repository**.
2. On the new page click **uploading an existing file**.
3. Unzip `bilimbank.zip` on your computer. Open the `bilimbank` folder, select **everything inside it** (all files and folders) and drag it into the GitHub page. Press **Commit changes**.
   - If GitHub says there are too many files, upload the `src` folder first, commit, then upload the rest.

## Part 3 · Vercel: make it a website (about 10 minutes)

1. Go to **vercel.com** → **Sign up with GitHub**.
2. **Add New → Project** → choose `bilimbank` → **Import**.
3. Open **Environment Variables** and add these (name on the left, value on the right):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon / publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service_role / secret key |
   | `CRON_SECRET` | any long random text, for example `bb-7f3k29-xq81-lm55` |
   | `NEXT_PUBLIC_SITE_URL` | leave for now (step 5) |

4. Press **Deploy**. After 2–3 minutes you get your address, like `https://bilimbank-abc.vercel.app`.
5. Go to **Settings → Environment Variables**, add `NEXT_PUBLIC_SITE_URL` = your address (no `/` at the end). Then **Deployments → ⋯ → Redeploy**.
6. Back in **Supabase → Authentication → URL Configuration**:
   - **Site URL**: your address
   - **Redirect URLs**: add `https://YOUR-ADDRESS/**`

Your site is now live. Anyone can open it, sign up with email and password, confirm the email, and join.

## Part 4 · Make yourself the admin (2 minutes)

1. Open your site and sign up with your own email. Confirm the email and finish the setup steps.
2. In **Supabase → SQL Editor**, run this (put your email in):
   ```sql
   update profiles set role = 'admin'
   where id = (select id from auth.users where email = 'YOUR@EMAIL.COM');
   ```
3. Reload the site. Your account menu now has **Admin**. Other people get a "page not found" there.

---

## Part 5 · Emails for bookings (optional, recommended)

Sign-up confirmation and password emails already work through Supabase, but Supabase only sends a few per hour. For real use:

1. Create a free account at **resend.com**. Add your domain (for example `bilimbank.uz`) and add the DNS records it shows you at your domain seller. Resend can only send to *other people* after the domain is verified.
2. Create an **API key** in Resend.
3. In Vercel add `RESEND_API_KEY` = the key and `EMAIL_FROM` = `BilimBank <hello@your-domain>` → Redeploy.
4. Make sign-up emails reliable too: **Supabase → Authentication → Emails → SMTP Settings** → turn on custom SMTP with host `smtp.resend.com`, port `465`, user `resend`, password = your Resend API key.
5. Reminders (24 h and 1 h before): Vercel's free plan runs the scheduler once a day. For reminders on time, in **Supabase → Database → Extensions** turn on `pg_cron` and `pg_net`, then open `supabase/scheduled-jobs.sql`, put in your address and `CRON_SECRET`, and run it in the SQL editor.

Until email is set up, the Admin page shows "Email sending: Not configured" and no booking emails are sent. Everything else works.

## Part 6 · Automatic Google Meet links (optional)

Without this, teachers paste their own Meet link when they confirm (the site checks it is a real `meet.google.com` link).

1. Go to **console.cloud.google.com** → create a project `BilimBank`.
2. **APIs & Services → Library** → enable **Google Calendar API**.
3. **OAuth consent screen** → External → fill in the app name and your email → add the scope `.../auth/calendar.events` → add your teachers' Gmail addresses as **Test users**.
4. **Credentials → Create credentials → OAuth client ID** → Web application → Authorized redirect URI: `https://YOUR-ADDRESS/api/google/callback`.
5. Copy the **Client ID** and **Client secret** into Vercel as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` → Redeploy.
6. Each teacher opens **Settings → Account and privacy → Connect Google Calendar** once. After that, confirming a session creates the calendar event, invites the learner by email and saves a fresh Meet link.

Google allows up to 100 test users while the app is in testing. To open it to everyone, submit the consent screen for Google verification.

**Sign in with Google (optional):** in **Supabase → Authentication → Providers → Google**, paste the same client ID and secret, and add `https://YOUR-PROJECT.supabase.co/auth/v1/callback` as another redirect URI in Google. Then set `NEXT_PUBLIC_GOOGLE_SIGNIN=true` in Vercel and redeploy.

---

## Quick check after launch

- Sign up two accounts (use two browsers). Both get 10 credits.
- Account A adds a skill and free times. Account B finds A in **Explore skills** and books.
- A confirms, both see the session. After the session time, both press **Confirm it happened**: A gets the credit.
- Account B cannot open `/admin`.
