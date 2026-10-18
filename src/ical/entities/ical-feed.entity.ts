import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * An iCal export feed for one room. The hotel pastes the feed URL into an
 * OTA (Airbnb "Import calendar", Booking.com iCal sync) so Anli bookings
 * block those dates on the channel.
 *
 * The `token` is an unguessable 64-hex-char secret and acts as the only
 * credential for the public /ical/:token/calendar.ics endpoint.
 */
@Entity()
@Index(["token"], { unique: true })
@Index(["hotelId", "roomId"])
export class IcalFeed {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  hotelId: number;

  @Column({ type: "int" })
  roomId: number;

  @Column({ nullable: true })
  roomNumber: string;

  @Column()
  token: string;

  @Column({ nullable: true })
  label: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
