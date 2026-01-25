import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { Public } from '../common/decorators';
import { TossService } from '../subscription/toss.service';
import { SubscriptionService } from '../subscription/subscription.service';

interface TossWebhookPayload {
  eventType: string;
  createdAt: string;
  data: {
    paymentKey?: string;
    orderId?: string;
    status?: string;
    customerKey?: string;
    billingKey?: string;
  };
}

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly tossService: TossService,
    private readonly subscriptionService: SubscriptionService,
  ) {
    this.webhookSecret = this.configService.getOrThrow<string>('toss.webhookSecret');
  }

  @Post('toss')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '토스페이먼츠 웹훅' })
  @ApiResponse({ status: 200, description: '웹훅 처리 성공' })
  @ApiResponse({ status: 401, description: '시그니처 검증 실패' })
  async handleTossWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('toss-signature') signature: string,
    @Body() payload: TossWebhookPayload,
  ): Promise<{ success: boolean }> {
    // 시그니처 검증
    const rawBody = req.rawBody?.toString() ?? JSON.stringify(payload);

    if (!this.tossService.verifyWebhookSignature(rawBody, signature, this.webhookSecret)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // 이벤트 타입에 따른 처리
    switch (payload.eventType) {
      case 'BILLING_STATUS_CHANGED':
        // 빌링 상태 변경 (결제 성공/실패 등)
        await this.handleBillingStatusChanged(payload);
        break;

      case 'PAYMENT_DONE':
        // 결제 완료
        await this.handlePaymentDone(payload);
        break;

      case 'PAYMENT_CANCELED':
        // 결제 취소
        await this.handlePaymentCanceled(payload);
        break;

      default:
        // 알 수 없는 이벤트 타입은 무시
        break;
    }

    return { success: true };
  }

  private async handleBillingStatusChanged(payload: TossWebhookPayload): Promise<void> {
    const { customerKey, status } = payload.data;

    if (!customerKey) return;

    // 정기결제 갱신 처리
    if (status === 'READY') {
      await this.subscriptionService.renewSubscription(customerKey);
    }
  }

  private async handlePaymentDone(_payload: TossWebhookPayload): Promise<void> {
    // 결제 완료 처리 (필요시 로깅 등)
  }

  private async handlePaymentCanceled(_payload: TossWebhookPayload): Promise<void> {
    // 결제 취소 처리 (필요시 환불 로직 등)
  }
}
