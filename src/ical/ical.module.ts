import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { Guest } from "../entities/guest.entity";
import { IcalFeed } from "./entities/ical-feed.entity";
import { IcalImportSource } from "./entities/ical-import-source.entity";
import { IcalExternalBlock } from "./entities/ical-external-block.entity";
import { IcalController } from "./ical.controller";
import { IcalService } from "./ical.service";
import { IcalPollService } from "./ical-poll.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IcalFeed,
      IcalImportSource,
      IcalExternalBlock,
      Guest,
    ]),
    HttpModule,
  ],
  controllers: [IcalController],
  providers: [IcalService, IcalPollService],
  exports: [IcalService],
})
export class IcalModule {}
