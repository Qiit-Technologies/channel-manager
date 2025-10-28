import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateChannelIntegration1730051400000
  implements MigrationInterface
{
  name = "CreateChannelIntegration1730051400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Skip if table already exists (idempotent in dev environments)
    const hasTable = await queryRunner.hasTable("channel_integration");
    if (hasTable) {
      return;
    }

    // Create enums for Postgres
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_type_enum') THEN CREATE TYPE channel_type_enum AS ENUM ('BOOKING_COM','EXPEDIA','AIRBNB','HOTELS_COM','TRIPADVISOR','AGODA','HOTELBEDS','CUSTOM','SEVEN'); END IF; END $$;`
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_status_enum') THEN CREATE TYPE integration_status_enum AS ENUM ('ACTIVE','INACTIVE','ERROR','PENDING','TESTING'); END IF; END $$;`
    );

    await queryRunner.createTable(
      new Table({
        name: "channel_integration",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          { name: "hotelId", type: "int", isNullable: false },
          {
            name: "channelType",
            type: "channel_type_enum",
            isNullable: false,
          },
          { name: "channelName", type: "varchar", isNullable: false },
          {
            name: "status",
            type: "integration_status_enum",
            isNullable: false,
            default: `'PENDING'`,
          },
          { name: "apiKey", type: "varchar", isNullable: true },
          { name: "apiSecret", type: "varchar", isNullable: true },
          { name: "accessToken", type: "varchar", isNullable: true },
          { name: "refreshToken", type: "varchar", isNullable: true },
          { name: "channelPropertyId", type: "varchar", isNullable: true },
          { name: "channelUsername", type: "varchar", isNullable: true },
          { name: "channelPassword", type: "varchar", isNullable: true },
          { name: "webhookUrl", type: "varchar", isNullable: true },
          { name: "webhookSecret", type: "varchar", isNullable: true },
          {
            name: "isWebhookEnabled",
            type: "boolean",
            isNullable: false,
            default: false,
          },
          {
            name: "syncIntervalMinutes",
            type: "int",
            isNullable: false,
            default: 15,
          },
          {
            name: "isRealTimeSync",
            type: "boolean",
            isNullable: false,
            default: false,
          },
          { name: "lastSyncAt", type: "timestamp", isNullable: true },
          { name: "lastSuccessfulSync", type: "timestamp", isNullable: true },
          { name: "errorMessage", type: "varchar", isNullable: true },
          { name: "testMode", type: "boolean", isNullable: true },
          { name: "channelSettings", type: "jsonb", isNullable: true },
          { name: "supportedFeatures", type: "jsonb", isNullable: true },
          { name: "createdAt", type: "timestamp", default: "now()" },
          { name: "updatedAt", type: "timestamp", default: "now()" },
          { name: "createdBy", type: "int", isNullable: true },
          { name: "updatedBy", type: "int", isNullable: true },
        ],
        indices: [
          {
            name: "IDX_channel_integration_hotel_channel",
            columnNames: ["hotelId", "channelType"],
            isUnique: true,
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "channel_integration"`);
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_type_enum') THEN DROP TYPE channel_type_enum; END IF; END $$;`
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_status_enum') THEN DROP TYPE integration_status_enum; END IF; END $$;`
    );
  }
}