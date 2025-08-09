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

async function updateAdminPassword() {
  try {
    console.log('🔍 Finding admin user...')
    
    // Find the admin user
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, password_hash')
      .eq('email', 'admin@3dpcommander.com')
      .single()

    if (checkError) {
      console.error('❌ Error finding admin user:', checkError)
      return false
    }

    if (!existingUser) {
      console.error('❌ Admin user not found!')
      return false
    }

    console.log('✅ Found admin user:', existingUser.email)
    console.log('🔄 Updating password...')
    
    // Hash the password
    const passwordHash = await bcrypt.hash('admin123', 12)
    
    // Update admin user password
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('email', 'admin@3dpcommander.com')
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating admin password:', updateError)
      return false
    }

    console.log('✅ Admin password updated successfully!')
    console.log('📧 Email:', updatedUser.email)
    console.log('🔑 New Password: admin123')
    console.log('👤 Role:', updatedUser.role)
    
    return true
  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

updateAdminPassword().then(success => {
  if (success) {
    console.log('\n🎉 Admin password update completed!')
    console.log('You can now login with:')
    console.log('- Email: admin@3dpcommander.com')
    console.log('- Password: admin123')
  } else {
    console.log('\n💥 Admin password update failed!')
    process.exit(1)
  }
})
