const { Client } = require('pg')
require('dotenv').config()

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function checkSchemas() {
  try {
    await client.connect()
    console.log('Connected to database')

    // Check crawler_visits table structure
    console.log('\n=== CRAWLER_VISITS TABLE ===')
    const crawlerVisitsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'crawler_visits' 
      ORDER BY ordinal_position;
    `)
    
    crawlerVisitsSchema.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`)
    })

    // Check user_visits table structure
    console.log('\n=== USER_VISITS TABLE ===')
    const userVisitsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_visits' 
      ORDER BY ordinal_position;
    `)
    
    userVisitsSchema.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`)
    })

    // Check leads table structure
    console.log('\n=== LEADS TABLE ===')
    const leadsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'leads' 
      ORDER BY ordinal_position;
    `)
    
    leadsSchema.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`)
    })

  } catch (error) {
    console.error('Error checking schemas:', error)
  } finally {
    await client.end()
  }
}

checkSchemas()