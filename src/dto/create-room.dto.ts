import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum RoomStatus {
  BOOKED = "BOOKED",
  AVAIL = "AVAIL",
  DIRTY = "DIRTY",
  MAINTENANCE = "MAINTENANCE",
  IN_REVIEW = "IN_REVIEW",
}

export class CreateRoomDto {
  @ApiProperty({
    description: "Hotel ID",
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  hotelId: number;

  @ApiProperty({
    description: "Room type ID",
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  roomtype: number;

  @ApiProperty({
    description: "Room status",
    enum: RoomStatus,
    example: RoomStatus.AVAIL,
  })
  @IsEnum(RoomStatus)
  status: RoomStatus;

  @ApiProperty({
    description: "Room price per night",
    example: 100.0,
  })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiPropertyOptional({
    description: "Floor number",
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  floor?: number;

  @ApiProperty({
    description: "Room number",
    example: "101",
  })
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @ApiProperty({
    description: "Room capacity (number of guests)",
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  roomCapacity: number;
}

