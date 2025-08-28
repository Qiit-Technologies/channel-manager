import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class Roomtype {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ type: "int", nullable: false })
  hotelId: number;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;
}
