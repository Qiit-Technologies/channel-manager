import { DataSource } from "typeorm";
import { OtaConfiguration } from "../entities/ota-configuration.entity";
import { ChannelType } from "../entities/channel-integration.entity";

export async function seedOtaConfigurations(dataSource: DataSource) {
  const otaConfigRepository = dataSource.getRepository(OtaConfiguration);

  const configurations = [
    {
      channelType: ChannelType.BOOKING_COM,
      apiKey: process.env.BOOKING_COM_API_KEY || "your-booking-com-api-key",
      apiSecret:
        process.env.BOOKING_COM_API_SECRET || "your-booking-com-api-secret",
      baseUrl: "https://api.booking.com",
      isActive: true,
      additionalConfig: {
        partnerId: process.env.BOOKING_COM_PARTNER_ID || "your-partner-id",
        testMode: process.env.NODE_ENV === "development",
      },
    },
    {
      channelType: ChannelType.EXPEDIA,
      apiKey: process.env.EXPEDIA_API_KEY || "your-expedia-api-key",
      apiSecret: process.env.EXPEDIA_API_SECRET || "your-expedia-api-secret",
      baseUrl: "https://services.ean.com/v3",
      isActive: true,
      additionalConfig: {
        customerId: process.env.EXPEDIA_CUSTOMER_ID || "your-customer-id",
        testMode: process.env.NODE_ENV === "development",
      },
    },
    {
      channelType: ChannelType.AIRBNB,
      apiKey: process.env.AIRBNB_API_KEY || "your-airbnb-api-key",
      accessToken:
        process.env.AIRBNB_ACCESS_TOKEN || "your-airbnb-access-token",
      baseUrl: "https://api.airbnb.com/v2",
      isActive: true,
      additionalConfig: {
        clientId: process.env.AIRBNB_CLIENT_ID || "your-client-id",
        testMode: process.env.NODE_ENV === "development",
      },
    },
    {
      channelType: ChannelType.HOTELS_COM,
      apiKey: process.env.HOTELS_COM_API_KEY || "your-hotels-com-api-key",
      baseUrl: "https://api.hotels.com/v1",
      isActive: true,
      additionalConfig: {
        partnerId: process.env.HOTELS_COM_PARTNER_ID || "your-partner-id",
        testMode: process.env.NODE_ENV === "development",
      },
    },
    {
      channelType: ChannelType.TRIPADVISOR,
      apiKey: process.env.TRIPADVISOR_API_KEY || "your-tripadvisor-api-key",
      baseUrl: "https://api.tripadvisor.com/v1",
      isActive: true,
      additionalConfig: {
        partnerId: process.env.TRIPADVISOR_PARTNER_ID || "your-partner-id",
        testMode: process.env.NODE_ENV === "development",
      },
    },
    {
      channelType: ChannelType.AGODA,
      apiKey: process.env.AGODA_API_KEY || "your-agoda-api-key",
      baseUrl: "https://api.agoda.com/v1",
      isActive: true,
      additionalConfig: {
        partnerId: process.env.AGODA_PARTNER_ID || "your-partner-id",
        testMode: process.env.NODE_ENV === "development",
      },
    },
    {
      channelType: ChannelType.HOTELBEDS,
      apiKey: process.env.HOTELBEDS_API_KEY || "your-hotelbeds-api-key",
      apiSecret:
        process.env.HOTELBEDS_API_SECRET || "your-hotelbeds-api-secret",
      baseUrl: "https://api.hotelbeds.com",
      isActive: true,
      additionalConfig: {
        partnerId: process.env.HOTELBEDS_PARTNER_ID || "your-partner-id",
        testMode: process.env.NODE_ENV === "development",
      },
    },
  ];

  for (const config of configurations) {
    const existingConfig = await otaConfigRepository.findOne({
      where: { channelType: config.channelType },
    });

    if (!existingConfig) {
      const newConfig = otaConfigRepository.create(config);
      await otaConfigRepository.save(newConfig);
      console.log(`✅ Created OTA configuration for ${config.channelType}`);
    } else {
      console.log(
        `⏭️  OTA configuration for ${config.channelType} already exists`
      );
    }
  }

  console.log("🎉 OTA configurations seeding completed!");
}
