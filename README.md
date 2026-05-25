# Pitch Perfect

**deploy** : [https://pitchperfectapk.com](https://pitchperfectapk.com/home)

**demo** : [https://pitch-perfect0.vercel.app](https://pitch-perfect0.vercel.app/home)

---
**Your Complete Turf Booking Solution**

Pitch Perfect is a modern, mobile-first turf booking platform designed to streamline the sports venue booking experience. Whether you're organizing a cricket match or a football game, our intuitive app makes it effortless to reserve your playing time and manage your bookings.

---

## Tech Stack

### Core App

- **Next.js** - Powers the app router, server rendering, route handlers, and production build/start flow. We use it because the app needs a full-stack React framework with strong routing and server support.
- **React** - The UI layer for pages, components, and interactive booking flows. We use it because the product is built around composable, client-side experiences.
- **TypeScript** - Adds static typing across the app and scripts. We use it to reduce bugs and keep data models, API contracts, and UI logic aligned.
- **`server-only`** - Marks modules that must stay on the server. We use it to prevent server code from being bundled into the browser.

### API And Data Flow

- **tRPC (`@trpc/server`, `@trpc/client`, `@trpc/react-query`)** - Provides end-to-end typed APIs between client and server. We use it so request/response shapes stay in sync without manual REST schemas.
- **TanStack Query (`@tanstack/react-query`)** - Caches and syncs remote data on the client. We use it to keep booking and admin screens responsive while data refreshes in the background.
- **`superjson`** - Serializes richer JavaScript values like dates across API boundaries. We use it so booking data can move safely between server and client.
- **`zod`** - Validates env values and request inputs. We use it to fail fast on bad data and keep forms/API payloads predictable.

### Database

- **Drizzle ORM (`drizzle-orm`)** - Type-safe SQL access and schema usage. We use it for querying and modeling the Postgres database.
- **Postgres driver (`postgres`)** - Low-level database connection driver. We use it as the runtime transport for Drizzle.
- **Drizzle Kit (`drizzle-kit`)** - Schema generation, migration, and studio tooling. We use it to manage database changes and inspect data.
- **`eslint-plugin-drizzle`** - Lint rules for Drizzle patterns. We use it to catch ORM mistakes early.

### Authentication And Configuration

- **Better Auth (`better-auth`)** - Auth and session system. We use it for sign-in, session handling, and admin/user authentication flows.
- **`@t3-oss/env-nextjs`** - Typed environment variable validation. We use it to make sure secrets and public config are present and valid.
- **`dotenv`** - Loads environment files in local/script contexts. We use it when the runtime needs `.env` values outside Next.js handling.

### UI And Styling

- **Tailwind CSS (`tailwindcss`, `@tailwindcss/postcss`)** - Utility-first styling system. We use it for fast, consistent responsive UI work.
- **`tailwind-merge`** - Resolves conflicting Tailwind classes. We use it to keep component class strings clean.
- **`clsx`** - Conditional class name helper. We use it to build class strings based on state and props.
- **`class-variance-authority`** - Variant-based component styling. We use it for reusable button and control variants.
- **Radix UI (`@radix-ui/react-dialog`, `dropdown-menu`, `label`, `radio-group`, `separator`, `slot`, `toggle`)** - Accessible headless primitives. We use them for dialogs, menus, form controls, separators, and composable UI patterns.
- **`next-themes`** - Theme persistence and switching. We use it for light/dark mode support.
- **`lucide-react`** - Icon library. We use it for consistent, lightweight icons across the interface.
- **`sonner`** - Toast notifications. We use it for quick feedback after bookings, admin actions, and errors.
- **`motion`** - Animations and transitions. We use it to make the UI feel more fluid and polished.
- **`tw-animate-css`** - Tailwind-friendly animation utilities. We use it to support motion styles in the design system.
- **`react-day-picker`** - Calendar/date picker UI. We use it for selecting booking dates and schedules.

### Media, Maps, And Sharing

- **Cloudinary** - Image and video storage/delivery. We use it to serve optimized gallery and media assets.
- **`html-to-image`** - Converts UI content into downloadable images. We use it for booking receipts and shareable confirmations.
- **`qrcode.react`** - Generates QR codes. We use it for booking or confirmation codes.
- **Leaflet (`leaflet`, `react-leaflet`, `leaflet-draw`)** - Interactive maps and drawing tools. We use them for venue/location views and map-based editing.
- **Leaflet types (`@types/leaflet`, `@types/leaflet-draw`)** - TypeScript definitions for the map libraries. We use them to keep map code type-safe.

### Payments, Analytics, And Notifications

- **`paytmchecksum`** - Payment signature helper. We use it to validate or generate Paytm transaction checksums.
- **`posthog-js`** - Product analytics. We use it to understand usage patterns and improve funnels.
- **`canvas-confetti`** - Celebration effect for success states. We use it to make booking confirmations feel rewarding.
- **`@types/canvas-confetti`** - TypeScript types for the confetti package. We use it for safe imports in TypeScript.
- **React Email (`@react-email/components`)** - Email template primitives. We use it to build transactional emails in React.

### Tooling

- **ESLint (`eslint`, `eslint-config-next`, `@eslint/eslintrc`, `typescript-eslint`)** - Linting and Next.js rule set. We use it to keep code quality and patterns consistent.
- **Prettier (`prettier`)** - Code formatting. We use it to keep the repo style consistent.
- **`prettier-plugin-tailwindcss`** - Sorts Tailwind classes automatically. We use it to keep utility-heavy class lists readable.
- **PostCSS (`postcss`)** - CSS processing pipeline. We use it to run Tailwind and related CSS transforms.
- **`tsx`** - Runs TypeScript scripts without a separate build step. We use it for DB init and seed scripts.
- **`typescript`** - Type checker/compiler. We use it for `tsc --noEmit` checks and build safety.

### Scripts

- **`dev`** - Runs the app locally with Bun and Next.js Turbo mode.
- **`build`** - Produces the production build.
- **`start`** - Starts the production server.
- **`preview`** - Builds and starts the app for a production-like local check.
- **`lint` / `lint:fix`** - Runs ESLint, with optional autofix.
- **`check` / `typecheck`** - Runs linting and TypeScript checks.
- **`format:check` / `format:write`** - Verifies or applies formatting.
- **`db:init`, `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed:super-admin`, `db:seed:admin`** - Database setup, schema, migration, studio, and seed workflows.

## Why Pitch Perfect?

Traditional turf booking methods are often cumbersome, involving phone calls, unclear availability, and manual payment tracking. Pitch Perfect eliminates these pain points by providing:

- **Real-Time Availability** - See available time slots instantly, no more back-and-forth calls
- **Instant Confirmation** - Get immediate booking confirmation with verification codes
- **Flexible Payment Options** - Choose between advance payment or full payment upfront
- **Complete Transparency** - Know exactly what you're paying for with clear pricing
- **Digital Records** - Keep all your bookings organized in one place

---

## Key Features

### Smart Booking System

- **7-Day Calendar View** - Browse available slots for the next week at a glance
- **Time Slot Selection** - Choose from clearly marked available, booked, or unavailable slots
- **Sport Selection** - Book for cricket, football, or both activities
- **Flexible Payment** - Pay ₹100 advance or full amount upfront
- **Instant Verification** - Receive a unique 4-digit verification code for security
- **Booking Confirmation** - Get beautiful, downloadable booking receipts

### Booking Management

- **View All Bookings** - Track both upcoming and past reservations
- **Digital Tickets** - Access complete booking details including verification codes
- **Booking History** - Review your past visits and activities
- **Downloadable Receipts** - Save booking confirmations as images for your records
- **Reschedule Option** - Modify upcoming bookings when needed

### Visual Gallery

- **Browse Turf Photos** - Explore high-quality images of the facilities
- **Video Content** - Watch videos showcasing the turf experience
- **Instagram-Style View** - Thumbnail grid with full-screen viewer
- **Zoom & Swipe** - Interactive media viewing experience

### Easy Contact

- **Management Details** - Direct access to phone numbers and email
- **Business Hours** - Know when the turf is open
- **Location Map** - Integrated map widget for easy navigation
- **WhatsApp Integration** - Quick access to instant messaging

### Customer Features

- **User Profiles** - Store your contact details for faster bookings
- **Alternate Contacts** - Add backup contact information for coordination
- **Language Support** - Available in English and Tamil
- **Theme Options** - Switch between light and dark modes for comfortable viewing

### Payment & Discounts

- **Coupon Support** - Apply discount codes to your bookings
- **Usage Tracking** - View your coupon redemption history
- **Transparent Pricing** - See total amount and discounts clearly before payment
- **Payment Records** - Complete transaction history with payment IDs

### Secure & Reliable

- **Verification Codes** - 4-digit codes ensure booking authenticity
- **Customer Tagging** - Special recognition for regular customers (Star, VIP, Regular)
- **Data Privacy** - Your information is stored securely
- **Email Receipts** - Optional email confirmations for your records

---

## Perfect For

- **Sports Teams** - Organize regular practice sessions or matches
- **Friends Groups** - Plan casual games with your buddies
- **Individuals** - Book solo practice time
- **Event Organizers** - Arrange tournaments or special events
- **Corporate Groups** - Team building activities and company sports days

---

## What Makes It Special

### Mobile-First Design

Built specifically for smartphones with an intuitive touch interface, making bookings as easy as ordering food online.

### Real-Time Updates

See availability instantly as slots are booked, ensuring you never face double-booking surprises.

### Celebration Moments

Experience delightful confetti animations when your booking is confirmed - because every game deserves a celebration!

### Admin Dashboard

Behind the scenes, venue managers have a powerful admin panel to:

- Manage time slots and availability
- Track all bookings and customer activity
- Handle coupon creation and management
- Upload and organize gallery content
- Monitor user activity and bookings
- Generate business insights

---

## Benefits

**For Players:**

- Save time with instant bookings
- No more phone tag with facility managers
- Know your booking is confirmed immediately
- Keep all records digital and organized
- Access booking history anytime, anywhere

**For Turf Owners:**

- Reduce manual booking workload
- Minimize booking errors and conflicts
- Better customer data management
- Track business metrics efficiently
- Improve customer experience and retention

---

## Getting Started

1. **Browse** - Open the app and explore available time slots
2. **Select** - Pick your preferred date, time, and sport
3. **Book** - Enter your details and choose payment option
4. **Play** - Show your verification code and enjoy your game!

---

## Multi-Language Support

Pitch Perfect speaks your language! Available in:

- English
- Tamil (தமிழ்)

---

## Smart Features

- **Automatic Slot Generation** - Time slots are automatically created and managed
- **Status Tracking** - Real-time slot status (Available, Booked, Unavailable, In Progress)
- **Customer Recognition** - System identifies and rewards regular customers
- **Activity Logs** - Complete audit trail for transparency
- **Cloudinary Integration** - Fast, optimized image and video delivery

---

**Pitch Perfect** - Making turf booking as smooth as your perfect game!
