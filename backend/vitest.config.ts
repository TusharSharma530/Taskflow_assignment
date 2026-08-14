import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tests share a single MySQL test database (taskflow_test), so test
    // files must run one at a time to avoid stepping on each other.
    fileParallelism: false,
  },
});