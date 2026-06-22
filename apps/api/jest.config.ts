import type { Config } from 'jest'

// Test pyramid (see CLAUDE.md): many fast domain unit tests, fewer use-case
// tests, few integration tests, minimal e2e — plus executable architecture
// edge tests that assert the module-boundary invariants.
const tsJest = { preset: 'ts-jest', testEnvironment: 'node' } as const

const config: Config = {
  rootDir: '.',
  projects: [
    { ...tsJest, displayName: 'unit', testMatch: ['<rootDir>/src/**/*.spec.ts'] },
    { ...tsJest, displayName: 'integration', testMatch: ['<rootDir>/test/integration/**/*.spec.ts'] },
    { ...tsJest, displayName: 'arch', testMatch: ['<rootDir>/test/arch/**/*.spec.ts'] },
    { ...tsJest, displayName: 'e2e', testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'] },
  ],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.module.ts', '!src/main.ts'],
}

export default config
