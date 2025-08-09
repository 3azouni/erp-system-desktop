#!/usr/bin/env node

/**
 * Script to fix remaining API routes that still have SQLite references
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing remaining API routes...\n');

// Routes that need specific fixes
const routeFixes = {
  'app/api/auth/logout/route.ts': {
    find: /const db = getDatabase\(\)[\s\S]*?resolve\(\)[\s\S]*?}\)\)/g,
    replace: `// For Supabase, we don't need to manually delete sessions
    // Supabase handles session management automatically
    // Just return success - the client should clear the token`
  },
  'app/api/components/[id]/route.ts': {
    find: /const database = getDatabase\(\)[\s\S]*?database\.prepare\([\s\S]*?\)\.get\(id\)/g,
    replace: `const { data: component, error } = await supabaseAdmin
      .from('components')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }`
  },
  'app/api/expenses/[id]/route.ts': {
    find: /const database = getDatabase\(\)[\s\S]*?database\.prepare\([\s\S]*?\)\.get\(id\)/g,
    replace: `const { data: expense, error } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }`
  },
  'app/api/inventory/[id]/route.ts': {
    find: /const database = getDatabase\(\)[\s\S]*?database\.prepare\([\s\S]*?\)\.get\(id\)/g,
    replace: `const { data: inventory, error } = await supabaseAdmin
      .from('inventory')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }`
  },
  'app/api/orders/[id]/route.ts': {
    find: /const database = getDatabase\(\)[\s\S]*?database\.prepare\([\s\S]*?\)\.get\(id\)/g,
    replace: `const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }`
  },
  'app/api/printers/[id]/route.ts': {
    find: /const database = getDatabase\(\)[\s\S]*?database\.prepare\([\s\S]*?\)\.get\(id\)/g,
    replace: `const { data: printer, error } = await supabaseAdmin
      .from('printers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }`
  }
};

function fixRoute(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = filePath.replace(path.join(__dirname, '..'), '');
    
    if (!routeFixes[relativePath]) {
      return { status: 'no_fix_needed', file: relativePath };
    }

    const fix = routeFixes[relativePath];
    let newContent = content;

    // Apply the fix
    if (fix.find && fix.replace) {
      newContent = newContent.replace(fix.find, fix.replace);
    }

    // Also remove any remaining getDatabase imports
    newContent = newContent.replace(/import.*getDatabase.*from.*local-db.*\n/g, '');
    newContent = newContent.replace(/import.*initializeDatabase.*from.*local-db.*\n/g, '');

    // Add supabaseAdmin import if not present
    if (!newContent.includes('supabaseAdmin')) {
      newContent = newContent.replace(
        /import.*NextRequest.*NextResponse.*from.*next/server.*\n/,
        `import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
`
      );
    }

    // Write the fixed content
    fs.writeFileSync(filePath, newContent);
    return { status: 'fixed', file: relativePath };
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return { status: 'error', file: filePath, error: error.message };
  }
}

// Fix specific routes
const apiDir = path.join(__dirname, '..', 'app', 'api');
let fixed = 0;
let errors = 0;

Object.keys(routeFixes).forEach(relativePath => {
  const fullPath = path.join(apiDir, relativePath.replace('app/api/', ''));
  const result = fixRoute(fullPath);
  
  switch (result.status) {
    case 'fixed':
      console.log(`✅ Fixed: ${relativePath}`);
      fixed++;
      break;
    case 'no_fix_needed':
      console.log(`⏭️  No fix needed: ${relativePath}`);
      break;
    case 'error':
      console.log(`❌ Error: ${relativePath} - ${result.error}`);
      errors++;
      break;
  }
});

console.log('\n📊 Fix Summary:');
console.log('=====================');
console.log(`✅ Fixed: ${fixed}`);
console.log(`❌ Errors: ${errors}`);

if (errors === 0) {
  console.log('\n🎉 All routes fixed successfully!');
} else {
  console.log('\n⚠️  Some routes had errors. Please review manually.');
}

console.log('\n📚 For detailed instructions, see VERCEL_DEPLOYMENT_CHECKLIST.md');
