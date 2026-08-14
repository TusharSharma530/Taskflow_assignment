import { createApp } from './app';
import { createDatabase } from './db/database';
import { config, getDatabasePath, getPort } from './db/config';
import { seedIfEmpty } from './seed-data';

config();

const dbPath = getDatabasePath();
const port = getPort();

const db = createDatabase(dbPath);
seedIfEmpty(db);

const app = createApp(db);

app.listen(port, () => {
  console.log(`TaskFlow backend listening on http://localhost:${port}`);
});