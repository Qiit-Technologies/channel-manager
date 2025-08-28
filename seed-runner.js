const { DataSource } = require('typeorm');
const { seedOtaConfigurations } = require('./dist/scripts/seed-ota-configurations.js');
require('dotenv').config();

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'hellosauri',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'anli',
    entities: [
      __dirname + '/dist/**/*.entity.js',
    ],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');
    
    await seedOtaConfigurations(dataSource);
    console.log('✅ Seeding completed successfully');
    
    await dataSource.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeed(); 