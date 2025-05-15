#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Migration script for the site audit schema updates
async function main() {
  console.log('Starting Supabase migration...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  if (!supabaseServiceKey) {
    console.error('Error: SUPABASE_SERVICE_KEY environment variable is not set');
    process.exit(1);
  }
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Read the migration file
  const migrationPath = path.join(__dirname, '../migrations/supabase/site-audit-schema-update.sql');
  console.log(`Reading migration file from: ${migrationPath}`);
  
  try {
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Migration file read successfully');
    console.log('Applying migration...');
    
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      query: migrationSql
    });
    
    if (error) {
      console.error('Error executing migration:', error);
      process.exit(1);
    }
    
    console.log('Migration applied successfully');
    
  } catch (err) {
    console.error('Error reading or executing migration:', err);
    process.exit(1);
  }
}

// Run the migration
main()
  .then(() => {
    console.log('Migration process complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error during migration:', err);
    process.exit(1);
  }); 