# Google OAuth Console Fix Procedure — 2.4-G Blocker Resolution

## Problem Statement

**Error**: `redirect_uri_mismatch` (400)
**Root Cause**: Google Cloud Console does not have localhost URIs registered
**Status**: ✅ Code ready | ⏳ Configuration pending
**Severity**: BLOCKING — prevents OAuth callback completion in development

## Current State

- **Development Server**: Running on `http://localhost:3001` (3000 occupied)
- **Configured Callback URI**: `http://localhost:3000/api/auth/callback/google` (via `.env.local`)
- **Google Console Registered URIs**: Only production `https://visiomilhas.visiochat.cloud/api/auth/callback/google`
- **Error Page**: "Erro 400: redirect_uri_mismatch" when user attempts OAuth flow

## Solution: Update Google Cloud Console

### Step 1: Open Google Cloud Console

1. Navigate to: https://console.cloud.google.com/
2. Select project: "VisioMilhas"
3. Go to: **Credentials** (left sidebar)
4. Find: **OAuth 2.0 Client IDs**
5. Click on: Client ID `469564365250-b21amqa3fgjqs0c6rbeod71nfaul3ikk.apps.googleusercontent.com`

### Step 2: Add Authorized Redirect URIs

In the **Authorized redirect URIs** section, add:

```
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
```

**Full list should be:**
```
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
https://visiomilhas.visiochat.cloud/api/auth/callback/google
```

### Step 3: Add Authorized JavaScript Origins

In the **Authorized JavaScript origins** section, add:

```
http://localhost:3000
http://localhost:3001
```

**Full list should be:**
```
http://localhost:3000
http://localhost:3001
https://visiomilhas.visiochat.cloud
```

### Step 4: Save & Verify

1. Click **Save** (blue button bottom-right)
2. Wait 1-2 minutes for propagation (Google cache update)
3. Return to `http://localhost:3001/sign-in`
4. Click "Continuar com Google"
5. Verify: Should proceed past error page

## Expected Behavior After Fix

1. **OAuth Initiation**: Click "Continuar com Google" button
2. **Redirect to Google**: Redirected to `accounts.google.com` login
3. **User Login**: User enters Google credentials (if not cached)
4. **Consent Screen**: Google asks for email + profile permissions
5. **Callback**: Google redirects to `http://localhost:3000/api/auth/callback/google`
6. **Better Auth Processing**: Backend receives authorization code, exchanges for tokens
7. **Redirect to Onboarding**: User redirected to `/app/onboarding`
8. **Session Persisted**: Token stored in `ba_sessions` table

## Testing Checklist — Post-Fix

- [ ] OAuth flow completes without error
- [ ] User redirected to `/app/onboarding` after login
- [ ] No 500 errors in response
- [ ] No redirect loops
- [ ] Session created in `ba_sessions` table
- [ ] User record in `ba_users` table
- [ ] Logout functional
- [ ] Refresh maintains session
- [ ] Browser reopen maintains session
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (57/57)

## Configuration Consistency

**Development Environment (.env.local)**:
```
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
NODE_ENV=development
```

**Runtime Behavior**:
- PORT 3000 unavailable → falls back to 3001
- Better Auth callback URI remains `http://localhost:3000/api/auth/callback/google`
- localhost URLs in trustedOrigins (enabled by `NODE_ENV=development`)

**Google Cloud Console**:
- Both 3000 and 3001 registered (handles port fallback)
- Both registered as JavaScript origins (handles browser security policy)

## Rollback

If something breaks:
1. Remove localhost URIs from Google Console (production URI remains)
2. Revert `.env.local` changes (if modified)
3. Restart `npm run dev`
4. Error will return to previous state

## Timeline

- **Previous Session**: Identified blocker, expanded observability
- **Current Session**: Documented fix procedure, prepared code
- **Next Session**: Execute Google Console update, validate flow

## Contact & Support

For issues during fix:
- Verify redirect_uri exactly matches (http vs https, port, path)
- Check Google Console cache (wait 2+ minutes)
- Verify Both `Authorized redirect URIs` and `Authorized JavaScript origins` updated
- Check browser console for CORS errors (may indicate trustedOrigins issue)
