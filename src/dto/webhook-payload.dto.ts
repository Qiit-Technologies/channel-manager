import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class WebhookPayloadDto {
  @ApiProperty({ description: "Hotel ID for which the webhook applies", example: 1 })
  @IsNumber()
  hotelId: number;

  @ApiPropertyOptional({ description: "Webhook event type", example: "reservation" })
  @IsOptional()
  @IsString()
  event_type?: string;

  @ApiPropertyOptional({ description: "Channel-specific payload (reservation details, etc.)", type: Object })
  @IsOptional()
  data?: Record<string, any>;
}