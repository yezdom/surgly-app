# Facebook OAuth Setup Guide

## Overview
The Facebook OAuth flow has been moved to a **secure server-side implementation** using Supabase Edge Functions to protect the Facebook App Secret.

## Architecture

```
User clicks "Connect Facebook"
    ↓
Facebook OAuth Dialog (login & authorize)
    ↓
Facebook redirects to: /auth/facebook/callback?code=xxx
    ↓
FacebookCallback.tsx extracts code
    ↓
Calls exchangeCodeForToken(code) in facebookService.ts
    ↓
Edge Function: facebook-oauth-callback
    ├─ Validates user session
    ├─ Exchanges code for access_token (server-side, secure)
    ├─ Stores token in facebook_tokens table
    └─ Fetches businesses & ad accounts
    ↓
Redirects to /settings?tab=integrations&success=facebook_connected
    ↓
Shows "Facebook connected successfully!" toast
```

## Required Environment Variables

### Client-side (.env)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_FACEBOOK_APP_ID=your-facebook-app-id
VITE_FACEBOOK_REDIRECT_URI=https://surgly.app/auth/facebook/callback
```

### Server-side (Supabase Edge Function Secrets)
```bash
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret  # NEVER expose to client
FACEBOOK_REDIRECT_URI=https://surgly.app/auth/facebook/callback
```

## Deploying the Edge Function

The Edge Function must be deployed to Supabase for the OAuth flow to work.

### Using Supabase CLI (if available):
```bash
supabase functions deploy facebook-oauth-callback
```

### Setting Edge Function Secrets:
```bash
supabase secrets set FACEBOOK_APP_ID=your-app-id
supabase secrets set FACEBOOK_APP_SECRET=your-app-secret
supabase secrets set FACEBOOK_REDIRECT_URI=https://surgly.app/auth/facebook/callback
```

### Using the Dashboard (Alternative):
1. Go to Supabase Dashboard → Edge Functions
2. Create new function: `facebook-oauth-callback`
3. Upload the code from: `supabase/functions/facebook-oauth-callback/index.ts`
4. Set environment secrets in Function Settings

## Testing the Complete Flow

1. **Start the app**: User navigates to Settings → Integrations
2. **Click "Connect Facebook"**: Opens Facebook OAuth dialog
3. **Authorize app**: User logs in and grants permissions
4. **Callback**: Facebook redirects to `/auth/facebook/callback?code=xxx`
5. **Token Exchange**:
   - Client calls Edge Function with authorization code
   - Edge Function exchanges code for access token (server-side)
   - Token stored in `facebook_tokens` table
6. **Success**: Redirects to Settings with success toast

## Security Benefits

✅ **Facebook App Secret never exposed to client**
✅ **Token exchange happens server-side only**
✅ **User authentication verified before exchange**
✅ **CORS properly configured**
✅ **Comprehensive error handling**

## Troubleshooting

### "Edge Function may not be deployed correctly"
- Deploy the Edge Function to Supabase
- Verify secrets are set correctly
- Check Edge Function logs in Supabase Dashboard

### "Failed to exchange authorization code"
- Verify `FACEBOOK_APP_SECRET` is correct
- Check redirect URI matches Facebook App settings
- Ensure code hasn't expired (codes expire after 10 minutes)

### "User not authenticated"
- User must be logged in before connecting Facebook
- Session must be valid
- Check Supabase auth state

## Facebook App Configuration

In Facebook Developer Console:
1. Go to Settings → Basic
2. Add OAuth Redirect URI: `https://surgly.app/auth/facebook/callback`
3. Ensure App is in Live mode (not Development)
4. Required permissions: `ads_management`, `business_management`, `ads_read`

## Database Schema

The `facebook_tokens` table stores access tokens:
```sql
CREATE TABLE facebook_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  access_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Files Modified

- ✅ `supabase/functions/facebook-oauth-callback/index.ts` - New Edge Function
- ✅ `src/lib/facebookService.ts` - Updated to use Edge Function
- ✅ `src/pages/FacebookCallback.tsx` - Already configured correctly
- ✅ `src/components/Settings.tsx` - Shows success/error toasts

## Next Steps

1. Deploy the Edge Function to Supabase
2. Set environment secrets
3. Test the complete OAuth flow
4. Monitor Edge Function logs for any issues
