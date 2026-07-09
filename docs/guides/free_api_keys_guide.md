================================================================================
STANFLEIT OTA ENERGY SYSTEM — FREE API KEYS SETUP GUIDE
================================================================================
Total cost: $0/month (all services are free tier)
Last Updated: July 2026

================================================================================
1. DATABASE: Supabase (PostgreSQL) — FREE FOREVER
================================================================================

Supabase is the BEST option because it's free forever (no 30-day expiry).

Free tier includes:
- 500 MB PostgreSQL database
- 50,000 monthly active users
- Unlimited API requests
- Built-in auth, real-time, storage
- Daily backups

HOW TO SETUP:
1. Go to https://supabase.com
2. Click "Start your project" → Sign up with GitHub
3. Click "New project"
   - Name: stanfliet-ota-energy
   - Database Password: Generate a strong password (SAVE THIS)
   - Region: Choose "South Africa (Cape Town)" or "Europe (Frankfurt)"
   - Pricing Plan: Free
   - Click "Create new project" (wait 1-2 min)

4. After creation, go to Project Settings → API
   Copy these values:

   SUPABASE_URL = https://YOURPROJECT.supabase.co
   SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (long string)
   SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (long string)

5. Go to SQL Editor → New Query → Paste contents of docs/supabase_schema.sql → Run

DATABASE_URL you can derive:
   postgresql://postgres:YOUR_DB_PASSWORD@db.YOURPROJECT.supabase.co:5432/postgres

But you DON'T need DATABASE_URL if you use Supabase client (which we are).

================================================================================
2. MQTT BROKER: HiveMQ Cloud — FREE FOREVER
================================================================================

HiveMQ offers a free public MQTT broker AND a free cloud broker.

OPTION A: HiveMQ Public Broker (No signup needed, but public):
   MQTT_HOST = broker.hivemq.com
   MQTT_PORT = 1883 (TCP) or 8883 (TLS)
   MQTT_USERNAME = (leave blank)
   MQTT_PASSWORD = (leave blank)

OPTION B: HiveMQ Cloud Free (100 MQTT connections, 10 messages/sec):
1. Go to https://www.hivemq.com/mqtt-cloud-broker/
2. Click "Get Started Free" → Sign up
3. Create a new cluster → Select "Free" tier
4. After creation, go to Cluster Details
5. Under "Connection Guide" you'll get:

   MQTT_HOST = YOURCLUSTER.s1.eu.hivemq.cloud
   MQTT_PORT = 8883 (MQTT over TLS)
   MQTT_USERNAME = YOUR_USERNAME (you created during signup)
   MQTT_PASSWORD = YOUR_PASSWORD

================================================================================
3. STORAGE: Supabase Storage (instead of AWS S3) — FREE FOREVER
================================================================================

You DON'T need AWS S3. Supabase Storage is free:

- 1 GB storage included
- Built into your Supabase project
- Same API keys as database

OR use the Render free tier for file storage.
OR use Cloudflare R2 (10 GB free, no egress fees):
   https://www.cloudflare.com/developer-platform/r2/

For now, skip AWS S3 entirely. Set these fake values:
   AWS_ACCESS_KEY_ID = skip_for_now
   AWS_SECRET_ACCESS_KEY = skip_for_now
   AWS_S3_BUCKET = skip_for_now

================================================================================
4. SMS NOTIFICATIONS: Twilio Verify — FREE TRIAL / Termii
================================================================================

FREE OPTIONS:

OPTION A: Twilio ($15 free credit, no expiry):
1. Go to https://www.twilio.com/try-twilio
2. Sign up (get $15 free credit)
3. Go to Console → Get a phone number
4. Get your Account SID and Auth Token
5. SMS cost: ~$0.0079 per SMS to SA numbers
   $15 credit = ~1,900 free SMS

OPTION B: Termii (African-focused, free tier):
   https://termii.com/
   Has free trial for African countries

OPTION C: Use email instead (free via Supabase):
   Skip SMS for now, use email receipts via Supabase built-in email.

For now, set:
   SMS_API_KEY = skip_for_now_or_use_twilio

================================================================================
5. EMAIL: Supabase Built-in — FREE FOREVER
================================================================================

Supabase has built-in email for auth (password reset, verification).

For transactional emails (receipts), use Supabase's built-in email service
or configure a free SendGrid account:
1. Go to https://sendgrid.com
2. Sign up (100 emails/day free forever)
3. Go to Settings → API Keys → Create API Key
4. Copy the key

BUT you can skip SendGrid and use Supabase's email service instead:
   SENDGRID_API_KEY = skip_for_now_use_supabase_email

================================================================================
6. PAYMENT GATEWAYS
================================================================================

All payment gateways require business registration and bank account.
You CANNOT get live keys for free without a registered business.

For TESTING purposes:

PAYFAST (South African):
- Go to https://www.payfast.co.za
- Sign up (requires SA ID, bank account)
- Test mode: Use sandbox keys during development
- Live keys need: Business bank account, FICA verification
- PAYFAST_MERCHANT_ID = sandbox_merchant_id_for_testing
- PAYFAST_MERCHANT_KEY = sandbox_merchant_key_for_testing

STRIPE (International):
- Go to https://stripe.com
- Sign up (free, no credit card needed)
- Go to Developers → API Keys
- Get publishable key and secret key (test mode)
- STRIPE_SECRET_KEY = sk_test_... (test mode key)

YOCO (South African POS):
- Go to https://www.yoco.com
- Requires business registration
- YOCO_SECRET_KEY = test_key_... (sandbox)

For now, set these as test/sandbox keys.

================================================================================
SUMMARY: MINIMUM VIABLE SETUP (what you absolutely need)
================================================================================

To get the app working RIGHT NOW, you only need:

1. SUPABASE (free):
   SUPABASE_URL = https://yourproject.supabase.co
   SUPABASE_ANON_KEY = your-anon-key
   SUPABASE_SERVICE_KEY = your-service-key

2. JWT_SECRET (just a random string you make up):
   JWT_SECRET = stanfliet_ota_jwt_secret_2026_production

3. CORS_ORIGIN:
   CORS_ORIGIN = https://stanfliet-ota-energy-system.vercel.app

EVERYTHING ELSE can be empty/placeholder strings for now:
   MQTT_HOST = broker.hivemq.com (free public broker)
   MQTT_PORT = 1883
   MQTT_USERNAME =
   MQTT_PASSWORD =
   AWS_ACCESS_KEY_ID = placeholder
   AWS_SECRET_ACCESS_KEY = placeholder
   AWS_S3_BUCKET = placeholder
   SENDGRID_API_KEY = placeholder
   SMS_API_KEY = placeholder
   PAYFAST_MERCHANT_ID = placeholder
   PAYFAST_MERCHANT_KEY = placeholder
   STRIPE_SECRET_KEY = placeholder
   YOCO_SECRET_KEY = placeholder

================================================================================
EASY SETUP COMMAND FOR RENDER
================================================================================

When adding environment variables on Render dashboard, copy-paste this:

SUPABASE_URL = https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY = YOUR_ANON_KEY
SUPABASE_SERVICE_KEY = YOUR_SERVICE_ROLE_KEY
JWT_SECRET = stanfliet_ota_jwt_secret_2026
CORS_ORIGIN = https://stanfliet-ota-energy-system.vercel.app
NODE_ENV = production
MQTT_HOST = broker.hivemq.com
MQTT_PORT = 1883
MQTT_USERNAME =
MQTT_PASSWORD =

(Leave AWS, SendGrid, SMS, payment keys as empty strings)

================================================================================
END OF FREE API KEYS GUIDE
================================================================================
