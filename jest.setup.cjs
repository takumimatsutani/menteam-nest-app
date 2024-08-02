// jest.setup.js
const { Logger } = require('@nestjs/common');
require('jest-extended');

global.beforeAll(() => {
  jest.spyOn(global.console, 'error').mockImplementation((message, ...args) => {
    Logger.error(`[Test Error] ${message}`, ...args);
  });
});

global.afterAll(() => {
  jest.restoreAllMocks();
});
