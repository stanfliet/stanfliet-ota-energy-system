const path = require('path');
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'mapbox-gl': path.resolve(__dirname, 'src/mapbox-gl-stub.js')
    }
  }
})
