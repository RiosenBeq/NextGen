const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_HESAPSUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createAdminUser() {
  console.log('Creating admin user...');
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'admin@nextgenbox.com',
    password: 'NextGenAdmin2026!',
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes('already exists') || error.status === 422) {
      console.log('Admin user already exists. Updating password just in case...');
      
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;
      
      const existingUser = usersData.users.find(u => u.email === 'admin@nextgenbox.com');
      
      if (existingUser) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { password: 'NextGenAdmin2026!' }
        );
        if (updateError) throw updateError;
        console.log('Password updated successfully.');
      }
    } else {
      console.error('Error creating user:', error);
    }
  } else {
    console.log('User created successfully:', data.user.id);
  }
}

createAdminUser().catch(console.error);
