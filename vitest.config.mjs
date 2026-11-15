import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},test:{pool:'threads',maxWorkers:1,fileParallelism:false,testTimeout:10000,exclude:['node_modules/**','.next/**','dist/**','.browser-test/**','.taste-skill/**']}});
