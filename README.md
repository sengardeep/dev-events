# DevEvent

DevEvent is a Next.js application for discovering, publishing, and booking developer events.

It supports:
- browsing featured events
- viewing detailed event pages
- booking an event with duplicate-booking protection
- creating events with image upload to Cloudinary
- showing similar events based on shared tags

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- MongoDB + Mongoose
- Cloudinary (event banner uploads)
- PostHog (optional client analytics)

## Quick Start

### 1. Prerequisites

- Node.js 20+
- npm 10+
- A MongoDB connection string
- A Cloudinary account

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root.

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

# Optional analytics
NEXT_PUBLIC_POSTHOG_TOKEN=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Notes:
- `MONGODB_URI` is required. The app will throw at runtime if it is missing.
- `CLOUDINARY_URL` is required for event creation because image upload uses Cloudinary.
- PostHog is optional and only initializes when a token is provided.

### 4. Run the app

```bash
npm run dev
```

Open http://localhost:3000

## Available Scripts

- `npm run dev` - Start local development server
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## App Routes

| Route | Purpose |
| --- | --- |
| `/` | Home page with featured events |
| `/event/create` | Event creation form |
| `/event/[slug]` | Event detail page + booking form + similar events |

## API Routes

### `GET /api/events`

Fetch all events ordered by newest first.

### `POST /api/events`

Create a new event from `multipart/form-data`.

Required fields:
- `title`
- `description`
- `overview`
- `venue`
- `location`
- `date`
- `time`
- `mode`
- `audience`
- `organizer`
- `agenda` (comma-separated or multiple values)
- `tags` (comma-separated or multiple values)
- `image` (file)

Success response: `201`

### `GET /api/events/[slug]`

Fetch a single event by slug.

Responses:
- `200` if found
- `404` if not found
- `400` for invalid slug format

### `POST /api/bookings`

Create a booking.

JSON body:

```json
{
	"eventId": "<mongo_object_id>",
	"email": "user@example.com"
}
```

Responses:
- `201` booking created
- `400` invalid payload
- `404` event not found
- `409` duplicate booking for same event + email

## Data Behavior

### Event model

- `slug` is generated from title and indexed as unique
- `date` is normalized to ISO string
- `time` accepts `HH:mm` or `h:mm AM/PM` and is normalized to 24-hour format
- `agenda` and `tags` are trimmed; tags are lowercased

### Booking model

- validates email format
- enforces unique `(eventId, email)` pair
- verifies referenced event exists before save

## Fallback Behavior

If database reads fail, server actions fall back to static events from `lib/constants.ts` for event listing/similar-event display.

## Project Structure

```text
app/
	api/                  # Route handlers for events and bookings
	event/                # Event pages (create + details)
	layout.tsx            # Root layout and global UI shell
	page.tsx              # Home page
components/             # Reusable UI components
database/               # Mongoose models
lib/
	actions/              # Server-side data access helpers
	mongodb.ts            # Shared Mongo connection singleton
	constants.ts          # Static fallback event data
public/                 # Static icons/images
```

## Deployment Notes

- Make sure production environment variables are configured.
- Build with `npm run build`, then run with `npm run start`.
- Remote images are allowed from `res.cloudinary.com` in `next.config.ts`.

## Troubleshooting

- Error: `Please define the MONGODB_URI environment variable.`
	- Add `MONGODB_URI` to your environment file.

- Event creation fails when uploading image
	- Ensure `CLOUDINARY_URL` is set and valid.

- Booking returns `409`
	- That email is already registered for the selected event.

- Next.js 16 build/prerender instability after enabling `cacheComponents`
	- Keep `cacheComponents` disabled unless all uncached async access is properly wrapped.

## Security Notes

- Keep secrets in local/private env files (for example `.env.local`).
- Do not commit real credentials.
