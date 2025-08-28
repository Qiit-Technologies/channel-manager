import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChannelManagerController } from "./channel-manager.controller";
import { ChannelManagerService } from "./channel-manager.service";
import { ApiKeyController } from "./auth/api-key.controller";
import { ChannelIntegration } from "./entities/channel-integration.entity";
import { ChannelMapping } from "./entities/channel-mapping.entity";
import { ChannelSyncLog } from "./entities/channel-sync-log.entity";
import { ChannelRatePlan } from "./entities/channel-rate-plan.entity";
import { ChannelAvailability } from "./entities/channel-availability.entity";
import { ApiKey } from "./entities/api-key.entity";
import { OtaConfiguration } from "./entities/ota-configuration.entity";
import { HttpModule } from "@nestjs/axios";
import { ScheduleModule } from "@nestjs/schedule";
import { ChannelManagerRepository } from "./channel-manager.repository";
import { ChannelSyncEngine } from "./sync/channel-sync-engine.service";
import { ChannelApiFactory } from "./api/channel-api-factory.service";
import { ApiKeyService } from "./auth/api-key.service";
import { OtaConfigurationService } from "./services/ota-configuration.service";
import { OtaConfigurationController } from "./controllers/ota-configuration.controller";
import { OreonSyncService } from "./services/oreon-sync.service";

@Module({
  imports: [
    // Only include database if not in test mode
    ...(process.env.TEST_MODE !== "true"
      ? [
          TypeOrmModule.forRoot({
            type: "postgres",
            host: process.env.DB_HOST || "localhost",
            port: parseInt(process.env.DB_PORT) || 5432,
            username: process.env.DB_USERNAME || "hellosauri",
            password: process.env.DB_PASSWORD || "password",
            database: process.env.DB_DATABASE || "anli",
            entities: [
              __dirname + "/**/*.entity{.ts,.js}",
              // Include Oreon entities from the same database
              "../../Oreon/dist/**/*.entity.js",
            ],
            synchronize: process.env.NODE_ENV === "development", // Match Oreon's setting
            logging: process.env.NODE_ENV === "development",
            retryAttempts: 3,
            retryDelay: 3000,
            keepConnectionAlive: false,
          }),
          TypeOrmModule.forFeature([
            ChannelIntegration,
            ChannelMapping,
            ChannelSyncLog,
            ChannelRatePlan,
            ChannelAvailability,
            ApiKey,
            OtaConfiguration,
          ]),
        ]
      : []),
    HttpModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    ChannelManagerController,
    // Temporarily disable API key controller for testing
    // ...(process.env.TEST_MODE !== "true" ? [ApiKeyController] : []),
    ...(process.env.TEST_MODE !== "true" ? [OtaConfigurationController] : []),
  ],
  providers: [
    ChannelManagerService,
    ...(process.env.TEST_MODE !== "true"
      ? [
          ChannelManagerRepository,
          ChannelManagerRepository,
          ChannelSyncEngine,
          ChannelApiFactory,
          ApiKeyService,
          OtaConfigurationService,
          OreonSyncService,
        ]
      : []),
  ],
  exports: [
    ChannelManagerService,
    ...(process.env.TEST_MODE !== "true" ? [ChannelManagerRepository] : []),
  ],
})
export class ChannelManagerModule {}
