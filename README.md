# 3DP Commander - ERP System

[![Next.js](https://img.shields.io/badge/Next.js-14.2.16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3.44.0-003B57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)

A comprehensive ERP system designed specifically for 3D printing businesses. Manage orders, inventory, printers, expenses, and production scheduling all in one place.

## 🚀 Features

- **Order Management**: Track customer orders, delivery dates, and order status
- **Inventory Management**: Monitor filament, resin, and material stock levels
- **Printer Management**: Manage 3D printers, their status, and maintenance schedules
- **Expense Tracking**: Record and categorize business expenses
- **Production Scheduling**: Schedule print jobs and manage printer queues
- **Analytics Dashboard**: Real-time insights into business performance
- **User Management**: Secure authentication and role-based access control
- **BOM Management**: Bill of Materials for complex print jobs
- **Export Functionality**: Export data to CSV/Excel formats

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes with SQLite database
- **UI Components**: Radix UI primitives with custom styling
- **Authentication**: JWT-based authentication with local storage
- **Database**: SQLite for local data storage
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React for consistent iconography

## 📁 Project Structure

```
erp-system-main/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── orders/        # Order management
│   │   ├── inventory/     # Inventory management
│   │   ├── printers/      # Printer management
│   │   ├── expenses/      # Expense tracking
│   │   └── local-db/      # Database initialization
│   ├── analytics/         # Analytics dashboard
│   ├── orders/            # Orders page
│   ├── inventory/         # Inventory page
│   ├── printers/          # Printers page
│   ├── expenses/          # Expenses page
│   ├── products/          # Products page
│   ├── bom/               # BOM management
│   ├── scheduler/         # Production scheduling
│   ├── settings/          # Application settings
│   └── profile/           # User profile
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── pages/            # Page-specific components
│   └── modals/           # Form modals
├── lib/                  # Utility functions
│   ├── local-db.ts       # Database operations
│   ├── auth.ts           # Authentication utilities
│   └── utils.ts          # General utilities
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
└── scripts/              # Database setup scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd erp-system-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up the database**
   ```bash
   npm run setup-db
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Environment Variables

#### Local Development
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Application Environment
NEXT_PUBLIC_APP_ENV=local

# Application Settings
APP_TIMEZONE=Asia/Beirut

# JWT Secret (for local development)
JWT_SECRET=your-secret-key-change-in-production
```

#### Vercel Deployment
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
   - `NEXT_PUBLIC_APP_ENV` = `production`
   - `APP_TIMEZONE` = `Asia/Beirut`
   - `JWT_SECRET` = Your secure JWT secret

#### Environment Variable Security
- **NEXT_PUBLIC_*** variables are exposed to the browser
- **SUPABASE_SERVICE_ROLE_KEY** is server-only and never exposed to the browser
- Never commit `.env.local` to version control

### Database Setup

The application uses **Supabase** as the database backend. Follow these steps to set up your database:

#### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and API keys from the Settings → API section

#### 2. Database Schema
The application requires the following tables:
- `users` - User authentication and profiles
- `products` - Product catalog
- `inventory` - Material inventory
- `orders` - Customer orders
- `printers` - 3D printer management
- `expenses` - Business expenses
- `components` - Component inventory
- `print_jobs` - Print job scheduling
- `app_settings` - Application configuration

#### 3. Row Level Security (RLS)
Enable RLS on all tables and configure policies based on user roles:
- Admin users have full access
- Regular users have limited access based on their department
- Public access is restricted

#### 4. Sample Data
After setting up the schema, you can populate with sample data for testing.

## 📊 Features Overview

### Dashboard
- Real-time statistics and metrics
- Revenue tracking and expense monitoring
- Printer status overview
- Order status summary
- Low stock alerts

### Order Management
- Create and edit customer orders
- Track order status (New, In Progress, Shipped, Delivered)
- Manage customer information
- Generate order reports
- Export order data

### Inventory Management
- Track filament and resin stock levels
- Set minimum threshold alerts
- Monitor material usage
- Generate inventory reports
- Bulk import/export functionality

### Printer Management
- Add and configure 3D printers
- Monitor printer status (Idle, Printing, Maintenance, Offline)
- Track printer specifications and capabilities
- Schedule maintenance tasks
- Generate printer utilization reports

### Expense Tracking
- Categorize business expenses
- Track vendor information
- Upload receipt images
- Generate expense reports
- Export expense data

### Production Scheduling
- Schedule print jobs
- Assign jobs to specific printers
- Set job priorities
- Track job progress
- Manage printer queues

## 🔐 Authentication

The application uses JWT-based authentication with the following features:

- Secure login/logout functionality
- Session management
- Role-based access control
- Password change functionality
- Session timeout handling

## 📈 Analytics

The analytics dashboard provides:

- Revenue trends and projections
- Order completion rates
- Printer utilization statistics
- Expense analysis
- Inventory turnover rates
- Customer order patterns

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between themes
- **Accessibility**: WCAG 2.1 compliant components
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Real-time feedback
- **Form Validation**: Client and server-side validation

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on push to main branch**

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Netlify**: Use the Next.js build command
- **Railway**: Direct deployment from GitHub
- **DigitalOcean App Platform**: Container deployment
- **AWS Amplify**: Full-stack deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce the problem
4. Provide system information and error logs

## 🔄 Updates

Stay updated with the latest features and improvements:

1. Follow the repository for updates
2. Check the [Releases](https://github.com/your-repo/releases) page
3. Review the [CHANGELOG](CHANGELOG.md) for detailed changes

---

**Built with ❤️ for 3D printing businesses**
