import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class IcalSync1792400000000 implements MigrationInterface {
  name = "IcalSync1792400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasFeed = await queryRunner.hasTable("ical_feed");
    if (!hasFeed) {
      await queryRunner.createTable(
        new Table({
          name: "ical_feed",
          columns: [
            {
              name: "id",
              type: "int",
              isPrimary: true,
              isGenerated: true,
              generationStrategy: "increment",
            },
            { name: "hotelId", type: "int", isNullable: false },
            { name: "roomId", type: "int", isNullable: false },
            { name: "roomNumber", type: "varchar", isNullable: true },
            { name: "token", type: "varchar", isNullable: false },
            { name: "label", type: "varchar", isNullable: true },
            {
              name: "isActive",
              type: "boolean",
              isNullable: false,
              default: true,
            },
            { name: "createdAt", type: "timestamp", default: "now()" },
            { name: "updatedAt", type: "timestamp", default: "now()" },
          ],
          indices: [
            {
              name: "IDX_ical_feed_token",
              columnNames: ["token"],
              isUnique: true,
            },
            {
              name: "IDX_ical_feed_hotel_room",
              columnNames: ["hotelId", "roomId"],
            },
          ],
        }),
        true,
      );
    }

    const hasSource = await queryRunner.hasTable("ical_import_source");
    if (!hasSource) {
      await queryRunner.createTable(
        new Table({
          name: "ical_import_source",
          columns: [
            {
              name: "id",
              type: "int",
              isPrimary: true,
              isGenerated: true,
              generationStrategy: "increment",
            },
            { name: "hotelId", type: "int", isNullable: false },
            { name: "roomId", type: "int", isNullable: false },
            { name: "roomNumber", type: "varchar", isNullable: true },
            { name: "sourceName", type: "varchar", isNullable: false },
            { name: "sourceUrl", type: "text", isNullable: false },
            { name: "lastFetchedAt", type: "timestamp", isNullable: true },
            { name: "lastEtag", type: "varchar", isNullable: true },
            { name: "lastModified", type: "varchar", isNullable: true },
            {
              name: "isActive",
              type: "boolean",
              isNullable: false,
              default: true,
            },
            { name: "lastError", type: "text", isNullable: true },
            { name: "createdAt", type: "timestamp", default: "now()" },
            { name: "updatedAt", type: "timestamp", default: "now()" },
          ],
          indices: [
            {
              name: "IDX_ical_import_source_hotel_room",
              columnNames: ["hotelId", "roomId"],
            },
          ],
        }),
        true,
      );
    }

    const hasBlock = await queryRunner.hasTable("ical_external_block");
    if (!hasBlock) {
      await queryRunner.createTable(
        new Table({
          name: "ical_external_block",
          columns: [
            {
              name: "id",
              type: "int",
              isPrimary: true,
              isGenerated: true,
              generationStrategy: "increment",
            },
            { name: "hotelId", type: "int", isNullable: false },
            { name: "roomId", type: "int", isNullable: false },
            { name: "importSourceId", type: "int", isNullable: true },
            { name: "startDate", type: "date", isNullable: false },
            { name: "endDate", type: "date", isNullable: false },
            { name: "sourceName", type: "varchar", isNullable: false },
            { name: "externalUid", type: "varchar", isNullable: false },
            { name: "createdAt", type: "timestamp", default: "now()" },
          ],
          indices: [
            {
              name: "IDX_ical_external_block_hotel_room_start",
              columnNames: ["hotelId", "roomId", "startDate"],
            },
            {
              name: "IDX_ical_external_block_source",
              columnNames: ["importSourceId"],
            },
          ],
        }),
        true,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ical_external_block"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ical_import_source"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ical_feed"`);
  }
}
