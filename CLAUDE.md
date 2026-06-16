# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SGA-CRM** is a React-based CRM application built with modern tooling for managing clients, policies, commissions, and settlements in a financial/insurance context. The app is deployed at `/crm1/` path.

## Tech Stack

- **Framework**: React 18.3.1 with React Router DOM 6.23.1
- **Build Tool**: Vite 5.4.4 with React plugin
- **UI Libraries**: 
  - Material-UI (MUI) 5.17.1 with emotion for styling
  - PrimeReact 10.8.0 (data tables, components with Tailwind passthrough)
  - TailwindCSS 3.4.4 for utility-first styling
  - Framer Motion 11.5.4 for animations
- **State Management**: React Context API (AuthContext, NavContext)
- **HTTP Client**: Axios 1.7.2
- **Authentication**: JWT tokens with SSO support
- **Export/Utilities**: XLSX for Excel, FileSaver for downloads, react-to-print for printing
- **Linting**: ESLint 8.57.0 with React and Hooks plugins

## Available NPM Scripts

```bash
npm run dev      # Start development server with HMR (Vite)
npm run build    # Build for production (output to /dist)
npm run lint     # Run ESLint on .js/.jsx files, fails on warnings
npm run preview  # Preview production build locally
```

## Architecture

### Directory Structure

```
src/
├── App.jsx              # Main router configuration
├── main.jsx             # Entry point, providers setup
├── theme.js             # Material-UI theme tokens and color modes (dark/light)
├── index.css            # Global styles (Tailwind layers, PrimeReact customization)
├── components/          # Reusable UI components
│   ├── TableData/       # Data table components
│   ├── ModalCliente/    # Client management modal
│   ├── Cards/           # Card components
│   ├── HeaderPage/      # Page headers
│   ├── Notifications/   # Alert/toast system
│   └── ...
├── views/               # Page-level components (routes)
│   ├── login/           # Login page
│   ├── Inicio/          # Dashboard
│   ├── Clientes/        # Client management
│   ├── Polizas/         # Policy management (registration, editing)
│   ├── Comisiones/      # Commission management (internal, freelance)
│   ├── Pagos/           # Payments
│   ├── Conciliaciones/  # Reconciliation
│   ├── AdminNegocios/   # Business admin
│   ├── Global/          # Topbar, Sidebar, Footer layouts
│   └── ...
├── layouts/             # Layout wrappers
│   └── MainLayout.jsx   # Main app layout with sidebar/topbar
├── context/             # React Context providers
│   ├── AuthContext.jsx  # Authentication, user data, permissions
│   └── NavContext.jsx   # Navigation state, modal management
├── services/            # API calls organized by feature
│   ├── Login/           # Login/SSO services
│   ├── Clientes/        # Client CRUD operations
│   ├── Comisiones/      # Commission calculations & data
│   ├── Conciliaciones/  # Reconciliation API calls
│   ├── Polizas/         # Policy operations
│   ├── PDF/             # PDF generation services
│   └── ...
├── utils/               # Utility functions
│   ├── jwtHelper.js     # JWT decode, token expiry, permission checks
│   ├── aseguradoras.js  # Insurance company data
│   ├── getCities.js     # City data retrieval
│   └── ...
├── hooks/               # Custom React hooks
│   └── Clients/         # Client-related hooks (validation, etc.)
└── assets/              # Static assets
```

### Routing Structure

Routing is defined in `App.jsx` with nested routes under `MainLayout`. Key route groups:

- `/login` - Authentication page (public)
- `/sso` - SSO callback handler (public)
- `/inicio` - Dashboard (protected)
- `/clientes` - Client management
- `/polizas/registro` - Register policies
- `/polizas/consulta` - View/query policies
- `/polizas/edicion` - Edit policies
- `/comisiones/liquidacion/internos` - Internal commissions
- `/comisiones/liquidacion/externos` - External/freelance commissions
- `/comisiones/configuracion` - Commission configuration
- `/comisiones/registro/pagos` - Payment registration
- `/conciliacion` - Reconciliation queries and registration

