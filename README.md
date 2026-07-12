# Ledger - Expense Tracker

A premium, local-first expense tracker built with React, TypeScript, Redux, and Tailwind CSS v4, featuring offline capability and secure background backups to Google Drive.

---

## 🌟 Features for Users

- **Local-First & Offline Ready**: Expenses are recorded instantly and stored locally. Works fully offline, syncing automatically when your internet connection is restored.
- **Category Budgets (Caps)**: Set weekly or monthly spending limits for categories (Food, Shopping, Travel, etc.) with real-time visual progress tracks.
- **Flexible Reports**: Group spending statistics by month, quarter, year, or custom date ranges with interactive percentage breakdowns.
- **Frictionless Google Sync**: Backs up transaction history and budget configurations securely to your Google Drive account using the secure, scoped `drive.file` permission.
- **Premium Aesthetics**: Features a balanced design system supporting fluid dark/light HSL theme variables, smooth micro-animations, and custom typography.

---

## 🛠️ Technical Stack (For Developers)

- **Frontend**: React 19 + TypeScript + Vite (Rollup)
- **State Management**: Redux Toolkit (RTK) using modular slices.
- **Side-Effects (Async/Sync)**: Decoupled Google API requests managed via Redux Async Thunks (`createAsyncThunk`).
- **Clean Architecture**: Presentational UI components are completely decoupled from state management via custom React hooks (`useAuth`, `useLedger`).
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
