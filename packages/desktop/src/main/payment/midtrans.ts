import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env from project root
config({ path: resolve(__dirname, '../../../../.env') })

// Midtrans
const midtransClient = require('midtrans-client')

export interface QrisChargeResult {
  orderId: string
  qrUrl: string
  transactionId: string
  expiresAt: string
}

export interface PaymentStatusResult {
  orderId: string
  transactionStatus: string
  paymentType: string
  grossAmount: string
  transactionTime: string
}

class MidtransService {
  private snap: any
  private coreApi: any

  constructor() {
    this.coreApi = new midtransClient.CoreApi({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    })

    this.snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    })
  }

  /**
   * Create a QRIS charge — generates a dynamic QR code for the guest to scan
   */
  async createQrisCharge(amount: number, orderId?: string): Promise<QrisChargeResult> {
    const oid = orderId || `SNAP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

    const parameter = {
      payment_type: 'qris',
      transaction_details: {
        order_id: oid,
        gross_amount: amount
      },
      qris: {
        acquirer: 'gopay' // QRIS via GoPay acquirer (standard for Midtrans QRIS)
      }
    }

    try {
      const response = await this.coreApi.charge(parameter)

      // Extract QR URL from response actions
      let qrUrl = ''
      if (response.actions && response.actions.length > 0) {
        const generateAction = response.actions.find(
          (a: any) => a.name === 'generate-qr-code'
        )
        if (generateAction) {
          qrUrl = generateAction.url
        }
      }

      return {
        orderId: response.order_id,
        qrUrl,
        transactionId: response.transaction_id,
        expiresAt: response.expiry_time || ''
      }
    } catch (error: any) {
      console.error('Midtrans QRIS charge failed:', error?.message || error)
      throw new Error(`Payment creation failed: ${error?.message || 'Unknown error'}`)
    }
  }

  /**
   * Check payment status for an order
   */
  async checkStatus(orderId: string): Promise<PaymentStatusResult> {
    try {
      const response = await this.coreApi.transaction.status(orderId)
      return {
        orderId: response.order_id,
        transactionStatus: response.transaction_status,
        paymentType: response.payment_type,
        grossAmount: response.gross_amount,
        transactionTime: response.transaction_time
      }
    } catch (error: any) {
      console.error('Midtrans status check failed:', error?.message || error)
      throw new Error(`Status check failed: ${error?.message || 'Unknown error'}`)
    }
  }

  /**
   * Cancel a pending transaction
   */
  async cancelTransaction(orderId: string): Promise<void> {
    try {
      await this.coreApi.transaction.cancel(orderId)
    } catch (error: any) {
      console.error('Midtrans cancel failed:', error?.message || error)
      // Don't throw — cancellation failure is non-critical
    }
  }
}

// Singleton instance
let instance: MidtransService | null = null

export function getMidtransService(): MidtransService {
  if (!instance) {
    instance = new MidtransService()
  }
  return instance
}
