import { createApp } from './app';
import { createPool } from './db/database';
import { config, getMySqlConfig, getPort } from './db/config';
import { seedIfEmpty } from './seed-data';

async function main(): Promise<void> {
  config();

  const port = getPort();

  const db = await createPool(getMySqlConfig());
  await seedIfEmpty(db);

  const app = createApp(db);

  app.listen(port, () => {
    console.log(`TaskFlow backend listening on http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error('Failed to start the backend:', error);
  process.exit(1);
});