# Stripe Subscription Integration with 5-Day Free Trial

This document outlines how to integrate Stripe-based subscriptions with a five-day free trial in a Next.js + Supabase application. Follow the guide to implement backend API routes, webhook processing, frontend experiences, and Stripe configuration. Use this document as a development hand-off reference.

## Step-by-Step Implementation Guide

### 1. Prepare the Environment
1. **Install dependencies**
   - Add `stripe` to both server (API routes) and frontend packages if needed (`npm install stripe @stripe/stripe-js`).
   - Ensure `@supabase/supabase-js` is available for server-side Supabase operations.
2. **Configure environment variables**
   - `STRIPE_SECRET_KEY`: Server-side secret key (no publishable keys server-side).
   - `STRIPE_WEBHOOK_SECRET`: Secret from webhook endpoint configuration.
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Frontend publishable key.
   - `SUPABASE_SERVICE_ROLE_KEY`: For secure server-side Supabase access.
   - `APP_BASE_URL`: Base URL for constructing success/cancel URLs.
3. **Secure storage**
   - Place secrets in `.env.local` (for Next.js) and Supabase Edge functions if applicable.
   - Configure deployment platform secret management (e.g., Vercel Environment Variables).

### 2. Model Subscription Data in Supabase
1. **Create tables**
   - `profiles`: Ensure user metadata (Stripe customer ID, subscription status, trial dates).
   - `subscriptions`: Track `id`, `user_id`, `stripe_subscription_id`, `status`, `trial_end`, `current_period_end`, `cancel_at_period_end`, `tier`, timestamps.
2. **Create RLS policies**
   - Restrict read/write to the authenticated user and service role.
   - Allow service role to update statuses via API/webhook processing.
3. **Add indexes**
   - Index `stripe_subscription_id` for fast lookups in webhook handler.

### 3. Configure Stripe Dashboard
1. **Create product + price**
   - Product: e.g., “Pro Plan”.
   - Price: recurring subscription (monthly/annual) with `trial_period_days` set to `5`.
2. **Enable customer portal (optional)**
   - Configure portal settings for plan switching, cancelation, and invoice history.
