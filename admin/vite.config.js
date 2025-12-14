import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),

  nodePolyfills({
    include: ['stream', 'util', 'buffer', 'process'], // Thêm 'process' vào đây cho chắc
    globals: {
      Buffer: true,
      global: true,
      process: true, // <--- QUAN TRỌNG: Thêm dòng này để tạo biến process giả
    },
  }),
  ],
  resolve: {
    alias: {
      util: 'util', // Giữ nguyên dòng này từ bước trước
    },
  },
  server: { port: 5174 },

})
