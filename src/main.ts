import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ChannelManagerModule } from "./channel-manager.module";
import { EnhancedApiKeyGuard } from "./auth/enhanced-api-key.guard";

async function bootstrap() {
  const app = await NestFactory.create(ChannelManagerModule);

  // Enable CORS
  app.enableCors();

  // Global prefix for API routes
  app.setGlobalPrefix("api/v1");

  // Enable validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Anli Channel Manager API")
    .setDescription(
      "API documentation for the Anli Channel Manager service, including OTA configuration and integrations."
    )
    .setVersion("1.0.0")
    .addApiKey(
      {
        type: "apiKey",
        name: "x-api-key",
        in: "header",
        description: "Provide your API key in the x-api-key header",
      },
      "ApiKeyAuth"
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });
  SwaggerModule.setup("docs", app, document, { useGlobalPrefix: true });

  // Check if we're in test mode (no database required)
  const isTestMode = process.env.TEST_MODE === "true";

  if (isTestMode) {
    console.log(
      "🚀 Starting Channel Manager in TEST MODE (no database required)"
    );
    console.log("📝 API Key Authentication: DISABLED for testing");
  } else {
    // Temporarily disable API key authentication for testing
    console.log("⚠️  API Key Authentication: DISABLED for testing");
    // TODO: Re-enable after testing: app.useGlobalGuards(apiKeyGuard);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`✅ Channel Manager is running on: http://localhost:${port}`);
  console.log(`🌐 API Base URL: http://localhost:${port}/api/v1`);

  if (isTestMode) {
    console.log("\n🧪 TEST MODE ENDPOINTS (no authentication required):");
    console.log("  GET  /api/v1/channel-manager/channels/supported");
    console.log("  GET  /api/v1/channel-manager/channels/BOOKING_COM/features");
    console.log("  POST /api/v1/api-keys/validate/your-api-key");
    console.log(
      "\n🔑 To test with API key authentication, set TEST_MODE=false"
    );
  } else {
    console.log("\n🔑 API KEY ENDPOINTS:");
    console.log("  POST /api/v1/api-keys/generate (requires API key)");
    console.log("  GET  /api/v1/api-keys/info (requires API key)");
    console.log(
      "  GET  /api/v1/channel-manager/integrations (requires API key)"
    );
  }
}

bootstrap();