3. **Set up webhook endpoint**
   - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.trial_will_end`.
   - Copy the webhook signing secret for backend use.
4. **Create test data**
   - Add test customers and cards in Stripe test mode.

### 4. Implement Backend API Routes in Next.js
1. **Stripe client setup**
   - Create `/lib/stripe.ts` exporting a configured Stripe instance using the secret key.
2. **Create Checkout Session API** (`/pages/api/stripe/create-checkout-session.ts` or `/app/api/...`)
   - Verify authenticated user via Supabase auth.
   - Ensure user has a Stripe customer ID; create one if missing and store it.
   - Create a Stripe Checkout Session with:
     - `mode: 'subscription'`
     - `line_items` referencing the price ID with trial enabled.
     - `customer` set to the user’s Stripe customer.
     - `success_url` and `cancel_url` pointing to app routes.
     - `subscription_data` to pass metadata if needed (e.g., Supabase user ID).
   - Return session URL for frontend redirection.
3. **Create Customer Portal API** (optional) for self-serve management.
4. **Webhook Handler** (`/pages/api/stripe/webhook.ts` or `/app/api/...`)
   - Parse raw request body.
   - Verify signature using `stripe.webhooks.constructEvent` and the webhook secret.
   - Handle events:
     - `checkout.session.completed`: Link session to Supabase user, mark trial start.
     - `customer.subscription.created`/`updated`: Upsert subscription record, updating status, `trial_end`, `current_period_end`, and cancelation flags.
     - `customer.subscription.deleted`: Mark subscription inactive/canceled.
     - `invoice.payment_failed`: Notify user, consider restricting access after grace period.
     - `customer.subscription.trial_will_end`: Send reminder email via Supabase or other service.
   - Use Supabase service role client for database writes.
5. **Protect API routes**
   - Apply authentication checks (Supabase session) and method guards.
   - Limit the webhook handler to POST with raw body parsing disabled globally but re-enabled locally as needed.

### 5. Frontend Integration
1. **Subscription status context**
   - Fetch subscription data from Supabase upon login.
   - Cache in context/provider for app-wide availability.
2. **Upgrade call-to-action**
   - Add UI component (e.g., modal or page) with plan benefits, trial messaging, and “Start free trial” button.
   - On click, call the Checkout Session API and redirect to Stripe.
3. **Account / Billing page**
   - Display current plan, status (`trialing`, `active`, `past_due`, `canceled`), trial end countdown.
   - Provide link to customer portal or cancellation flow.
4. **Trial experience**
   - Show banner or gating UI with days remaining.
   - Warn user as trial expiration approaches.
5. **Handling access control**
   - Gate premium features by checking subscription status and trial validity from Supabase.

### 6. Testing & Verification
1. **Local tests**
   - Use Stripe CLI to forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
   - Simulate checkout via test cards, ensuring trial status updates in Supabase.
2. **Integration tests**
   - Validate access gating by toggling subscription states in Supabase.
3. **Deployment checks**
   - Ensure environment variables are set in production.
   - Update webhook endpoint to production URL and verify signatures.

## Detailed TODO Checklist

### Backend Tasks
- [ ] Set up Stripe server client helper with secret key.
- [ ] Extend Supabase schema with `subscriptions` table, indexes, and RLS policies.
- [ ] Ensure `profiles` table stores `stripe_customer_id` and `subscription_status` fields.
- [ ] Build authenticated API route for creating Stripe Checkout Sessions.
- [ ] Build optional API route for customer portal link creation.
- [ ] Implement Stripe webhook handler with raw-body parsing and signature verification.
- [ ] Process `checkout.session.completed` to link users to Stripe customers and mark trial start.
- [ ] Upsert subscription records on `customer.subscription.created/updated/deleted` events.
- [ ] Handle `invoice.payment_failed` and `trial_will_end` events (notifications, status updates).
- [ ] Write unit/integration tests for API routes and webhook logic.
- [ ] Document environment variables and deployment configuration.

### Frontend Tasks
- [ ] Create subscription context/provider pulling subscription info from Supabase.
- [ ] Add upgrade CTA component with trial messaging and loading states.
- [ ] Integrate API call to create Checkout Session and redirect via Stripe.js.
- [ ] Build billing page showing plan, status, trial countdown, and management controls.
- [ ] Implement UI gating for premium features based on subscription status.
- [ ] Surface trial expiration reminders (banner, email opt-in, notifications).
- [ ] Provide access to Stripe customer portal or custom cancellation flow.
- [ ] Add optimistic UI/state handling for subscription status updates post-checkout.

### Stripe Dashboard Configuration Tasks
- [ ] Create product and recurring price with 5-day trial period.
- [ ] Verify email receipt settings, dunning management, and reminders.
- [ ] Configure customer portal settings (optional but recommended).
- [ ] Register webhook endpoint for local development using Stripe CLI.
- [ ] Register production webhook endpoint with HTTPS URL and copy secret.
- [ ] Enable test mode and create sample customers/cards for QA.

## Best Practices & Common Pitfalls

### Handling Trial Expiration
- **Monitor trial end dates**: Use `trial_end` timestamp from subscription events to gate access once trial concludes.
- **Communicate clearly**: Send email reminders (2 days before expiration and on the day of conversion) and in-app messaging.
- **Grace period strategy**: Decide whether to offer a short grace window after failed payment; reflect this consistently in UI and database state.

### Webhook Security & Reliability
- **Signature verification**: Always verify Stripe webhook signatures; reject unverified requests.
- **Raw body parsing**: Disable Next.js automatic body parsing for the webhook route and read the raw stream for signature verification.
- **Idempotency**: Use idempotent database operations (UPSERT) and check `event.id` logs to avoid duplicate processing.
- **Logging & monitoring**: Log webhook events and maintain alerting for failures.
- **Retry handling**: Stripe retries failed webhooks; ensure handlers are idempotent and can handle eventual consistency.

### Subscription Lifecycle Management
- **Update Supabase promptly**: Reflect status changes (`trialing`, `active`, `past_due`, `canceled`) in the database immediately to avoid stale UI state.
- **Customer record linking**: Store the Stripe customer ID on first checkout; reuse it for subsequent sessions to avoid duplicates.
- **Cancellation flows**: Respect `cancel_at_period_end` vs `canceled` states. Keep access until the end of the paid period unless immediate cancellation is requested.
- **Downgrade logic**: Ensure user data (e.g., premium-only content) is handled gracefully when access is removed.

### Frontend & UX Considerations
- **Show clear trial status**: Provide countdown timers and messaging about upcoming billing.
- **Handle loading states**: Disable buttons while creating checkout sessions; show errors if the API call fails.
- **Optimize mobile experience**: Ensure subscription management pages are mobile-friendly, especially for trial messaging.

### Operational Tips
- **Testing strategy**: Use Stripe test mode and fixtures; run through trial start, conversion, and cancellation scenarios before launch.
- **Documentation & onboarding**: Keep internal runbooks updated for customer support (how to look up subscriptions, issue refunds, extend trials).
- **Compliance**: Ensure terms of service/privacy policy mention the trial and billing cadence.
- **Disaster recovery**: Backup Supabase data and monitor for webhook outages (consider a queue/retry mechanism).

---

For questions or clarifications, contact the platform team or consult Stripe’s official documentation for more detailed API references.
