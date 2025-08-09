# 🔐 Supabase Auth Redirect Configuration

## 📋 **Overview**

This document provides step-by-step instructions for configuring Supabase Authentication redirect URLs for your 3DP Commander application deployed on Vercel.

## 🎯 **Required Redirect URLs**

### **Vercel Preview URLs**
```
https://your-project-name-git-main-your-username.vercel.app/auth/callback
https://your-project-name-git-feature-branch-your-username.vercel.app/auth/callback
https://your-project-name-git-preview-branch-your-username.vercel.app/auth/callback
```

### **Production URLs**
```
https://your-domain.com/auth/callback
https://www.your-domain.com/auth/callback
```

### **Local Development**
```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
```

## 🔧 **Step-by-Step Configuration**

### **Step 1: Access Supabase Dashboard**

1. **Go to [supabase.com](https://supabase.com)**
2. **Sign in to your account**
3. **Select your project**: `tpjmwbpxlfgffkyeijnf`
4. **Navigate to Authentication Settings**

### **Step 2: Configure Redirect URLs**

1. **Click on "Authentication" in the left sidebar**
2. **Click on "URL Configuration"**
3. **Find the "Redirect URLs" section**

### **Step 3: Add Redirect URLs**

**Copy and paste these URLs into the "Redirect URLs" field:**

```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
https://your-project-name-git-main-your-username.vercel.app/auth/callback
https://your-project-name-git-feature-branch-your-username.vercel.app/auth/callback
https://your-project-name-git-preview-branch-your-username.vercel.app/auth/callback
https://your-domain.com/auth/callback
https://www.your-domain.com/auth/callback
```

**Replace the following placeholders:**
- `your-project-name` → Your actual Vercel project name
- `your-username` → Your Vercel username
- `your-domain.com` → Your actual production domain

### **Step 4: Configure Site URL**

**Set the "Site URL" to your production domain:**
```
https://your-domain.com
```

### **Step 5: Save Configuration**

1. **Click "Save" button**
2. **Wait for confirmation message**
3. **Test the configuration**

## 🔍 **Screenshots Guide**

### **Screenshot 1: Authentication Dashboard**
- **Location**: Supabase Dashboard → Authentication
- **What to look for**: URL Configuration section
- **Action**: Click "URL Configuration"

### **Screenshot 2: Redirect URLs Section**
- **Location**: Authentication → URL Configuration
- **What to look for**: "Redirect URLs" text area
- **Action**: Paste the URLs listed above

### **Screenshot 3: Site URL Configuration**
- **Location**: Authentication → URL Configuration
- **What to look for**: "Site URL" field
- **Action**: Enter your production domain

### **Screenshot 4: Save Button**
- **Location**: Bottom of URL Configuration page
- **What to look for**: "Save" button
- **Action**: Click to save changes

## 🔐 **Authentication Flow Configuration**

### **PKCE Flow (Recommended)**
- ✅ **PKCE is enabled by default**
- ✅ **No implicit flow** (more secure)
- ✅ **Refresh token rotation** enabled

### **Security Settings**
- **JWT Expiry**: 3600 seconds (1 hour)
- **Refresh Token Expiry**: 2592000 seconds (30 days)
- **Enable refresh token rotation**: ✅ Yes

## 🚀 **Vercel-Specific Configuration**

### **Environment Variables in Vercel**
Ensure these are set in your Vercel project:

```
NEXT_PUBLIC_SUPABASE_URL=https://tpjmwbpxlfgffkyeijnf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwam13YnB4bGZnZmZreWVpam5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTA3MTAsImV4cCI6MjA2OTQ2NjcxMH0.DGgw5yOGyS_Q3s7FLG4pxj4Uy0t53C305JNvumFCyMM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwam13YnB4bGZnZmZreWVpam5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg5MDcxMCwiZXhwIjoyMDY5NDY2NzEwfQ.QjQwHrZmXfrWQYBCn6LbdGEYqKyViaHNClXa-fl-Ekc
NEXT_PUBLIC_APP_ENV=production
APP_TIMEZONE=Asia/Beirut
```

### **Vercel Preview URLs Pattern**
Vercel generates preview URLs in this pattern:
```
https://[project-name]-git-[branch]-[username].vercel.app
```

**Examples:**
- Main branch: `https://3dp-commander-git-main-johndoe.vercel.app`
- Feature branch: `https://3dp-commander-git-feature-auth-johndoe.vercel.app`
- Preview branch: `https://3dp-commander-git-preview-johndoe.vercel.app`

## 🧪 **Testing Configuration**

### **Test Local Development**
1. **Start development server**: `npm run dev`
2. **Navigate to**: `http://localhost:3000/login`
3. **Test login flow**
4. **Verify redirect to**: `http://localhost:3000/auth/callback`

### **Test Vercel Preview**
1. **Deploy to Vercel**
2. **Get preview URL** from Vercel dashboard
3. **Add preview URL** to Supabase redirect URLs
4. **Test authentication flow**

### **Test Production**
1. **Deploy to production**
2. **Add production domain** to Supabase redirect URLs
3. **Test authentication flow**
4. **Verify secure redirects**

## ⚠️ **Common Issues & Solutions**

### **Issue 1: "Invalid redirect URL" Error**
**Solution:**
- Check that the exact URL is added to Supabase
- Ensure no trailing slashes mismatch
- Verify protocol (http vs https)

### **Issue 2: Authentication Loop**
**Solution:**
- Verify Site URL is set correctly
- Check that callback URL matches exactly
- Ensure PKCE flow is enabled

### **Issue 3: CORS Errors**
**Solution:**
- Add your domain to Supabase allowed origins
- Check that environment variables are correct
- Verify Supabase project settings

## 📋 **Checklist**

### **Before Deployment**
- [ ] Local redirect URL added: `http://localhost:3000/auth/callback`
- [ ] PKCE flow enabled
- [ ] Site URL configured
- [ ] Environment variables set

### **After Vercel Deployment**
- [ ] Preview URL added to redirect URLs
- [ ] Production domain added (when available)
- [ ] Authentication flow tested
- [ ] No CORS errors

### **Production Launch**
- [ ] Production domain in redirect URLs
- [ ] Site URL set to production domain
- [ ] HTTPS redirects working
- [ ] Authentication flow tested in production

## 🔗 **Useful Links**

- **Supabase Auth Documentation**: https://supabase.com/docs/guides/auth
- **Vercel Environment Variables**: https://vercel.com/docs/projects/environment-variables
- **Next.js Auth Configuration**: https://nextjs.org/docs/authentication

## 📞 **Support**

If you encounter issues:
1. **Check Supabase logs** in the dashboard
2. **Verify environment variables** in Vercel
3. **Test with different browsers**
4. **Check network tab** for redirect issues

---

**Note**: Always test authentication flows in each environment (local, preview, production) after making changes to redirect URLs.
