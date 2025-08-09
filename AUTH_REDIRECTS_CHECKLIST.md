# 🔐 Auth Redirects Checklist

## 📋 **Required Redirect URLs for Supabase**

### **Local Development**
```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
```

### **Vercel Preview URLs (Pattern)**
```
https://[project-name]-git-[branch]-[username].vercel.app/auth/callback
```

**Examples:**
- Main branch: `https://3dp-commander-git-main-yourusername.vercel.app/auth/callback`
- Feature branch: `https://3dp-commander-git-feature-auth-yourusername.vercel.app/auth/callback`
- Preview branch: `https://3dp-commander-git-preview-yourusername.vercel.app/auth/callback`

### **Production URLs**
```
https://your-domain.com/auth/callback
https://www.your-domain.com/auth/callback
```

## ✅ **Configuration Checklist**

### **Supabase Dashboard Setup**
- [ ] Go to [supabase.com](https://supabase.com)
- [ ] Select project: `tpjmwbpxlfgffkyeijnf`
- [ ] Navigate to Authentication → URL Configuration
- [ ] Add all redirect URLs listed above
- [ ] Set Site URL to production domain
- [ ] Save configuration

### **Authentication Flow Verification**
- [ ] PKCE flow enabled (default)
- [ ] No implicit flow (more secure)
- [ ] Refresh token rotation enabled
- [ ] JWT expiry: 3600 seconds (1 hour)
- [ ] Refresh token expiry: 2592000 seconds (30 days)

### **Environment Variables**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `NEXT_PUBLIC_APP_ENV` set to `production`
- [ ] `APP_TIMEZONE` set to `Asia/Beirut`

## 🚀 **Deployment Steps**

### **Before Vercel Deployment**
1. [ ] Add local redirect URLs to Supabase
2. [ ] Configure PKCE flow
3. [ ] Set environment variables

### **After Vercel Deployment**
1. [ ] Get preview URL from Vercel dashboard
2. [ ] Add preview URL to Supabase redirect URLs
3. [ ] Test authentication flow
4. [ ] Verify no CORS errors

### **Production Launch**
1. [ ] Add production domain to redirect URLs
2. [ ] Set Site URL to production domain
3. [ ] Test authentication in production
4. [ ] Verify HTTPS redirects

## 📍 **Where to Find Missing Keys**

### **NEXT_PUBLIC_APP_ENV**
**Values:**
- `local` - for local development
- `preview` - for Vercel preview deployments
- `production` - for production deployment

**Set in:**
- `.env.local` for local development
- Vercel Environment Variables for deployment

### **APP_TIMEZONE**
**Value:** `Asia/Beirut`

**Set in:**
- `.env.local` for local development
- Vercel Environment Variables for deployment

## 🔍 **Screenshots to Take**

1. **Supabase Authentication Dashboard**
   - Location: Supabase Dashboard → Authentication
   - Action: Click "URL Configuration"

2. **Redirect URLs Section**
   - Location: Authentication → URL Configuration
   - Action: Paste the URLs from checklist

3. **Site URL Configuration**
   - Location: Authentication → URL Configuration
   - Action: Enter production domain

4. **Save Button**
   - Location: Bottom of URL Configuration page
   - Action: Click "Save"

## ⚠️ **Common Issues**

### **"Invalid redirect URL" Error**
- Check exact URL match (no trailing slashes)
- Verify protocol (http vs https)
- Ensure URL is added to Supabase

### **Authentication Loop**
- Verify Site URL is correct
- Check callback URL matches exactly
- Ensure PKCE flow is enabled

### **CORS Errors**
- Add domain to Supabase allowed origins
- Check environment variables
- Verify Supabase project settings

## 📞 **Quick Reference**

**Supabase Project ID:** `tpjmwbpxlfgffkyeijnf`
**Supabase URL:** `https://tpjmwbpxlfgffkyeijnf.supabase.co`

**Required Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://tpjmwbpxlfgffkyeijnf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwam13YnB4bGZnZmZreWVpam5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTA3MTAsImV4cCI6MjA2OTQ2NjcxMH0.DGgw5yOGyS_Q3s7FLG4pxj4Uy0t53C305JNvumFCyMM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwam13YnB4bGZnZmZreWVpam5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg5MDcxMCwiZXhwIjoyMDY5NDY2NzEwfQ.QjQwHrZmXfrWQYBCn6LbdGEYqKyViaHNClXa-fl-Ekc
NEXT_PUBLIC_APP_ENV=production
APP_TIMEZONE=Asia/Beirut
```

---

**Note:** Always test authentication flows after making changes to redirect URLs.
