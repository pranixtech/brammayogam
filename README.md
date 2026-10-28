# Brahmam Foundation

A full-stack spiritual website built with React, React Router, Node.js, Express and PostgreSQL. The public gallery supports category-wise photos. Visitors can send feedback and register their interest in online classes; `/admin` provides protected media management and submission inboxes.

## Development

```bash
npm install
npm run dev
```

Run the API separately during local development:

```bash
cd server
npm install
DATABASE_URL=postgres://brahmam:brahmam@localhost:5432/brahmam \
ADMIN_USERNAME=admin \
ADMIN_PASSWORD=your-password \
JWT_SECRET=your-long-random-secret \
npm run dev
```

Vite proxies `/api` and `/uploads` to `http://localhost:4000`.

## Docker setup

```bash
cp .env.example .env
```

Replace the example database password, admin password and JWT secret in `.env`, then run:

```bash
docker compose up --build
```

- Website: `http://localhost:8080`
- Online class registration: `http://localhost:8080/registration`
- Feedback: `http://localhost:8080/feedback`
- Site admin: `http://localhost:8080/admin`
- API health: `http://localhost:8080/api/health`

Always use the Docker website URL above for the admin. Port `4000` is also exposed so the Vite development server can proxy admin requests while running `npm run dev`.

PostgreSQL data, including class registrations and feedback, and uploaded media are stored in named Docker volumes. Gallery JPG, PNG and WebP images are normalized to WebP and limited to 10 MB each. The admin's Upcoming Activities tab accepts JPG, PNG, WebP, MP4 and WebM files up to 100 MB each. The homepage section remains hidden until its first activity is uploaded. Activity images are normalized to WebP, while activity videos are stored as local files. Admin inboxes show 20 submissions per page; public submissions are rate limited.

## Production deployment

Pushes to `main` automatically deploy through `.github/workflows/deploy-production.yml`.
The workflow uses a repository secret for an SSH key restricted to the root-owned
`deploy/production-deploy.sh` command on the VPS. That command verifies the
requested commit is the current `main` tip, saves a PostgreSQL backup in
`/root/bramma-yogam-backups`, synchronizes source files, rebuilds Docker
services, and checks the API health endpoint. The production `.env`, database
volume, and uploaded photos remain on the VPS.

## Quality checks

```bash
npm run check
```

The check command runs ESLint and creates a production build.

## Source structure

```text
src/
├── app/                 Application composition
├── assets/              Images and static assets
├── components/
│   ├── common/          Reusable visual components
│   └── layout/          Header and footer
├── data/                Editable site content and constants
├── hooks/               Reusable browser and React behavior
├── pages/               Homepage and standalone route components
├── services/            Browser API clients
├── sections/            Independent page sections
└── styles/
    ├── tokens.css       Design-system values
    ├── base.css         Global and foundational rules
    ├── components.css   Shared component styles
    ├── forms.css        Public forms and admin inbox styles
    ├── sections.css     Page-section styles
    └── responsive.css   Breakpoints and motion preferences
```

The `server/` directory contains the Express API, PostgreSQL initialization, admin authentication, image upload pipeline and submission routes. Docker Compose runs PostgreSQL, the API, and the Nginx-hosted frontend as separate services.

## Conventions

- Components use PascalCase names and named exports.
- Hooks begin with `use` and contain reusable behavior only.
- Editable copy and repeated content live in `data/siteContent.js`.
- CSS uses design tokens and BEM-style class names.
- Page sections use semantic HTML and accessible labels.
- `App.jsx` defines the homepage and standalone content, gallery, registration and feedback routes.
- Primary navigation links scroll to the corresponding page sections.
