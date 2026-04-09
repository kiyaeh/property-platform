# Mini Multi-Tenant Property Listing Platform

This repository contains the full-stack practical exam implementation for the Intern Staff Developer (Hybrid) role.

## Live URLs

- Frontend URL: TODO
- Backend API URL: TODO

## Tech Stack

- Backend: NestJS
- Frontend: Next.js (App Router)
- State Management: Zustand
- Database: PostgreSQL (Prisma)
- API Documentation: Postman collection in docs/property-platform.postman_collection.json

## Why These Choices

### Backend framework choice

I selected NestJS because it provides a clear modular architecture (auth, users, properties), built-in guards/interceptors for role-based access control, and strong TypeScript support that speeds up exam-safe development while still keeping production structure.

### State management choice

I selected Zustand for focused client state needs:

- Persisted authentication across refresh.
- Favorites local state with optimistic UI and cross-tab synchronization.
- Lightweight API and low boilerplate for exam timeframe.

### Access control enforcement

Access control is enforced at multiple layers:

- JWT authentication using bearer token.
- Route-level guards (JwtAuthGuard + RolesGuard).
- Role metadata via Roles decorator.
- Ownership checks inside services for owner-only resource modifications.

### Hardest technical challenge

The most sensitive part was implementing publish logic safely:

- Draft-only edit rule.
- Validation before publish.
- Atomic transactional publish update.
- Preventing post-publish edits by business rule.

### What breaks first at scale

The first bottlenecks will likely be:

- Property listing/filter queries without stronger indexing or caching strategy.
- Image storage bandwidth and URL validation pipeline.
- Dashboard metrics as data volume grows (needs pre-aggregation/materialized views).

## Requirement Mapping

- JWT auth + RBAC: Implemented.
- Pagination/filtering: Implemented on property listing endpoints.
- Soft delete: Implemented via deletedAt on properties.
- Transactional publish: Implemented.
- Environment config: Implemented with validation.
- Proper HTTP errors/status: Implemented.
- Authentication pages: Implemented.
- Public listing SSR: Implemented at /properties.
- Property detail page: Implemented at /properties/[id].
- User/Owner/Admin dashboards (CSR): Implemented.
- Persist auth across refresh: Implemented with Zustand persist.
- Favorites sync across tabs: Implemented via storage event sync.
- Optimistic UI update: Implemented in favorite toggle.
- Protected routes + loading/error states: Implemented in client guards/pages.

## Project Structure

- backend: NestJS API (auth, properties, admin, favorites).
- frontend: Next.js app (auth pages, SSR listing/detail, dashboards).
- docs: API collection and exam artifacts.

## Local Setup

### 1) Backend

1. cd backend
2. Copy .env.example to .env and fill values.
3. Install dependencies: npm install
4. Generate Prisma client: npm run prisma:generate
5. Start API: npm run start:dev

### 2) Frontend

1. cd frontend
2. Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:4000
3. Install dependencies: npm install
4. Start app: npm run dev

## API Documentation

Use the Postman collection:

- docs/property-platform.postman_collection.json

## Deployment Notes

Recommended deployment:

- Frontend: Vercel
- Backend: Render or Railway
- Database: Neon PostgreSQL

After deployment, update the Live URLs section above.
