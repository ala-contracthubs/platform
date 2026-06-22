/** Shared Jest base preset for Node/TypeScript packages (ts-jest). */
export default {
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { isolatedModules: true }],
  },
  clearMocks: true,
}
