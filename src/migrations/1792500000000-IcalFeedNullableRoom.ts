import { MigrationInterface, QueryRunner } from "typeorm";

export class IcalFeedNullableRoom1792500000000 implements MigrationInterface {
  name = "IcalFeedNullableRoom1792500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasFeed = await queryRunner.hasTable("ical_feed");
    if (!hasFeed) return;
    const table = await queryRunner.getTable("ical_feed");
    const roomIdCol = table?.findColumnByName("roomId");
    if (roomIdCol && !roomIdCol.isNullable) {
      await queryRunner.query(
        `ALTER TABLE "ical_feed" ALTER COLUMN "roomId" DROP NOT NULL`,
      );
    }
    // roomNumber was already nullable since the table was created.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasFeed = await queryRunner.hasTable("ical_feed");
    if (!hasFeed) return;
    const nulls = await queryRunner.query(
      `SELECT COUNT(*)::int AS c FROM "ical_feed" WHERE "roomId" IS NULL`,
    );
    if (Number(nulls?.[0]?.c || 0) === 0) {
      await queryRunner.query(
        `ALTER TABLE "ical_feed" ALTER COLUMN "roomId" SET NOT NULL`,
      );
    }
  }
}
