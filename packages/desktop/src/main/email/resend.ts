import { Resend } from 'resend'
import { config } from 'dotenv'
import { resolve } from 'path'
import * as fs from 'fs'

// Load .env from project root
config({ path: resolve(__dirname, '../../../../.env') })

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendPhotoEmailOptions {
  to: string
  outletName: string
  photoUrl?: string          // Link to download the photo
  photoFilePath?: string     // Local file path to attach
  eventName?: string
}

/**
 * Send the photo softfile to the guest via email
 */
export async function sendPhotoEmail(options: SendPhotoEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const { to, outletName, photoUrl, photoFilePath, eventName } = options

  // Build attachments if local file exists
  const attachments: Array<{ filename: string; content: Buffer }> = []
  if (photoFilePath && fs.existsSync(photoFilePath)) {
    const fileBuffer = fs.readFileSync(photoFilePath)
    attachments.push({
      filename: `${outletName.replace(/\s/g, '_')}_photo.jpg`,
      content: fileBuffer
    })
  }

  const downloadSection = photoUrl
    ? `<tr><td style="padding: 24px 0;">
         <a href="${photoUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">📥 Download Foto HD</a>
       </td></tr>`
    : ''

  const eventSection = eventName
    ? `<tr><td style="color: #94a3b8; font-size: 14px; padding-bottom: 8px;">Event: <strong style="color: #e2e8f0;">${eventName}</strong></td></tr>`
    : ''

  try {
    const { data, error } = await resend.emails.send({
      from: `${outletName} <onboarding@resend.dev>`,
      to: [to],
      subject: `📸 Foto kamu dari ${outletName} sudah siap!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 0; background-color: #0a0a1a; font-family: 'Segoe UI', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a1a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1a1a2e 0%, #0f0f23 100%); border-radius: 20px; border: 1px solid rgba(99, 102, 241, 0.15); overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
                      <div style="font-size: 40px; margin-bottom: 8px;">📸</div>
                      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">${outletName}</h1>
                      <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">Self-Service Photo Experience</p>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px; text-align: center;">
                      <h2 style="color: #f1f5f9; margin: 0 0 12px; font-size: 22px;">Hai! Foto kamu sudah siap 🎉</h2>
                      <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                        Terima kasih sudah menggunakan ${outletName}! Berikut adalah foto yang kamu ambil.
                        ${photoFilePath ? 'Foto terlampir di email ini.' : ''}
                      </p>
                      ${eventSection}
                      ${downloadSection}
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 32px; border-top: 1px solid rgba(99, 102, 241, 0.15); text-align: center;">
                      <p style="color: #64748b; font-size: 12px; margin: 0;">
                        Powered by SnapBooth • ${new Date().getFullYear()}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      attachments: attachments.length > 0 ? attachments : undefined
    })

    if (error) {
      console.error('Resend email error:', error)
      return { success: false, error: error.message }
    }

    console.log('Email sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (err: any) {
    console.error('Email sending failed:', err?.message || err)
    return { success: false, error: err?.message || 'Unknown error' }
  }
}
