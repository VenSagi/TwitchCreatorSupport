import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { SupportService } from './support.service';
import { CheckoutDto } from './dto/checkout.dto';

@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post('checkout')
  checkout(@Body() body: CheckoutDto, @Req() req: Request) {
    return this.support.createCheckout(body, req.clerkUserId!);
  }
}
