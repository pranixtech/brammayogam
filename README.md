# Brahma Yogam

A responsive spiritual presentation website built with React and Vite.

## Development

```bash
npm install
npm run dev
```

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
├── sections/            Independent page sections
└── styles/
    ├── tokens.css       Design-system values
    ├── base.css         Global and foundational rules
    ├── components.css   Shared component styles
    ├── sections.css     Page-section styles
    └── responsive.css   Breakpoints and motion preferences
```

## Conventions

- Components use PascalCase names and named exports.
- Hooks begin with `use` and contain reusable behavior only.
- Editable copy and repeated content live in `data/siteContent.js`.
- CSS uses design tokens and BEM-style class names.
- Page sections use semantic HTML and accessible labels.
- `App.jsx` is responsible only for composing the page.
