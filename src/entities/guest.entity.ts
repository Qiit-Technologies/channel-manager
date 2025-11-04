import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CHECKED_IN = "CHECKED_IN",
  CHECKED_OUT = "CHECKED_OUT",
  CANCELED = "CANCELED",
  NO_SHOW = "NO_SHOW",
  MODIFIED = "MODIFIED",
}

@Entity()
@Index(["bookingCode"], { unique: true })
@Index(["hotelId", "createdAt"])
@Index(["source", "createdAt"])
export class Guest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  bookingCode: string;

  @Column({ nullable: true })
  otaBookingCode: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: "date" })
  startDate: Date;

  @Column({ type: "date" })
  endDate: Date;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  source: string; // Booking source (OTA name)

  @Column({
    type: "enum",
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: "int", nullable: false })
  hotelId: number;

  @Column({ type: "int", nullable: false })
  roomTypeId: number;

  @Column({ type: "int", nullable: true })
  integrationId: number; // Reference to channel integration

  @Column({ type: "json", nullable: true })
  guestDetails: Record<string, any>; // Additional guest info

  @Column({ type: "json", nullable: true })
  channelData: Record<string, any>; // Raw data from OTA

  @Column({ nullable: true })
  cancelReason: string;

  @Column({ nullable: true })
  canceledAt: Date;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
