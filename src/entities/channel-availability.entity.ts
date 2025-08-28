import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum AvailabilityStatus {
  AVAILABLE = "AVAILABLE",
  UNAVAILABLE = "UNAVAILABLE",
  OCCUPIED = "OCCUPIED",
  MAINTENANCE = "MAINTENANCE",
  BLOCKED = "BLOCKED",
}

@Entity()
@Index(["integrationId", "roomtypeId", "date"], { unique: true })
export class ChannelAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: false })
  integrationId: number;

  @Column({ type: "int", nullable: false })
  roomtypeId: number;

  @Column({ type: "date" })
  date: Date;

  @Column({
    type: "enum",
    enum: AvailabilityStatus,
    default: AvailabilityStatus.AVAILABLE,
  })
  status: AvailabilityStatus;

  @Column({ default: 0 })
  availableRooms: number;

  @Column({ default: 0 })
  totalRooms: number;

  @Column({ default: 0 })
  occupiedRooms: number;

  @Column({ default: 0 })
  blockedRooms: number;

  @Column({ default: 0 })
  maintenanceRooms: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  rate: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ default: false })
  isClosed: boolean;

  @Column({ nullable: true })
  closeReason: string;

  @Column({ type: "json", nullable: true })
  restrictions: Record<string, any>;

  @Column({ type: "json", nullable: true })
  channelData: Record<string, any>;

  @Column({ default: false })
  isSynced: boolean;

  @Column({ nullable: true })
  lastSyncedAt: Date;

  @Column({ nullable: true })
  syncStatus: string;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  updatedBy: number;
}
