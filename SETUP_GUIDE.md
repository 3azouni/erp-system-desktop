# 🚀 3DP Commander ERP System Setup Guide

## 📋 Prerequisites
- Node.js 18+ installed
- Git installed
- GitHub account (optional for deployment)

## 🔧 Step 1: Environment Setup

### Create Environment File
Create a `.env.local` file in your project root with the following variables:

```env
# Database Configuration
DATABASE_URL=file:./local.db

# Authentication
JWT_SECRET=your_jwt_secret_key_here_change_in_production

# App Configuration
NEXT_PUBLIC_APP_NAME=3DP Commander
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🗄️ Step 2: Database Setup

### 1. Initialize Local Database
The application uses SQLite for local data storage. Run the following command to set up the database:

```bash
npm run setup-db
```

This will:
- Create the SQLite database file (`local.db`)
- Initialize all required tables
- Insert sample data for testing

### 2. Database Schema
The setup script will create the following tables:
- `users` - User accounts and authentication
- `user_sessions` - Active user sessions
- `orders` - Customer orders
- `products` - Product catalog
- `inventory` - Material stock levels
- `printers` - 3D printer management
- `expenses` - Business expense tracking
- `print_jobs` - Production scheduling
- `notifications` - System notifications
- `app_settings` - Application configuration

## 🔐 Step 3: Authentication Setup

The application uses JWT-based authentication with local storage. The authentication system is automatically configured when you run the setup script.

## 🚀 Step 4: Local Development

### Install Dependencies
```bash
npm install
# or
pnpm install
```

### Run Development Server
```bash
npm run dev
# or
pnpm dev
```

### Default Login Credentials
- Email: `admin@3dpcommander.com`
- Password: `admin123`

## 📦 Step 5: GitHub Repository Setup (Optional)

### 1. Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit: 3DP Commander ERP System"
```

### 2. Create GitHub Repository
1. Go to [github.com](https://github.com)
2. Create a new repository
3. Follow the instructions to push your code

### 3. Push to GitHub
```bash
git remote add origin https://github.com/yourusername/3dp-commander.git
git branch -M main
git push -u origin main
```

## 🌐 Step 6: Deployment (Optional)

### Vercel Deployment
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure the project settings
4. Set environment variables in Vercel dashboard
5. Deploy automatically on push to main branch

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- **Netlify**: Use the Next.js build command
- **Railway**: Direct deployment from GitHub
- **DigitalOcean App Platform**: Container deployment
- **AWS Amplify**: Full-stack deployment

## 🔧 Step 7: Configuration

### Database Configuration
The application uses SQLite by default. The database file is created locally and contains all your data.

### Authentication Configuration
- JWT tokens are stored in local storage
- Sessions are managed in the local database
- Password hashing is handled securely

### Environment Variables
Make sure to set the following environment variables in production:
- `JWT_SECRET`: A strong secret key for JWT signing
- `DATABASE_URL`: Path to your SQLite database file
- `NEXT_PUBLIC_APP_NAME`: Your application name
- `NEXT_PUBLIC_APP_URL`: Your application URL

## 🚀 Step 8: First Run

1. **Start the application**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Login with default credentials**
   - Email: `admin@3dpcommander.com`
   - Password: `admin123`

4. **Explore the features**
   - Dashboard with real-time statistics
   - Order management system
   - Inventory tracking
   - Printer management
   - Expense tracking
   - Production scheduling

## 🔧 Troubleshooting

### Database Issues
- Ensure the database file has proper write permissions
- Check that the setup script ran successfully
- Verify all tables were created correctly

### Authentication Issues
- Clear browser local storage if login fails
- Check JWT_SECRET is set correctly
- Verify user exists in the database

### Development Issues
- Check Node.js version (18+ required)
- Ensure all dependencies are installed
- Verify environment variables are set

## 📚 Next Steps

1. **Customize the application**
   - Modify the default settings
   - Add your business-specific features
   - Customize the UI/UX

2. **Add your data**
   - Import your existing product catalog
   - Add your printer inventory
   - Set up your expense categories

3. **Configure notifications**
   - Set up email notifications (if needed)
   - Configure low stock alerts
   - Set up maintenance reminders

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce the problem
4. Provide system information and error logs

---

**Happy 3D Printing! 🎉** 