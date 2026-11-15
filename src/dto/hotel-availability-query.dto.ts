import { Type } from "class-transformer";
import { IsDateString, IsInt, Matches, Min } from "class-validator";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class HotelAvailabilityQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hotelId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomtypeId: number;

  @Matches(DATE_RE, { message: "checkInDate must be YYYY-MM-DD" })
  @IsDateString({ strict: true })
  checkInDate: string;

  @Matches(DATE_RE, { message: "checkOutDate must be YYYY-MM-DD" })
  @IsDateString({ strict: true })
  checkOutDate: string;
}
