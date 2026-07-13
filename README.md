# ExpsTrck - Expense Tracker

A premium, local-first expense tracker built with React, TypeScript, Redux, and Tailwind CSS v4, featuring offline capability and secure background backups to Google Drive.

---

## 🌟 Features for Users

- **Local-First & Offline Ready**: Expenses are recorded instantly and stored locally. Works fully offline, syncing automatically when your internet connection is restored.
- **Real-Time Cross-Device Sync**: Automatically fetches and merges remote changes whenever the browser window or tab gains focus.
- **Reliable Conflict Resolution**: Employs deletion tombstones to ensure deleted transactions stay deleted and additions merge non-destructively across multiple devices.
- **Category Budgets (Caps)**: Set weekly or monthly spending limits for categories (Food, Shopping, Travel, etc.) with real-time visual progress tracks.
- **Flexible Reports**: Group spending statistics by month, quarter, year, or custom date ranges with interactive percentage breakdowns.
- **Frictionless Google Sync**: Backs up transaction history and budget configurations securely to your Google Drive account using the secure, scoped `drive.file` permission.
- **Premium Aesthetics**: Features a balanced design system supporting fluid dark/light HSL theme variables, smooth micro-animations, and custom typography.

---

## 🛠️ Technical Stack (For Developers)

- **Frontend**: React 19 + TypeScript + Vite (Rollup)
- **State Management**: Redux Toolkit (RTK) using modular slices.
- **Clean Architecture**: Presentational UI components are 100% decoupled from state management via custom hooks. **`App.tsx`** is a pure layout view with zero data-fetching, timer loops, or state updates.
- **Hooks & Lifecycles**:
  - `useAuth`: Manages the Google client instance, tab focus sync listeners, and token refresh timers.
  - `useLedger`: Manages mutations, debounced upload side-effects, and online reconnection hooks.
- **Session Security**: Active session metadata and access tokens are isolated in `sessionStorage` (automatically cleared when the tab is closed).
- **Silent Refresh Loop**: Background interval silently refreshes the OAuth access token every 50 minutes to maintain persistent authorization without user-facing popups.
- **Styling**: Tailwind CSS v4 utilizing `@theme` configuration directives inside CSS.
- **Security**: Disables production source maps explicitly, ensuring output bundles are minified and obfuscated.

---

## 🚀 Local Development Setup

### Prerequisites
1. Node.js (v18+)
2. A Google Cloud Console project with the **Google Drive API** enabled and **OAuth 2.0 Client Credentials** configured.

### Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory and add your Google OAuth Client ID:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_oauth_client_id.apps.googleusercontent.com
   ```

3. Run the local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

---

## 📦 Production & Deployment

To compile a minified, obfuscated bundle for production hosting:
```bash
npm run build
```

This compiles static assets into the `dist/` directory:
- `dist/index.html` (Entrypoint)
- `dist/assets/index-*.js` (Minified logic, source maps disabled for security)
- `dist/assets/index-*.css` (Tailwind compiled stylesheet)

You can deploy the contents of the `dist/` folder directly to static hosting platforms such as Vercel, Netlify, Cloudflare Pages, Firebase Hosting, or GitHub Pages.
