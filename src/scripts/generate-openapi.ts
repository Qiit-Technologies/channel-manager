import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { ChannelManagerModule } from "../channel-manager.module";

async function generate() {
  const app = await NestFactory.create(ChannelManagerModule);
  app.setGlobalPrefix("api/v1");

  const config = new DocumentBuilder()
    .setTitle("Channel Manager API")
    .setDescription(
      "API documentation for the Channel Manager service, including OTA configuration and integrations."
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

  const outputPath = join(
    process.cwd(),
    "openapi",
    "channel-manager.openapi.json"
  );
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(document, null, 2));
  await app.close();
  // eslint-disable-next-line no-console
  console.log(`OpenAPI spec written to ${outputPath}`);
}

generate().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
