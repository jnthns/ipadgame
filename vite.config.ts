import {defineConfig} from 'vite';
export default defineConfig({define:{'import.meta.env.VITE_BUILD_ID':JSON.stringify(process.env.GITHUB_SHA?.slice(0,7)??'local')},base:'./',server:{allowedHosts:['terminal.local']},build:{target:'es2022',chunkSizeWarningLimit:1800}});
