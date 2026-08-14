import { createPool } from './db/database';
import { config, getMySqlConfig } from './db/config';
import { seedDatabase } from './seed-data';

async function main(): Promise<void> {
  config();

  const db = await createPool(getMySqlConfig());
  const result = await seedDatabase(db);
  console.log(
    `Seeded board #${result.boardId} with ${result.columns} columns and ${result.tasks} tasks.`,
  );
  await db.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});