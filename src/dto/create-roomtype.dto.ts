import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateRoomTypeDto {
  @ApiProperty({
    description: "Hotel ID",
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  hotelId: number;

  @ApiProperty({
    description: "Room type name",
    example: "Standard Room",
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: "Room type description",
    example: "Comfortable standard room with basic amenities",
  })
  @IsNotEmpty()
  @IsString()
  description: string;
}

