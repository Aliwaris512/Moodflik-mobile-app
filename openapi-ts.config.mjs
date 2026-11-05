import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '../backend/openapi.yaml',
  output: 'src/api/generated',
  plugins: ['@hey-api/typescript', 'zod', '@tanstack/react-query'],
});
