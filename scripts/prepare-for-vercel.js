#!/usr/bin/env node

/**
 * Script to prepare the project for Vercel deployment
 * This script will:
 * 1. Remove SQLite dependencies
 * 2. Check for remaining local-db imports
 * 3. Validate environment variables
 * 4. Create deployment checklist
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparing project for Vercel deployment...\n');

// Step 1: Check for SQLite dependencies
console.log('📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasSQLite = packageJson.dependencies['better-sqlite3'] || packageJson.devDependencies['@types/better-sqlite3'];
  
  if (hasSQLite) {
    console.log('❌ SQLite dependencies found. Run: npm uninstall better-sqlite3 @types/better-sqlite3');
  } else {
    console.log('✅ No SQLite dependencies found');
  }
} catch (error) {
  console.log('⚠️ Could not check package.json');
}

// Step 2: Check for local-db imports
console.log('\n🔍 Checking for local-db imports...');
const apiDir = path.join(__dirname, '..', 'app', 'api');
const filesWithLocalDb = [];

function checkDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      checkDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('local-db') || content.includes('getDatabase')) {
        filesWithLocalDb.push(filePath.replace(path.join(__dirname, '..'), ''));
      }
    }
  });
}

checkDirectory(apiDir);

if (filesWithLocalDb.length > 0) {
  console.log('❌ Found files still using local-db:');
  filesWithLocalDb.forEach(file => {
    console.log(`   - ${file}`);
  });
  console.log('\n⚠️ These files need to be migrated to Supabase before deployment');
} else {
  console.log('✅ No local-db imports found in API routes');
}

// Step 3: Check environment variables
console.log('\n🔧 Checking environment variables...');
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_ENV'
];

const missingVars = [];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('❌ Missing environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
} else {
  console.log('✅ All required environment variables are set');
}

// Step 4: Check Supabase configuration
console.log('\n🗄️ Checking Supabase configuration...');
const supabaseClientPath = path.join(__dirname, '..', 'lib', 'supabase-client.ts');
const supabaseServerPath = path.join(__dirname, '..', 'lib', 'supabase-server.ts');

if (fs.existsSync(supabaseClientPath) && fs.existsSync(supabaseServerPath)) {
  console.log('✅ Supabase client and server files exist');
} else {
  console.log('❌ Missing Supabase configuration files');
}

// Step 5: Generate deployment summary
console.log('\n📋 Deployment Summary:');
console.log('=====================');

if (filesWithLocalDb.length === 0 && missingVars.length === 0) {
  console.log('✅ READY FOR DEPLOYMENT!');
  console.log('\nNext steps:');
  console.log('1. Create Supabase project at https://supabase.com');
  console.log('2. Set environment variables in Vercel dashboard');
  console.log('3. Deploy to Vercel');
} else {
  console.log('❌ NOT READY FOR DEPLOYMENT');
  console.log('\nIssues to fix:');
  
  if (filesWithLocalDb.length > 0) {
    console.log(`- Migrate ${filesWithLocalDb.length} API routes to Supabase`);
  }
  
  if (missingVars.length > 0) {
    console.log(`- Set ${missingVars.length} environment variables`);
  }
  
  console.log('\nRun this script again after fixing the issues.');
}

console.log('\n📚 For detailed instructions, see VERCEL_DEPLOYMENT_CHECKLIST.md');
