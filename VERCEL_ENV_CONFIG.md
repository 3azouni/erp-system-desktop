# 🚀 Vercel Environment Variables Configuration

## 📋 **Required Environment Variables**

Copy these exact values to your Vercel project settings:

### **Supabase Configuration**
```
NEXT_PUBLIC_SUPABASE_URL=https://tpjmwbpxlfgffkyeijnf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwam13YnB4bGZnZmZreWVpam5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTA3MTAsImV4cCI6MjA2OTQ2NjcxMH0.DGgw5yOGyS_Q3s7FLG4pxj4Uy0t53C305JNvumFCyMM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwam13YnB4bGZnZmZreWVpam5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg5MDcxMCwiZXhwIjoyMDY5NDY2NzEwfQ.QjQwHrZmXfrWQYBCn6LbdGEYqKyViaHNClXa-fl-Ekc
```

### **Deployment Configuration**
```
NEXT_PUBLIC_APP_ENV=production
```

### **App Configuration**
```
APP_TIMEZONE=Asia/Beirut
JWT_SECRET=your-secure-production-secret-key
```

## 🔧 **How to Set Environment Variables in Vercel**

1. **Go to your Vercel project dashboard**
2. **Click "Settings" tab**
3. **Click "Environment Variables"**
4. **Add each variable above**
5. **Make sure to select "Production" environment**
6. **Click "Save"**

## 🧪 **Test the Configuration**

After setting the environment variables, you can test the connection using:

```bash
# Test Supabase connection
curl -X GET "https://tpjmwbpxlfgffkyeijnf.supabase.co/rest/v1/" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwam13YnB4bGZnZmZreWVpam5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTA3MTAsImV4cCI6MjA2OTQ2NjcxMH0.DGgw5yOGyS_Q3s7FLG4pxj4Uy0t53C305JNvumFCyMM"
```

## ⚠️ **Important Notes**

- **Never commit these keys to your repository**
- **Use different keys for development and production**
- **Rotate keys regularly for security**
- **The service role key has admin privileges - keep it secure**

## 🔐 **Security Best Practices**

1. **Use environment variables for all sensitive data**
2. **Never expose service role keys in client-side code**
3. **Use Row Level Security (RLS) in Supabase**
4. **Regularly audit your Supabase project**
5. **Monitor API usage and costs**

## 📞 **Support**

If you need help with the configuration:
- Check the Supabase documentation
- Review the Vercel deployment logs
- Test the connection locally first
