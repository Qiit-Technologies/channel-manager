// Hotel entity will be loaded from Anli database
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum ChannelType {
  BOOKING_COM = "BOOKING_COM",
  EXPEDIA = "EXPEDIA",
  AIRBNB = "AIRBNB",
  HOTELS_COM = "HOTELS_COM",
  TRIPADVISOR = "TRIPADVISOR",
  AGODA = "AGODA",
  HOTELBEDS = "HOTELBEDS",
  CUSTOM = "CUSTOM",
  SEVEN = "SEVEN",
}

export enum IntegrationStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ERROR = "ERROR",
  PENDING = "PENDING",
  TESTING = "TESTING",
}

@Entity("channel_integration")
export class ChannelIntegration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: false })
  hotelId: number; // Simple integer reference to external hotel ID

  @Column({
    type: "enum",
    enum: ChannelType,
    nullable: false,
  })
  channelType: ChannelType;

  @Column()
  channelName: string;

  @Column({
    type: "enum",
    enum: IntegrationStatus,
    default: IntegrationStatus.PENDING,
  })
  status: IntegrationStatus;

  @Column({ nullable: true })
  apiKey: string;

  @Column({ nullable: true })
  apiSecret: string;

  @Column({ nullable: true })
  accessToken: string;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ nullable: true })
  channelPropertyId: string;

  @Column({ nullable: true })
  channelUsername: string;

  @Column({ nullable: true })
  channelPassword: string;

  @Column({ nullable: true })
  webhookUrl: string;

  @Column({ nullable: true })
  webhookSecret: string;

  @Column({ default: false })
  isWebhookEnabled: boolean;

  @Column({ default: 15 })
  syncIntervalMinutes: number;

  @Column({ default: false })
  isRealTimeSync: boolean;

  @Column({ nullable: true })
  lastSyncAt: Date;

  @Column({ nullable: true })
  lastSuccessfulSync: Date;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  testMode: boolean;

  @Column({ type: "json", nullable: true })
  channelSettings: Record<string, any>;

  @Column({ type: "json", nullable: true })
  supportedFeatures: string[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  updatedBy: number;
}
