import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@shared': path.resolve(__dirname, './src/shared'),
            '@tools': path.resolve(__dirname, './src/tools'),
        },
    },
    server: {
        proxy: {
            '/api/deepseek': {
                target: 'https://api.deepseek.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/deepseek/, '')
            },
            '/api/openai': {
                target: 'https://api.openai.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/openai/, '')
            }
        }
    },
    define: {
        'process.env': process.env
    }
});
