import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * A registered external iCal URL (e.g. an Airbnb listing's export URL) that
 * Anli polls to learn about bookings made on the channel, so the front desk
 * cannot double-book those nights. One source maps to one Anli room.
 */
@Entity()
@Index(["hotelId", "roomId"])
export class IcalImportSource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  hotelId: number;

  @Column({ type: "int" })
  roomId: number;

  @Column({ nullable: true })
  roomNumber: string;

  @Column()
  sourceName: string;

  @Column({ type: "text" })
  sourceUrl: string;

  @Column({ type: "timestamp", nullable: true })
  lastFetchedAt: Date;

  @Column({ nullable: true })
  lastEtag: string;

  @Column({ nullable: true })
  lastModified: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "text", nullable: true })
  lastError: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
