import {defineConfig} from 'vitest/config'
import {fileURLToPath} from 'node:url'

export default defineConfig({
  resolve:{alias:{
    '@':fileURLToPath(new URL('./',import.meta.url)),
    // `server-only` throws outside a React Server environment; tests run the services directly.
    'server-only':fileURLToPath(new URL('./tests/server-only-stub.ts',import.meta.url)),
  }},
  test:{environment:'jsdom',include:['tests/**/*.test.{ts,tsx}'],testTimeout:15000,env:{NEXT_PUBLIC_REVIEW:'1'}},
})
