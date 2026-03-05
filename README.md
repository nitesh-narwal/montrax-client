# Montrax - Personal Finance Manager

A modern, full-featured personal finance management application built with React and TypeScript. Track expenses, manage budgets, analyze spending patterns, and gain insights into your financial health.

![React](https://img.shields.io/badge/React-18.3-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.3-purple?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

### Core Functionality
- **Expense Tracking** - Log and categorize all your expenses with custom categories and icons
- **Income Management** - Track multiple income sources and monitor cash flow
- **Budget Planning** - Set monthly budgets by category and track progress in real-time
- **Recurring Transactions** - Automate tracking for regular bills and subscriptions

### Analytics & Insights
- **Visual Analytics** - Interactive charts and graphs powered by Chart.js and Recharts
- **Spending Insights** - AI-powered analysis of your spending patterns
- **Category Breakdown** - Understand where your money goes with detailed categorization

### Additional Features
- **Bank Import** - Import transactions from bank statements
- **Subscription Management** - Track and manage recurring subscriptions
- **Customizable Categories** - Create custom expense/income categories with icons
- **User Profiles** - Personalized settings and preferences

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS, shadcn/ui (Radix UI) |
| **State Management** | Zustand |
| **Data Fetching** | TanStack React Query, Axios |
| **Forms** | React Hook Form, Zod |
| **Charts** | Chart.js, Recharts |
| **Routing** | React Router v6 |
| **Testing** | Vitest, Testing Library |

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/montrax-frontend.git
   cd montrax-frontend/money-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:8080/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run build:dev` | Build with development mode settings |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
src/
├── components/
│   ├── layouts/       # Page layouts (Dashboard, Auth)
│   ├── shared/        # Reusable components
│   └── ui/            # shadcn/ui components
├── hooks/             # Custom React hooks
├── lib/               # Utilities and API configuration
├── pages/             # Route page components
├── store/             # Zustand state management
├── test/              # Test configuration and utilities
└── types/             # TypeScript type definitions
```

## Deployment

### Deploy to Vercel

This project is optimized for Vercel deployment with the included `vercel.json` configuration.

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard
4. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/montrax-frontend)

### Manual Deployment

```bash
# Build the project
npm run build

# The output will be in the dist/ folder
# Deploy the dist/ folder to any static hosting provider
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL | Yes |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Lucide Icons](https://lucide.dev/) for the icon set