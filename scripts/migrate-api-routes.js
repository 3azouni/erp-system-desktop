#!/usr/bin/env node

/**
 * Script to migrate all API routes from SQLite to Supabase
 * This script will:
 * 1. Find all API routes using local-db
 * 2. Migrate them to use Supabase
 * 3. Create backup of original files
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting API routes migration to Supabase...\n');

// Migration templates for different route types
const migrationTemplates = {
  // Simple CRUD routes
  simple: {
    get: `import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Query from Supabase
    const { data, error } = await supabaseAdmin
      .from('TABLE_NAME')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ TABLE_NAME: data })
  } catch (error) {
    console.error("Get TABLE_NAME API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}`,
    post: `import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { FIELD_NAMES } = body

    if (!REQUIRED_FIELDS) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    // Insert into Supabase
    const { data, error } = await supabaseAdmin
      .from('TABLE_NAME')
      .insert({
        FIELD_VALUES
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ TABLE_NAME: data }, { status: 201 })
  } catch (error) {
    console.error("Create TABLE_NAME API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}`
  }
};

// Routes that need special handling
const specialRoutes = [
  'app/api/auth/logout/route.ts',
  'app/api/local-db/init/route.ts',
  'app/api/local-db/migrate/route.ts',
  'app/api/local-db/sample-data/route.ts',
  'app/api/local-db/status/route.ts',
  'app/api/export/route.ts'
];

// Routes that should be disabled in production (local-db specific)
const disableInProduction = [
  'app/api/local-db/init/route.ts',
  'app/api/local-db/migrate/route.ts',
  'app/api/local-db/sample-data/route.ts',
  'app/api/local-db/status/route.ts'
];

function migrateRoute(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already migrated
    if (content.includes('supabaseAdmin') || content.includes('@/lib/supabase-server')) {
      return { status: 'already_migrated', file: filePath };
    }

    // Create backup
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, content);
    console.log(`📦 Created backup: ${backupPath}`);

    // Determine table name from file path
    const pathParts = filePath.split('/');
    const tableName = pathParts[pathParts.length - 2]; // e.g., 'inventory' from 'app/api/inventory/route.ts'
    
    let newContent = content;

    // Replace imports
    newContent = newContent.replace(
      /import.*getDatabase.*from.*local-db.*\n/g,
      `import { supabaseAdmin } from "@/lib/supabase-server"\n`
    );
    
    newContent = newContent.replace(
      /import.*initializeDatabase.*from.*local-db.*\n/g,
      ''
    );

    // Replace database initialization
    newContent = newContent.replace(
      /\/\/ Initialize database if needed[\s\S]*?} catch \(error\) {[\s\S]*?console\.error\("Database initialization error:", error\)[\s\S]*?}/g,
      ''
    );

    // Replace getDatabase() calls with Supabase queries
    newContent = newContent.replace(
      /const database = getDatabase\(\)\s*\n\s*const \w+ = database\.prepare\('SELECT \* FROM (\w+) ORDER BY created_at DESC'\)\.all\(\)/g,
      `const { data: $1, error } = await supabaseAdmin
      .from('$1')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }`
    );

    // Replace simple SELECT queries
    newContent = newContent.replace(
      /const \w+ = database\.prepare\('SELECT \* FROM (\w+)'\)\.all\(\)/g,
      `const { data: $1, error } = await supabaseAdmin
      .from('$1')
      .select('*')

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }`
    );

    // Replace INSERT statements
    newContent = newContent.replace(
      /const stmt = database\.prepare\([\s\S]*?\)\s*const result = stmt\.run\([\s\S]*?\)\s*\/\/ Get the created \w+\s*const \w+ = database\.prepare\('SELECT \* FROM \w+ WHERE id = \?'\)\.get\(result\.lastInsertRowid\)/g,
      `const { data: ${tableName}, error } = await supabaseAdmin
      .from('${tableName}')
      .insert({
        // Add your fields here
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }`
    );

    // Write migrated content
    fs.writeFileSync(filePath, newContent);
    return { status: 'migrated', file: filePath };
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error.message);
    return { status: 'error', file: filePath, error: error.message };
  }
}

function disableRoute(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Create backup
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, content);
    
    // Replace with serverless-compatible version
    const newContent = `import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    error: "This endpoint is not available in serverless environment",
    message: "Use Supabase directly for database operations"
  }, { status: 501 })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: "This endpoint is not available in serverless environment",
    message: "Use Supabase directly for database operations"
  }, { status: 501 })
}`;

    fs.writeFileSync(filePath, newContent);
    return { status: 'disabled', file: filePath };
  } catch (error) {
    console.error(`❌ Error disabling ${filePath}:`, error.message);
    return { status: 'error', file: filePath, error: error.message };
  }
}

// Find all API routes
function findApiRoutes(dir) {
  const routes = [];
  
  function scanDirectory(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    files.forEach(file => {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file === 'route.ts') {
        routes.push(filePath);
      }
    });
  }
  
  scanDirectory(dir);
  return routes;
}

// Main migration process
const apiDir = path.join(__dirname, '..', 'app', 'api');
const apiRoutes = findApiRoutes(apiDir);

console.log(`📁 Found ${apiRoutes.length} API routes`);

let migrated = 0;
let disabled = 0;
let errors = 0;
let skipped = 0;

apiRoutes.forEach(route => {
  const relativePath = route.replace(path.join(__dirname, '..'), '');
  
  if (disableInProduction.includes(relativePath)) {
    const result = disableRoute(route);
    if (result.status === 'disabled') {
      console.log(`🚫 Disabled: ${relativePath}`);
      disabled++;
    } else {
      console.log(`❌ Error disabling: ${relativePath}`);
      errors++;
    }
  } else if (specialRoutes.includes(relativePath)) {
    console.log(`⚠️  Skipped (special handling needed): ${relativePath}`);
    skipped++;
  } else {
    const result = migrateRoute(route);
    switch (result.status) {
      case 'migrated':
        console.log(`✅ Migrated: ${relativePath}`);
        migrated++;
        break;
      case 'already_migrated':
        console.log(`⏭️  Already migrated: ${relativePath}`);
        skipped++;
        break;
      case 'error':
        console.log(`❌ Error: ${relativePath} - ${result.error}`);
        errors++;
        break;
    }
  }
});

console.log('\n📊 Migration Summary:');
console.log('=====================');
console.log(`✅ Migrated: ${migrated}`);
console.log(`🚫 Disabled: ${disabled}`);
console.log(`⏭️  Skipped: ${skipped}`);
console.log(`❌ Errors: ${errors}`);

if (errors === 0) {
  console.log('\n🎉 Migration completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Review the migrated files');
  console.log('2. Test the API endpoints');
  console.log('3. Deploy to Vercel');
} else {
  console.log('\n⚠️  Migration completed with errors. Please review the failed files.');
}

console.log('\n📚 For detailed instructions, see VERCEL_DEPLOYMENT_CHECKLIST.md');
