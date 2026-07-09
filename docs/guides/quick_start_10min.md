================================================================================
QUICK START — GET SIGN-IN WORKING IN 10 MINUTES
================================================================================

STEP 1: CREATE SUPABASE PROJECT (3 minutes)
1. Go to https://supabase.com
2. Click "Start your project" → Sign up with GitHub
3. Click "New project"
   - Name: stanfliet-ota-energy
   - Database Password: Generate and SAVE it
   - Region: Cape Town (South Africa) or Frankfurt (Europe)
   - Free plan
   - Click "Create new project" and wait

STEP 2: GET YOUR API KEYS (1 minute)
In Supabase dashboard:
1. Click the gear icon (Project Settings) on the left
2. Click "API" in the menu
3. Copy these 3 values to Notepad:
   a. Project URL (SUPABASE_URL)
   b. anon public key (SUPABASE_ANON_KEY)
   c. service_role key (SUPABASE_SERVICE_KEY)

STEP 3: CREATE THE DATABASE TABLES (2 minutes)
1. In Supabase, click "SQL Editor" on the left
2. Click "+ New Query"
3. Open file: docs\supabase_schema.sql
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click "Run" (the play button)
7. Verify: Click "Table Editor" → you should see 11 tables

STEP 4: ADD KEYS TO RENDER (2 minutes)
1. Go to https://dashboard.render.com
2. Click on your web service: stanfliet-ota-api
3. Click "Environment" tab
4. Click "Add Environment Variable"
5. Add these (replace YOUR values):

   SUPABASE_URL = https://YOURPROJECT.supabase.co
   SUPABASE_ANON_KEY = anon-key-you-copied
   SUPABASE_SERVICE_KEY = service-role-key-you-copied
   JWT_SECRET = any-random-string-you-make-up
   CORS_ORIGIN = https://stanfliet-ota-energy-system.vercel.app
   NODE_ENV = production
   MQTT_HOST = broker.hivemq.com
   MQTT_PORT = 1883

6. Click "Save Changes"
7. Go to "Manual Deploy" → "Deploy latest commit"

STEP 5: TEST (1 minute)
1. Wait for deploy to finish (check logs for "Server running")
2. Go to https://stanfliet-ota-energy-system.vercel.app
3. Sign in with: test@stanfliet.co.za / test1234
4. OR click "Create Account" and sign up with any email
5. After login, you'll see your dashboard with meters and stats

================================================================================
TROUBLESHOOTING
================================================================================

"Invalid credentials":
→ Make sure you ran the SQL (Step 3) to create tables and seed the test user
→ Try creating a NEW account via the Sign Up form

"Connection refused" or "Cannot connect":
→ Check Render logs for errors
→ Verify the 3 Supabase environment variables are correct
→ Make sure the deploy was successful (green checkmark)

"Page not loading":
→ Vercel might need a redeploy (push to GitHub triggers auto-deploy)
→ Check: git push origin main

================================================================================
END OF QUICK START
================================================================================
