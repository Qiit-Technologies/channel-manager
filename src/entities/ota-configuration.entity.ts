import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ChannelType } from "./channel-integration.entity";

@Entity()
export class OtaConfiguration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "enum",
    enum: ChannelType,
    nullable: false,
    unique: true,
  })
  channelType: ChannelType;

  @Column({ nullable: true })
  apiKey: string;

  @Column({ nullable: true })
  apiSecret: string;

  @Column({ nullable: true })
  accessToken: string;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ nullable: true })
  baseUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "json", nullable: true })
  additionalConfig: Record<string, any>;

  @Column({ nullable: true })
  lastTested: Date;

  @Column({ nullable: true })
  testStatus: "SUCCESS" | "FAILED" | "PENDING";

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
