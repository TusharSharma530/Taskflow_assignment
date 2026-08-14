import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import type Database from 'better-sqlite3';
import { HttpError } from './errors/http.error';
import { boardsRouter } from './routes/boards.routes';
import { tasksRouter } from './routes/tasks.routes';

/**
 * Creates the Express application wired to a specific database handle.
 * Receiving the database as a parameter keeps the app easy to test in
 * isolation (each test uses its own in-memory database).
 */
export function createApp(db: Database.Database): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', boardsRouter(db));
  app.use('/api', tasksRouter(db));

  // Unknown API routes -> 404 with a consistent JSON shape.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Centralized error handling: never leak stack traces to clients.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    if (err instanceof SyntaxError) {
      res.status(400).json({ error: 'Invalid JSON payload' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}