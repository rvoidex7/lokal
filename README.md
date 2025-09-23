# Lokal Cafe Web Application

This is a comprehensive community management platform for Lokal Cafe, built with Next.js, TailwindCSS, and Supabase.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Feature Overview

*   **User Role System**: Admin, Member, and Club Member roles.
*   **Social Groups & Membership**: Users can request to join social groups.
*   **Club Comment Wall**: Real-time discussion walls for each group.
*   **Enhanced Announcement System**: General and club-specific announcements.
*   **Activity Management**: Admin-created and user-requested activities.
*   **Loyalty & Birthday System**: Automated coffee voucher rewards.

---

## Environment Variable Setup

To run the application locally, you must create a `.env.local` file in the root of the project and add the following variables.

### Supabase Configuration

These are required for the database, authentication, and real-time features.

```env
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

### File Uploads (UploadThing)

These are required for handling image and file uploads.

```env
UPLOADTHING_SECRET="your_uploadthing_secret"
UPLOADTHING_APP_ID="your_uploadthing_app_id"
```

### Notification System Configuration

The following variables are essential for the email and SMS notification systems to function correctly.

#### Email Notifications (Resend)

The email system uses [Resend](https://resend.com) to send transactional emails.

```env
# Get this from your Resend API Keys dashboard.
RESEND_API_KEY="your_actual_resend_api_key"

# The base URL of your application, used for constructing links in emails.
# For local development, this should be http://localhost:3000
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

**Production Note:** The default sending address in the email API route (`app/api/send-email/route.ts`) is set to `onboarding@resend.dev`. For your application to work in a production environment, you **must** [verify a domain with Resend](https://resend.com/domains) and update this address to use your verified domain (e.g., `noreply@yourdomain.com`).

#### SMS Notifications (Twilio)

The SMS system uses [Twilio](https://www.twilio.com) to send SMS messages.

```env
# Get these credentials from your Twilio Console Dashboard.
TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"

# This is the phone number you have purchased or provisioned in Twilio.
# It must be in E.164 format (e.g., +1234567890).
TWILIO_PHONE_NUMBER="your_twilio_phone_number"
```

**Important:** After updating your `.env.local` file with any of these variables, you **must restart your development server** for the changes to take effect.
