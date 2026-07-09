================================================================================
STANFLEIT OTA ENERGY SYSTEM — SUPABASE SETUP GUIDE
================================================================================

================================================================================
STEP 1: CREATE A SUPABASE ACCOUNT
================================================================================

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub or email
4. Free plan includes: 500MB database, 50,000 rows, 2GB bandwidth

================================================================================
STEP 2: CREATE A SUPABASE PROJECT
================================================================================

1. Click "New project"
2. Organization: Create or select one
3. Name: "stanfliet-ota-energy"
4. Database Password: Generate a strong password (save it!)
5. Region: Choose the one closest to your users (South Africa / Europe)
6. Pricing Plan: Free
7. Click "Create new project" (takes 1-2 minutes)

================================================================================
STEP 3: GET YOUR SUPABASE API CREDENTIALS
================================================================================

After the project is created:

1. Go to Project Settings (gear icon) → API
2. You will find:
   - Project URL (e.g., https://yourproject.supabase.co)
   - anon/public key
   - service_role key (keep this SECRET)
3. Copy these three values - you need them for deployment

================================================================================
STEP 4: RUN THE DATABASE SCHEMA
================================================================================

1. In your Supabase dashboard, go to SQL Editor
2. Click "New Query"
3. Open the file: docs/supabase_schema.sql from this project
4. Copy-paste the ENTIRE contents into the SQL Editor
5. Click "Run" (the lightning bolt icon)
6. Wait for it to complete (should show "Success" with no errors)
7. You should see all 11 tables created in the Table Editor

================================================================================
STEP 5: VERIFY THE SEED DATA
================================================================================

1. Go to Table Editor (left sidebar)
2. Click on "users" table
3. You should see one test user: test@stanfliet.co.za
4. Click on "meters" table
5. You should see two test meters: 77012345678 and 77087654321

================================================================================
STEP 6: ADD SUPABASE CREDENTIALS TO RENDER
================================================================================

1. Go to https://dashboard.render.com
2. Find your "stanfliet-ota-api" web service
3. Go to Environment tab
4. Add these environment variables:

   SUPABASE_URL = https://yourproject.supabase.co
   SUPABASE_ANON_KEY = your-anon-key-from-step-3
   SUPABASE_SERVICE_KEY = your-service-role-key-from-step-3
   JWT_SECRET = a-random-secret-string (e.g., generate with: openssl rand -hex 32)
   CORS_ORIGIN = https://stanfliet-ota-energy-system.vercel.app
   NODE_ENV = production

5. IMPORTANT: The SUPABASE_SERVICE_KEY must be kept secret!
   Never expose it in frontend code or public repositories.

================================================================================
STEP 7: DEPLOY AND TEST
================================================================================

1. Push your code to GitHub: git add -A && git commit -m "Supabase setup" && git push
2. Render should auto-deploy
3. Wait for deployment to complete (check logs)
4. Test the API:
   
   curl https://stanfliet-ota-api.onrender.com/
   (should return API info)

   curl -X POST https://stanfliet-ota-api.onrender.com/api/v1/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"test@stanfliet.co.za","password":"test1234"}'
   (should return user data + tokens)

5. Try creating a new account:
   
   curl -X POST https://stanfliet-ota-api.onrender.com/api/v1/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","password":"yourpassword","name":"Your Name"}'

================================================================================
STEP 8: TEST THE FRONTEND
================================================================================

1. Go to https://stanfliet-ota-energy-system.vercel.app
2. You should see the login screen
3. Sign in with: test@stanfliet.co.za / test1234
4. OR create a new account with any email
5. After login you will see the Client Dashboard with:
   - Welcome banner
   - Stats cards (balance, meters, online count)
   - Your meters list (11-digit numbers)
   - Recent transactions
   - AI Assistant floating button (bottom-right)

================================================================================
TROUBLESHOOTING
================================================================================

ISSUE: "Cannot find module '../config/supabase'"
SOLUTION: Run: npm install @supabase/supabase-js bcryptjs --save
          Then verify: backend/src/config/supabase.js exists

ISSUE: "Invalid credentials" on login
SOLUTION: The test user password is "test1234" (not the Supabase DB password)
          If still failing, create a new account via the signup form

ISSUE: Tables not found
SOLUTION: Run the SQL schema again from docs/supabase_schema.sql
          Check that it completed without errors

ISSUE: Frontend not connecting to backend
SOLUTION: Check CORS_ORIGIN on Render matches your Vercel URL exactly
          Frontend uses: https://stanfliet-ota-api.onrender.com

================================================================================
END OF SETUP GUIDE
================================================================================
