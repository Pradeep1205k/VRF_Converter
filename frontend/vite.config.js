import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/VRF_Converter/',
  plugins: [react()],
  server: {
    port: 5173
  }
})
