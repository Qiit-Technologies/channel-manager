import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

export enum SyncOperationType {
  INVENTORY_UPDATE = "INVENTORY_UPDATE",
  RATE_UPDATE = "RATE_UPDATE",
  AVAILABILITY_UPDATE = "AVAILABILITY_UPDATE",
  BOOKING_CREATE = "BOOKING_CREATE",
  BOOKING_UPDATE = "BOOKING_UPDATE",
  BOOKING_CANCEL = "BOOKING_CANCEL",
  MAPPING_UPDATE = "MAPPING_UPDATE",
  FULL_SYNC = "FULL_SYNC",
}

export enum SyncStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  PARTIAL_SUCCESS = "PARTIAL_SUCCESS",
}

export enum SyncDirection {
  OUTBOUND = "OUTBOUND",
  INBOUND = "INBOUND",
  BIDIRECTIONAL = "BIDIRECTIONAL",
}

@Entity()
export class ChannelSyncLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: false })
  integrationId: number;

  @Column({
    type: "enum",
    enum: SyncOperationType,
    nullable: false,
  })
  operationType: SyncOperationType;

  @Column({
    type: "enum",
    enum: SyncStatus,
    default: SyncStatus.PENDING,
  })
  status: SyncStatus;

  @Column({
    type: "enum",
    enum: SyncDirection,
    default: SyncDirection.OUTBOUND,
  })
  direction: SyncDirection;

  @Column({ nullable: true })
  requestData: string;

  @Column({ nullable: true })
  responseData: string;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  errorCode: string;

  @Column({ nullable: true })
  retryCount: number;

  @Column({ nullable: true })
  maxRetries: number;

  @Column({ nullable: true })
  processingTimeMs: number;

  @Column({ nullable: true })
  recordsProcessed: number;

  @Column({ nullable: true })
  recordsSuccess: number;

  @Column({ nullable: true })
  recordsFailed: number;

  @Column({ type: "json", nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  nextRetryAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Column({ nullable: true })
  createdBy: number;
}
