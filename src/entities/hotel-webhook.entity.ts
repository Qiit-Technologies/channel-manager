import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { WebhookEventType } from "../services/webhook.service";

@Entity("hotel_webhook")
export class HotelWebhook {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", unique: true })
  hotelId: number;

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  secret: string;

  @Column({ default: "POST" })
  verb: string;

  @Column({ default: false })
  isEnabled: boolean;

  @Column({ type: "json", nullable: true })
  events: WebhookEventType[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