The app uses `BrowserRouter` with `basename="/crm1/"` to handle the deployment path.

### State Management

**React Context API is used for global state:**

1. **AuthContext** (`src/context/AuthContext.jsx`)
   - Manages authentication state, user data, and JWT tokens
   - Provides methods: `login()`, `logout()`, `isLogged()`, `loggedData()`, `hasPermission()`
   - Decodes JWT tokens to extract user info and permissions
   - Automatically checks token expiration and updates remaining time every minute
   - Supports both regular login and SSO authentication

2. **NavContext** (`src/context/NavContext.jsx`)
   - Tracks current selected navigation item
   - Manages modal states (client modal visibility, new client flag)
   - Stores movement/documento context for policy operations
   - Persists navigation state to localStorage

3. **Theme Context** (via `useMode()` hook in `theme.js`)
   - Manages dark/light mode toggle
   - Provides Material-UI theme tokens

### API Integration

All API calls use **Axios** with a base URL configured in `main.jsx`:
```javascript
axios.defaults.baseURL = "https://grupoasistencia.com/API_STAGE";
// Alternative local: "http://localhost/IntegradoorQAS/API"
```

**Service Organization:**
- Services are organized by feature in `/src/services/` (Clientes, Comisiones, Polizas, etc.)
- Each service exports functions that make axios POST/GET calls
- Requests include `data` and `granted` parameters for authorization
- Response format typically: `{ status, data, message }`

**JWT Authentication:**
- JWT token stored in localStorage under `jwt_token` key
- Token is passed in Authorization header: `Authorization: Bearer {token}`
- Helper functions in `utils/jwtHelper.js` handle:
  - Token decoding (client-side, signature verified on backend)
  - Permission checking via `hasPermission()`, `hasAnyPermission()`
  - Token expiry detection
  - User data extraction from token payload

### UI Styling Approach

- **TailwindCSS** for layout and utility classes (primary approach)
- **Material-UI** for component library (Button, Box, ThemeProvider, CssBaseline)
- **Emotion** for styled components (via MUI)
- **PrimeReact** DataTable for complex tables with custom Tailwind passthrough
- **CSS Layers** for proper cascade (tailwind-base → primereact → tailwind-utilities)

The theme uses Material Design token system with dark/light mode support via MUI's `useMode()` hook and ColorModeContext.

## Key Development Patterns

### Permission Checking

Use the `AuthContext` to check user permissions:
```javascript
const { hasPermission, hasAnyPermission } = useAuth();
if (hasPermission('clientes')) { /* render */ }
if (hasAnyPermission(['polizas', 'admin'])) { /* render */ }
```

### Data Fetching

Services return response objects directly; always check the status:
```javascript
const response = await getClientEdit(id, granted);
if (response.status === 'Ok') { /* use response.data */ }
```

### Navigation

Use `NavContext` for navigation state and `useNavigate()` for programmatic routing:
```javascript
const { moving } = useContext(NavContext);
moving("Clientes"); // Updates sidebar and localStorage
```

### Modals and Forms

Modal state is managed in `NavContext` (e.g., `isModalOpenCliente`, `selectedClientId`). Client modal is opened/closed via context and passes data through context state.

## Configuration Files

- **vite.config.js** - Builds to `/dist`, uses `/crm1/` as base path
- **.eslintrc.cjs** - React, React Hooks, and React Refresh rules; max-warnings 0
- **tailwind.config.js** - Dark mode via class, includes PrimeReact paths, custom breakpoints (xxs, xs)
- **postcss.config.js** - TailwindCSS and Autoprefixer
- **package.json** - Configures ES modules, lists all dependencies and dev scripts

## Important Notes

- The app runs at `/crm1/` path in production; ensure links account for this
- JWT tokens are validated and decoded client-side; backend verification is authoritative
- PrimeReact DataTable is used for complex tabular data; customization via `pt` (passthrough) prop
- LocalStorage is used for session persistence (token, userData, permisos, navigation state)
- All API responses should follow the `{ status, data, message }` pattern
- ESLint is strict (max-warnings 0); run `npm run lint` before committing
