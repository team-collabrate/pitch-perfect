# PostHog Analytics Setup - Complete ✅

PostHog has been successfully configured in your Next.js application!

## What's Been Implemented

### ✅ 1. Package Installation

- `posthog-js` v1.305.0 - Already installed
- `posthog-node` v5.17.2 - Already installed

### ✅ 2. Environment Variables

Added to `src/env.js`:

- `NEXT_PUBLIC_POSTHOG_KEY` - Your PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host URL (EU cloud)

Updated `.env.example` with PostHog variables.

**Action Required:** Add these to your `.env` file:

```env
NEXT_PUBLIC_POSTHOG_KEY=your-project-key-here
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

### ✅ 3. Core Components Created

#### `src/app/providers.tsx`

- PostHog Provider with React integration
- Auto-initialization with environment variables
- Dynamic import for PostHogPageView (prevents SSR issues)
- Configured with:
  - `person_profiles: "identified_only"` - Only track identified users
  - `capture_pageview: false` - Manual pageview tracking
  - `capture_pageleave: true` - Track when users leave pages
  - `capture_exceptions: true` - Automatic error tracking
  - Debug mode enabled in development

#### `src/app/PostHogPageView.tsx`

- Handles automatic pageview tracking for SPA navigation
- Tracks pathname and query parameters
- Works with Next.js App Router

### ✅ 4. Root Layout Integration

Updated `src/app/layout.tsx`:

- Wrapped app with `PHProvider`
- PostHog now tracks all pages automatically

### ✅ 5. Reverse Proxy Configuration

Updated `next.config.js` with EU cloud endpoints:

- `/ingest/static/*` → `https://eu-assets.i.posthog.com/static/*`
- `/ingest/*` → `https://eu.i.posthog.com/*`
- `/ingest/decide` → `https://eu.i.posthog.com/decide`
- Benefits: Better privacy, bypasses ad-blockers

### ✅ 6. Tracking Helper Functions

Created `src/lib/posthog-tracking.ts` with ready-to-use hooks:

- `useBookingTracking()` - Track booking flows
- `useFormTracking()` - Track form interactions
- `useAuthTracking()` - Track login/signup/logout
- `useGalleryTracking()` - Track gallery interactions
- `useNavigationTracking()` - Track navigation events

## How to Use

### 1. Set Environment Variables

Create/update your `.env` file:

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_your_actual_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

### 2. Track Events in Your Components

Example: Track booking attempts in a booking form:

```tsx
import { useBookingTracking } from "~/lib/posthog-tracking";

export function BookingForm() {
  const { trackBookingAttempt, trackBookingSuccess } = useBookingTracking();

  const handleSubmit = async (data) => {
    trackBookingAttempt({
      slotId: data.slotId,
      date: data.date,
      sport: data.sport,
    });

    try {
      const result = await bookSlot(data);
      trackBookingSuccess({
        bookingId: result.id,
        amount: result.amount,
        sport: data.sport,
      });
    } catch (error) {
      // Errors are automatically captured by PostHog
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 3. Track Form Interactions

```tsx
import { useFormTracking } from "~/lib/posthog-tracking";

export function ContactForm() {
  const { trackFormInteraction, trackFormSubmit } = useFormTracking();

  return (
    <input
      onFocus={() => trackFormInteraction("email", "focus")}
      onChange={() => trackFormInteraction("email", "change")}
    />
  );
}
```

### 4. Identify Users (After Login)

```tsx
import { usePostHog } from "posthog-js/react";
import { identifyUser } from "~/lib/posthog-tracking";

export function LoginPage() {
  const posthog = usePostHog();

  const handleLogin = async (user) => {
    // After successful login
    identifyUser(posthog, user.id, {
      email: user.email,
      name: user.name,
      plan: user.plan,
    });
  };
}
```

### 5. Reset on Logout

```tsx
import { usePostHog } from "posthog-js/react";
import { resetUser } from "~/lib/posthog-tracking";

export function LogoutButton() {
  const posthog = usePostHog();

  const handleLogout = () => {
    resetUser(posthog);
    // Continue with logout logic
  };
}
```

## What PostHog is Tracking

### Automatic Tracking:

- ✅ Page views (including SPA navigation)
- ✅ Page leaves
- ✅ JavaScript errors and exceptions
- ✅ User sessions

### Manual Tracking (Use the helpers):

- Booking attempts and completions
- Form interactions
- User authentication
- Gallery interactions
- Navigation events
- Custom events specific to your app

## Testing Your Setup

1. Start your dev server:

```bash
pnpm dev
```

2. Open your browser and navigate through your app

3. Go to PostHog dashboard: https://eu.posthog.com/

4. Check "Activity" or "Events" to see captured events

5. Look for:
   - `$pageview` events (automatic)
   - `$pageleave` events (automatic)
   - Any custom events you've added

## Important Notes

- **Privacy**: Using reverse proxy at `/ingest` prevents ad-blockers from blocking tracking
- **EU Cloud**: Configured for EU data residency (GDPR compliant)
- **Person Profiles**: Only tracks identified users (after calling `identify()`)
- **Debug Mode**: Enabled in development for easier debugging
- **SSR Safe**: PostHogPageView uses dynamic import to avoid SSR issues

## Next Steps

1. ✅ Add your PostHog keys to `.env`
2. ✅ Test in development
3. ✅ Add tracking to key user flows (bookings, forms, etc.)
4. ✅ Deploy and verify in production
5. ✅ Set up dashboards in PostHog for key metrics

## Resources

- PostHog Dashboard: https://eu.posthog.com/
- PostHog Docs: https://posthog.com/docs
- Next.js Integration Guide: https://posthog.com/docs/libraries/next-js

---

**Status: Complete and Ready to Use! 🎉**

Just add your API keys and start tracking events.
