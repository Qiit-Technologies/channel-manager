import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class ChannelMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: false })
  integrationId: number;

  @Column({ type: "int", nullable: false })
  roomtypeId: number;

  @Column()
  channelRoomTypeId: string;

  @Column()
  channelRoomTypeName: string;

  @Column({ nullable: true })
  channelRatePlanId: string;

  @Column({ nullable: true })
  channelRatePlanName: string;

  @Column({ type: "text", array: true, nullable: true })
  channelAmenities: string[];

  @Column({ nullable: true })
  channelDescription: string;

  @Column({ type: "text", array: true, nullable: true })
  channelImages: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "json", nullable: true })
  mappingRules: Record<string, any>;

  @Column({ type: "json", nullable: true })
  customFields: Record<string, any>;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  updatedBy: number;
}
