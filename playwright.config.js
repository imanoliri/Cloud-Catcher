import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'./tests/e2e',
  fullyParallel:false,
  workers:1,
  timeout:30_000,
  expect:{timeout:5_000},
  reporter:'line',
  use:{
    baseURL:'http://127.0.0.1:4173',
    trace:'retain-on-failure'
  },
  projects:[
    {
      name:'mobile-chromium',
      use:{...devices['Pixel 7']}
    }
  ],
  webServer:{
    command:'npm run build && python3 -m http.server 4173 -d dist',
    url:'http://127.0.0.1:4173',
    reuseExistingServer:false,
    timeout:120_000
  }
});
