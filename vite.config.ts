import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const buildTime = new Date().toISOString();
    const shortSha = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.substring(0,7) : '';
    const version = `build:${buildTime}${shortSha ? `-${shortSha}` : ''}`;
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.APP_VERSION': JSON.stringify(version)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
