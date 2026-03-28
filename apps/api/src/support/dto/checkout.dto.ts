import { IsOptional, IsString, MinLength } from 'class-validator';

export class CheckoutDto {
  @IsString()
  creatorId!: string;

  @IsString()
  campaignId!: string;

  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsString()
  @MinLength(8)
  idempotencyKey!: string;
}
