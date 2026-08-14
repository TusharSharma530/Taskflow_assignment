import { createDatabase } from './db/database';
import { config, getDatabasePath } from './db/config';
import { seedDatabase } from './seed-data';

config();

const db = createDatabase(getDatabasePath());
const result = seedDatabase(db);
console.log(
  `Seeded board #${result.boardId} with ${result.columns} columns and ${result.tasks} tasks.`,
);
db.close();