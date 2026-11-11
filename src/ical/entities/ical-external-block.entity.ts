import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

/**
 * Nights blocked by an EXTERNAL (OTA) booking discovered through iCal
 * import. These are holds, not guest stays: no guest PII, no charges.
 * `endDate` is exclusive (a Nov 5 -> Nov 6 block occupies the night of Nov 5).
 */
@Entity()
@Index(["hotelId", "roomId", "startDate"])
@Index(["importSourceId"])
export class IcalExternalBlock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  hotelId: number;

  @Column({ type: "int" })
  roomId: number;

  @Column({ type: "int", nullable: true })
  importSourceId: number;

  @Column({ type: "date" })
  startDate: Date;

  @Column({ type: "date" })
  endDate: Date;

  @Column()
  sourceName: string;

  @Column()
  externalUid: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;
}
