import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface TossBillingResponse {
  mId: string;
  customerKey: string;
  authenticatedAt: string;
  method: string;
  billingKey: string;
  cardCompany: string;
  cardNumber: string;
}

interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  approvedAt: string;
}

@Injectable()
export class TossService {
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.tosspayments.com/v1';

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.getOrThrow<string>('toss.secretKey');
  }

  /**
   * 빌링키로 정기결제 실행
   */
  async requestBilling(
    billingKey: string,
    customerKey: string,
    amount: number,
    orderId: string,
    orderName: string,
  ): Promise<TossPaymentResponse> {
    const response = await fetch(`${this.baseUrl}/billing/${billingKey}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerKey,
        amount,
        orderId,
        orderName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `TossPayments billing failed: ${(error as { message?: string }).message ?? 'Unknown error'}`,
      );
    }

    return response.json() as Promise<TossPaymentResponse>;
  }

  /**
   * 빌링키 정보 조회
   */
  async getBillingInfo(billingKey: string): Promise<TossBillingResponse> {
    const response = await fetch(`${this.baseUrl}/billing/${billingKey}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `TossPayments billing info failed: ${(error as { message?: string }).message ?? 'Unknown error'}`,
      );
    }

    return response.json() as Promise<TossBillingResponse>;
  }

  /**
   * 결제 취소
   */
  async cancelPayment(paymentKey: string, cancelReason: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/payments/${paymentKey}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancelReason,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `TossPayments cancel failed: ${(error as { message?: string }).message ?? 'Unknown error'}`,
      );
    }
  }

  /**
   * 웹훅 시그니처 검증
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('base64');

    return signature === expectedSignature;
  }
}
