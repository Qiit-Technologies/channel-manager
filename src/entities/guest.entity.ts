import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  CHECKEDIN = "CHECKEDIN",
  CHECKED_OUT = "CHECKED_OUT",
  NO_SHOW = "NO_SHOW",
  MODIFIED = "MODIFIED",
}

@Entity()
@Index(["bookingCode"], { unique: true })
@Index(["hotelId", "createdAt"])
@Index(["bookingSource", "createdAt"])
export class Guest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ nullable: true, unique: true })
  bookingCode: string;

  @Column({ nullable: true, unique: true })
  otaBookingCode: string;

  @Column({
    type: "enum",
    enum: BookingStatus,
    nullable: true,
  })
  bookingStatus: BookingStatus;

  @Column({ nullable: true })
  bookingSource: string;

  @Column({ nullable: true })
  property: string;

  @Column({ nullable: true })
  propertyReference: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  bookingAmount: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
    default: 0,
  })
  amountPaid: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
    default: 0,
  })
  outstanding: number;

  @Column({ name: "hotelId", type: "int", nullable: false })
  @Index()
  hotelId: number;

  @Column({ name: "roomtypeId", type: "int", nullable: false })
  @Index()
  roomtypeId: number;

  @Column({ nullable: true })
  roomNumber: string;

  @Column({ default: 1 })
  numberOfGuests: number;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;
}
