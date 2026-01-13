# Finance Tracker

A cross-platform desktop application for personal finance management built with Electron and React. Track your income, expenses, subscriptions, and analyze your spending habits with an intuitive interface.

## Features

- **Dashboard** - Overview of your financial health with income/expense totals, current balance, recent transactions, and monthly trends visualization
- **Income Tracking** - Record and categorize income sources with custom icons and payment provider associations
- **Expense Management** - Track one-time and recurring expenses with billing cycle support for subscriptions
- **Payment Providers** - Manage your payment methods (bank accounts, credit cards, payment platforms)
- **History & Reports** - View financial data by week, month, or year with category breakdowns and CSV export
- **Predictions & Analytics** - Track recurring subscriptions, analyze spending trends, and project future balances
- **Secure** - Master password protection with bcrypt hashing
- **Multi-Currency** - Support for various currencies (EUR, USD, etc.)

## Tech Stack

- **Frontend**: React 18, MDB React UI Kit, FontAwesome
- **Desktop**: Electron 28
- **Database**: SQLite (via sql.js)
- **Build**: Webpack 5, Babel 7
- **Security**: bcryptjs

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/DasBander/finance-tracker.git
cd finance-tracker

# Install dependencies
npm install
```

## Usage

### Development

```bash
# Run the app in development mode
npm start

# Run with file watching for live recompilation
npm run dev
```

### Production Build

```bash
# Build the renderer bundles
npm run build
```

### Distribution

```bash
# Package for all platforms
npm run dist

# Package for specific platforms
npm run dist:win    # Windows (NSIS installer)
npm run dist:mac    # macOS (DMG)
npm run dist:linux  # Linux (AppImage + deb)
```

## Configuration

The application uses a `config.ini` file for basic settings:

```ini
[database]
filename = finance_tracker.db

[app]
window_width = 1400
window_height = 900
min_width = 1000
min_height = 700
```

User preferences (name, currency, profile picture) are stored in the SQLite database and configured through the in-app setup wizard.

## Project Structure

```
finance-tracker/
├── src/
│   ├── index.js              # React entry point
│   ├── App.js                # Main app component with routing
│   └── components/
│       ├── Dashboard.js      # Financial overview
│       ├── IncomePage.js     # Income management
│       ├── OutgoingPage.js   # Expense tracking
│       ├── HistoryPage.js    # Historical data view
│       ├── PredictionsPage.js# Analytics and predictions
│       ├── PaymentProviderPage.js
│       ├── SetupWizard.js    # First-time setup
│       ├── LoginScreen.js    # Authentication
│       ├── Sidebar.js        # Navigation
│       └── TitleBar.js       # Window controls
├── main.js                   # Electron main process
├── preload.js                # Secure IPC bridge
├── database.js               # SQLite operations
├── config.ini                # App configuration
├── webpack.config.js         # Bundler configuration
└── package.json
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `settings` | User preferences and master password |
| `income` | Income transactions |
| `outgoing` | Expense transactions (including recurring) |
| `payment_providers` | Payment methods |
| `image_cache` | Stored images as BLOBs |

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run in development mode |
| `npm run dev` | Development with file watching |
| `npm run build` | Build production bundles |
| `npm run dist` | Package for all platforms |
| `npm run dist:win` | Package for Windows |
| `npm run dist:mac` | Package for macOS |
| `npm run dist:linux` | Package for Linux |

## Author

Marc Fraedrich

## License

MIT
