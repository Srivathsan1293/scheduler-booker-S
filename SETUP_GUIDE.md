# Database Setup Guide

## 0. Configure Your App Domain

Create `.env.local` from `.env.example` and set `NEXT_PUBLIC_APP_URL` to your real deployed domain.

This value is used in signup and volunteer invitation email redirects. If it is missing, email links can fall back to a local development origin.

## 1. Run the Database Migration

Copy and paste the contents of `supabase-migrations.sql` into your Supabase SQL editor and run it.

## 2. Test the Integration

1. **Set your working hours** in the settings modal (gear icon)
2. **Click "Save Settings"** to persist to database
3. **Click on any calendar day** - it should now generate time slots automatically
4. **Time slots will be saved** to the database and persist between sessions

## 3. How It Works Now

- **Settings are saved** to `user_availability_settings` table
- **Working hours are saved** to `user_working_hours` table
- **Time slots are generated** automatically based on your settings
- **Data persists** between browser sessions
- **Each user has their own** availability data

## 4. Troubleshooting

If you still see "No time slots configured":

1. Make sure you've saved your working hours in settings
2. Check the browser console for any errors
3. Verify the database tables were created successfully
4. Ensure your user is authenticated

## 5. Database Tables Created

- `user_availability_settings` - Your slot duration, break duration, etc.
- `user_working_hours` - Default working hours for each day
- `user_availability_exceptions` - Specific date overrides
- `user_time_slots` - Generated time slots for each date
