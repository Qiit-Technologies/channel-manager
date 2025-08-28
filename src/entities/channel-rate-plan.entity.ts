import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum RatePlanType {
  STANDARD = "STANDARD",
  DISCOUNT = "DISCOUNT",
  PACKAGE = "PACKAGE",
  PROMOTIONAL = "PROMOTIONAL",
  CORPORATE = "CORPORATE",
  GROUP = "GROUP",
}

export enum RateModifierType {
  PERCENTAGE = "PERCENTAGE",
  FIXED_AMOUNT = "FIXED_AMOUNT",
  MULTIPLIER = "MULTIPLIER",
}

@Entity()
export class ChannelRatePlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: false })
  integrationId: number;

  @Column({ type: "int", nullable: false })
  roomtypeId: number;

  @Column()
  channelRatePlanId: string;

  @Column()
  channelRatePlanName: string;

  @Column({
    type: "enum",
    enum: RatePlanType,
    default: RatePlanType.STANDARD,
  })
  ratePlanType: RatePlanType;

  @Column("decimal", { precision: 10, scale: 2 })
  baseRate: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  minStay: number;

  @Column({ nullable: true })
  maxStay: number;

  @Column({ nullable: true })
  closedToArrival: boolean;

  @Column({ nullable: true })
  closedToDeparture: boolean;

  @Column({ nullable: true })
  advanceBookingDays: number;

  @Column({ nullable: true })
  cancellationPolicy: string;

  @Column({ type: "json", nullable: true })
  seasonalRates: Record<string, number>;

  @Column({ type: "json", nullable: true })
  dayOfWeekRates: Record<string, number>;

  @Column({ type: "json", nullable: true })
  specialDates: Record<string, number>;

  @Column({ nullable: true })
  rateModifier: number;

  @Column({
    type: "enum",
    enum: RateModifierType,
    default: RateModifierType.PERCENTAGE,
  })
  rateModifierType: RateModifierType;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "json", nullable: true })
  restrictions: Record<string, any>;

  @Column({ type: "json", nullable: true })
  inclusions: string[];

  @Column({ type: "json", nullable: true })
  exclusions: string[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  updatedBy: number;
}
