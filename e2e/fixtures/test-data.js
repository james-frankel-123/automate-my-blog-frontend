/**
 * Test Data Fixtures
 */

export const testUsers = {
  valid: {
    email: 'test@example.com',
    password: 'TestPassword123!',
  },
  newUser: {
    email: `newuser-${Date.now()}@test.com`,
    password: 'NewUserPassword123!',
    firstName: 'Test',
    lastName: 'User',
  },
};

export const testWebsites = {
  valid: 'https://example.com',
  invalid: 'not-a-url',
  withPath: 'https://example.com/blog',
};

export const testContent = {
  title: 'Test Blog Post Title',
  topic: 'Technology and Innovation',
  audience: 'Tech Enthusiasts',
};

export const testProjects = {
  name: `Test Project ${Date.now()}`,
  description: 'This is a test project created by e2e tests',
};
