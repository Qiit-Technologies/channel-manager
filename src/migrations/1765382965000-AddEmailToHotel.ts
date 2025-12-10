import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddEmailToHotel1765382965000 implements MigrationInterface {
  name = "AddEmailToHotel1765382965000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if hotel table exists
    const hasTable = await queryRunner.hasTable("hotel");
    if (!hasTable) {
      // Create hotel table if it doesn't exist
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "hotel" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR NOT NULL,
          "email" VARCHAR,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "address" VARCHAR NOT NULL,
          "country" VARCHAR NOT NULL,
          "state" VARCHAR NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        )
      `);
    } else {
      // Check if email column already exists
      const table = await queryRunner.getTable("hotel");
      const hasEmailColumn = table?.findColumnByName("email");
      
      if (!hasEmailColumn) {
        await queryRunner.addColumn(
          "hotel",
          new TableColumn({
            name: "email",
            type: "varchar",
            isNullable: true,
          })
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable("hotel");
    if (hasTable) {
      const table = await queryRunner.getTable("hotel");
      const hasEmailColumn = table?.findColumnByName("email");
      
      if (hasEmailColumn) {
        await queryRunner.dropColumn("hotel", "email");
      }
    }
  }
}

