# 🖥️ 3DP Commander Desktop Setup Guide

## 🎯 Overview

This guide will help you set up 3DP Commander as a **Windows desktop application** that runs locally on your PC with local data storage. No internet connection required after setup!

## 📋 Prerequisites

- **Windows 10/11** (64-bit)
- **Node.js 18+** installed
- **Git** installed (optional, for development)

## 🚀 Quick Setup (Recommended)

### Step 1: Download and Extract
1. Download the project files
2. Extract to a folder (e.g., `C:\3DP-Commander`)

### Step 2: Install Dependencies
Open Command Prompt in the project folder and run:
```bash
npm install
```

### Step 3: Set up Local Database
```bash
npm run setup-db
```

### Step 4: Start the Application
```bash
npm run dev
```

### Step 5: Access the Application
- Open your browser and go to: `http://localhost:3000`
- Login with default credentials:
  - **Email**: `admin@3dpcommander.com`
  - **Password**: `admin123`

## 🖥️ Desktop Application Setup

### Option 1: Development Mode (Recommended for testing)
```bash
npm run electron-dev
```

### Option 2: Build Desktop App
```bash
# Build the application
npm run build

# Package for Windows
npm run package
```

The packaged application will be created in the `dist` folder.

## 📁 Data Storage

Your data is stored locally in:
```
C:\Users\[YourUsername]\Documents\3DP Commander\3dp-commander.db
```

### Backup Your Data
To backup your data:
1. Close the application
2. Copy the database file from the Documents folder
3. Store it in a safe location

### Restore Your Data
To restore your data:
1. Close the application
2. Replace the database file in the Documents folder
3. Restart the application

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the project root:
```env
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NEXT_PUBLIC_APP_NAME=3DP Commander Desktop
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Location
The SQLite database is automatically created in:
- **Path**: `%USERPROFILE%\Documents\3DP Commander\3dp-commander.db`
- **Size**: Typically 1-10 MB depending on data
- **Backup**: Copy this file to backup your data

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Set up database
npm run setup-db

# Start development server
npm run dev

# Start desktop app in development
npm run electron-dev

# Build for production
npm run build

# Package for Windows
npm run package

# Run linting
npm run lint
```

## 📊 Features Available

### ✅ Working Features
- **User Authentication** - Local login system
- **Product Management** - Add, edit, delete products
- **Inventory Management** - Track materials and stock
- **Printer Management** - Monitor printer status
- **Order Management** - Process customer orders
- **Expense Tracking** - Record business expenses
- **Analytics Dashboard** - Business insights
- **Settings** - Configure application parameters

### 🔄 Data Management
- **Local Storage** - All data stored on your PC
- **No Internet Required** - Works offline
- **Easy Backup** - Simple file copy to backup
- **Fast Performance** - SQLite database for speed

## 🚨 Troubleshooting

### Common Issues

1. **"Database not found" error**
   ```bash
   npm run setup-db
   ```

2. **"Port 3000 already in use"**
   - Close other applications using port 3000
   - Or change the port in package.json

3. **"Node modules not found"**
   ```bash
   npm install
   ```

4. **"Electron not found"**
   ```bash
   npm install electron --save-dev
   ```

5. **"Database locked" error**
   - Close the application completely
   - Restart the application

### Performance Issues

1. **Slow startup**
   - First run takes longer due to database initialization
   - Subsequent runs are faster

2. **Large database file**
   - Database grows with data
   - Normal for business applications

## 🔒 Security

### Local Security
- **No cloud storage** - All data stays on your PC
- **No internet required** - Works completely offline
- **Local authentication** - No external dependencies
- **File-based backup** - Simple backup/restore

### Data Protection
- **SQLite encryption** - Optional database encryption
- **Local access only** - No remote access
- **User permissions** - Role-based access control

## 📈 Scaling

### For Small Business (Current Setup)
- **Users**: 1-10 users
- **Data**: Up to 10,000 records
- **Performance**: Excellent for local use

### For Larger Business
- **Multiple installations** - Install on each workstation
- **Shared database** - Use network drive for shared database
- **Backup automation** - Set up automated backups

## 🆘 Support

### Getting Help
1. Check this guide first
2. Review the console output for errors
3. Check the database file exists
4. Restart the application

### Logs
- **Application logs**: Check browser console (F12)
- **Database logs**: Check terminal output
- **Electron logs**: Check terminal output

### Reset Application
To completely reset the application:
1. Close the application
2. Delete the database file from Documents folder
3. Run `npm run setup-db`
4. Restart the application

## 🎉 Success!

Once setup is complete, you have:
- ✅ **Local desktop application**
- ✅ **Offline functionality**
- ✅ **Secure local data storage**
- ✅ **Easy backup/restore**
- ✅ **No internet dependency**
- ✅ **Fast performance**

Your 3DP Commander desktop application is ready to use! 