/**
 * Quick test script to diagnose email sending issues
 * Usage: npx tsx packages/desktop/src/main/email/test-email.ts
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: resolve(__dirname, '../../../../../.env') })

import { Resend } from 'resend'

async function testEmail() {
  console.log('=== SnapBooth Email Test ===')
  console.log('API Key:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'MISSING!')

  const resend = new Resend(process.env.RESEND_API_KEY)

  // Test 1: Send a simple test email
  const testTo = 'delivered@resend.dev' // Resend's test inbox - always works
  console.log(`\nTest 1: Sending to ${testTo}...`)

  try {
    const { data, error } = await resend.emails.send({
      from: 'SnapBooth <onboarding@resend.dev>',
      to: [testTo],
      subject: 'Test email from SnapBooth',
      html: '<h1>Test email berhasil!</h1><p>Jika Anda melihat ini, pengiriman email berfungsi.</p>'
    })

    if (error) {
      console.error('❌ ERROR:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ SUCCESS! Email ID:', data?.id)
    }
  } catch (err: any) {
    console.error('❌ EXCEPTION:', err.message)
    console.error('Full error:', JSON.stringify(err, null, 2))
  }

  // Test 2: Check domain/sender status
  console.log('\nTest 2: Checking API key validity...')
  try {
    const { data: domains } = await resend.domains.list()
    console.log('Domains:', JSON.stringify(domains, null, 2))
  } catch (err: any) {
    console.log('Domain check error (normal for free plan):', err.message)
  }

  console.log('\n=== PENTING ===')
  console.log('Dengan sender "onboarding@resend.dev" (free tier):')
  console.log('- Email HANYA bisa dikirim ke email yang terdaftar di akun Resend Anda.')
  console.log('- Untuk kirim ke email siapapun, Anda perlu menambahkan & verifikasi domain sendiri di Resend Dashboard.')
  console.log('- Alternatif: gunakan "delivered@resend.dev" sebagai tujuan untuk testing.')
}

testEmail()
