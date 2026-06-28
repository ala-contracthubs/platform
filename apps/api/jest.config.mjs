import base from '@contracthubs/config/jest/node'

/** API test runner: ts-jest with full (non-isolated) transform so NestJS
 *  `emitDecoratorMetadata` is preserved for DI in integration tests. */
export default {
  ...base,
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testRegex: '\\.(spec|e2e-spec)\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json', isolatedModules: false }],
  },
}
