/**
 * SnapBooth Database Setup Script
 * Run this script to create all tables in Supabase.
 * 
 * Usage: npx tsx packages/desktop/src/main/db/setup.ts
 */

import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: resolve(__dirname, '../../../../../.env') })

async function runMigration() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL and SUPABASE_SECRET_KEY required in .env')
    process.exit(1)
  }

  console.log('🚀 SnapBooth Database Setup')
  console.log(`   URL: ${supabaseUrl}`)
  console.log('')

  // Read SQL migration file
  const sqlPath = resolve(__dirname, '../../../../../supabase/migrations/001_initial_schema.sql')
  const sql = readFileSync(sqlPath, 'utf-8')

  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`📋 Found ${statements.length} SQL statements to execute`)
  console.log('')

  // Execute via Supabase SQL endpoint
  // Supabase exposes a /rest/v1/rpc endpoint, but for DDL we need the /pg endpoint
  // or we can use the postgrest-compatible approach

  // Try using the Supabase RPC endpoint to create a function that runs SQL
  const rpcUrl = `${supabaseUrl}/rest/v1/rpc/`

  // First, try creating a helper function
  const createFnSql = `
    CREATE OR REPLACE FUNCTION exec_sql(query text) RETURNS void AS $$
    BEGIN
      EXECUTE query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  // Try direct SQL execution via the query endpoint
  try {
    // Method: Use Supabase's internal SQL execution endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    })

    if (response.ok) {
      console.log('✅ Migration executed successfully via RPC!')
    } else {
      const text = await response.text()
      console.log(`⚠️  RPC method not available (${response.status}). ${text}`)
      console.log('')
      console.log('📋 Please run the SQL migration manually:')
      console.log('   1. Go to https://supabase.com/dashboard')
      console.log('   2. Open your project → SQL Editor')
      console.log('   3. Paste the contents of: supabase/migrations/001_initial_schema.sql')
      console.log('   4. Click "Run"')
      console.log('')
      console.log('   Or copy this file path:')
      console.log(`   ${sqlPath}`)
    }
  } catch (err: any) {
    console.error('❌ Connection failed:', err.message)
    console.log('')
    console.log('📋 Please run the SQL migration manually:')
    console.log('   1. Go to https://supabase.com/dashboard')
    console.log('   2. Open your project → SQL Editor')
    console.log('   3. Paste the contents of: supabase/migrations/001_initial_schema.sql')
    console.log('   4. Click "Run"')
  }
}

runMigration().catch(console.error)
