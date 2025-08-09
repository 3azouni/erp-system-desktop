const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.log('Make sure .env.local exists with:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdminUser() {
  try {
    console.log('🔍 Checking if admin user exists...')
    
    // Check if admin user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'admin@3dpcommander.com')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking for existing user:', checkError)
      return false
    }

    if (existingUser) {
      console.log('✅ Admin user already exists:', existingUser.email)
      return true
    }

    console.log('🔄 Creating admin user...')
    
    // Hash the password
    const passwordHash = await bcrypt.hash('admin123', 12)
    
    // Create admin user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: 'admin@3dpcommander.com',
        password_hash: passwordHash,
        full_name: 'System Administrator',
        role: 'admin',
        department: 'Management',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating admin user:', createError)
      return false
    }

    console.log('✅ Admin user created successfully!')
    console.log('📧 Email:', newUser.email)
    console.log('🔑 Password: admin123')
    console.log('👤 Role:', newUser.role)
    
    return true
  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

createAdminUser().then(success => {
  if (success) {
    console.log('\n🎉 Admin user setup completed!')
    console.log('You can now login with:')
    console.log('- Email: admin@3dpcommander.com')
    console.log('- Password: admin123')
  } else {
    console.log('\n💥 Admin user setup failed!')
    process.exit(1)
  }
})
