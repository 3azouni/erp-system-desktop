# 🚀 Step-by-Step Deployment Guide

## 📋 **What We'll Do**

1. **Test Local Setup** - Verify everything works locally
2. **Deploy to Vercel** - Get your app online
3. **Test Supabase Connection** - Verify database works
4. **Configure Auth Redirects** - Set up authentication

---

## 🔧 **Step 1: Test Local Setup**

### **1.1 Install Dependencies**
```bash
npm install
# or
pnpm install
```

### **1.2 Start Development Server**
```bash
npm run dev
# or
pnpm dev
```

### **1.3 Test Local App**
- Open `http://localhost:3000` in your browser
- Check if the app loads without errors
- Look for any console errors in browser dev tools

**If you see errors, let me know what they are!**

---

## 🚀 **Step 2: Deploy to Vercel**

### **2.1 Prepare Your Code**
```bash
# Make sure all changes are committed
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### **2.2 Create Vercel Account**
1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Sign in** with your GitHub account
3. **Click "New Project"**

### **2.3 Import Your Repository**
1. **Select your GitHub repository** (erp-system-main)
2. **Vercel will auto-detect** it's a Next.js project
3. **Click "Deploy"**

### **2.4 Configure Environment Variables**
**After deployment, go to your Vercel project dashboard:**

1. **Click "Settings"** tab
2. **Click "Environment Variables"**
3. **Add these variables:**

```
NEXT_PUBLIC_SUPABASE_URL=https://tpjmwbpxlfgffkyeijnf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwam13YnB4bGZnZmZreWVpam5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTA3MTAsImV4cCI6MjA2OTQ2NjcxMH0.DGgw5yOGyS_Q3s7FLG4pxj4Uy0t53C305JNvumFCyMM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwam13YnB4bGZnZmZreWVpam5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg5MDcxMCwiZXhwIjoyMDY5NDY2NzEwfQ.QjQwHrZmXfrWQYBCn6LbdGEYqKyViaHNClXa-fl-Ekc
NEXT_PUBLIC_APP_ENV=production
APP_TIMEZONE=Asia/Beirut
JWT_SECRET=your-secure-production-secret-key
```

4. **Click "Save"**
5. **Redeploy** your project

---

## 🔗 **Step 3: Test Supabase Connection**

### **3.1 Check Your Vercel URL**
- After deployment, Vercel will give you a URL like: `https://your-project-name.vercel.app`
- **Save this URL** - you'll need it for Supabase configuration

### **3.2 Test Database Connection**
1. **Visit your Vercel URL**
2. **Try to log in** or access any page
3. **Check browser console** for any Supabase errors
4. **Look for database-related errors**

### **3.3 Common Issues & Solutions**

**If you see "Supabase connection failed":**
- Check environment variables in Vercel
- Verify Supabase project is active
- Check if database schema is deployed

**If you see "Invalid redirect URL":**
- We need to configure Supabase Auth redirects (next step)

---

## 🔐 **Step 4: Configure Supabase Auth Redirects**

### **4.1 Go to Supabase Dashboard**
1. **Visit [supabase.com](https://supabase.com)**
2. **Sign in** to your account
3. **Select your project**: `tpjmwbpxlfgffkyeijnf`

### **4.2 Configure Redirect URLs**
1. **Click "Authentication"** in left sidebar
2. **Click "URL Configuration"**
3. **Add these URLs to "Redirect URLs":**

```
http://localhost:3000/auth/callback
https://your-project-name.vercel.app/auth/callback
```

**Replace `your-project-name` with your actual Vercel project name**

4. **Set "Site URL"** to: `https://your-project-name.vercel.app`
5. **Click "Save"**

---

## 🧪 **Step 5: Test Everything**

### **5.1 Test Authentication**
1. **Visit your Vercel URL**
2. **Try to log in**
3. **Check if redirects work**
4. **Verify you can access the dashboard**

### **5.2 Test Database Operations**
1. **Try to create a product**
2. **Test SKU generation**
3. **Test barcode generation**
4. **Check if data is saved**

### **5.3 Test Search Functionality**
1. **Use the search bar**
2. **Search for products**
3. **Verify SKU search works**

---

## 📞 **How to Get Help**

### **If Something Doesn't Work:**

1. **Check Vercel Logs:**
   - Go to your Vercel project
   - Click "Functions" tab
   - Look for error logs

2. **Check Supabase Logs:**
   - Go to Supabase dashboard
   - Click "Logs" in left sidebar
   - Look for errors

3. **Check Browser Console:**
   - Open browser dev tools (F12)
   - Look for JavaScript errors
   - Check Network tab for failed requests

### **Common Error Messages:**

**"Invalid redirect URL"**
- Add your Vercel URL to Supabase redirect URLs

**"Supabase connection failed"**
- Check environment variables in Vercel
- Verify Supabase project is active

**"Build failed"**
- Check Vercel build logs
- Look for missing dependencies

---

## 🎯 **Success Checklist**

- [ ] App loads on Vercel without errors
- [ ] Can log in successfully
- [ ] Database operations work (create/read products)
- [ ] SKU generation works
- [ ] Barcode generation works
- [ ] Search functionality works
- [ ] No console errors in browser

---

## 📱 **Next Steps After Deployment**

1. **Set up custom domain** (optional)
2. **Configure email notifications**
3. **Set up monitoring**
4. **Add more users**
5. **Import existing data**

---

**Need help?** Tell me:
1. What step you're on
2. Any error messages you see
3. What's not working

I'll help you troubleshoot!
