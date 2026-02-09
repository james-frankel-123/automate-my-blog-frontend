/**
 * Phase 1 Automated Test Suite
 * Tests new persistence functionality without breaking existing workflow
 */

// Test configuration
const TEST_CONFIG = {
  verbose: true,
  cleanup: true,
  testTimeout: 5000
};

// Test utilities
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
    this.startTime = null;
  }

  addTest(name, testFn, category = 'general') {
    this.tests.push({ name, testFn, category });
  }

  async runAllTests() {
    console.log('🧪 Starting Phase 1 Automated Tests...');
    console.log('='.repeat(50));
    
    this.startTime = performance.now();
    
    for (const test of this.tests) {
      try {
        const testStart = performance.now();
        await test.testFn();
        const testEnd = performance.now();
        
        this.results.push({
          name: test.name,
          category: test.category,
          status: 'PASS',
          duration: testEnd - testStart,
          error: null
        });
        
        if (TEST_CONFIG.verbose) {
          console.log(`✅ ${test.name} (${Math.round(testEnd - testStart)}ms)`);
        }
        
      } catch (error) {
        this.results.push({
          name: test.name,
          category: test.category,
          status: 'FAIL',
          duration: 0,
          error: error.message
        });
        
        console.error(`❌ ${test.name}: ${error.message}`);
      }
    }
    
    this.printSummary();
  }

  printSummary() {
    const totalTime = performance.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    console.log(`⏱️  Total time: ${Math.round(totalTime)}ms`);
    
    if (failed > 0) {
      console.log('\n❌ Failed tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }
    
    // Group by category
    const categories = [...new Set(this.results.map(r => r.category))];
    categories.forEach(category => {
      const categoryTests = this.results.filter(r => r.category === category);
      const categoryPassed = categoryTests.filter(r => r.status === 'PASS').length;
      console.log(`\n📋 ${category}: ${categoryPassed}/${categoryTests.length} passed`);
    });
    
    console.log('\n' + '='.repeat(50));
  }
}

// Initialize test runner
const testRunner = new TestRunner();

// Test helper functions
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertExists(value, name) {
  assert(value !== undefined && value !== null, `${name} should exist`);
}

function assertType(value, expectedType, name) {
  assert(typeof value === expectedType, `${name} should be type ${expectedType}, got ${typeof value}`);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test data
const testData = {
  mockStepResults: {
    websiteAnalysis: {
      businessType: 'Test Business',
      businessName: 'AutoBlog Test Corp',
      targetAudience: 'Small business owners',
      contentFocus: 'Content marketing automation',
      brandVoice: 'Expert',
      websiteUrl: 'https://testbusiness.com'
    },
    trendingTopics: [
      { title: 'Test Topic 1', subheader: 'Test content strategy' },
      { title: 'Test Topic 2', subheader: 'Test marketing approach' }
    ],
    selectedContent: { title: 'Test Topic 1', subheader: 'Test content strategy' },
    finalContent: 'This is test generated content for our blog post...'
  },
  mockProject: {
    name: 'Test Project',
    websiteUrl: 'https://testbusiness.com',
    businessType: 'Technology',
    targetAudience: 'Developers'
  },
  mockPost: {
    id: 'test_post_1',
    title: 'Test Blog Post',
    content: 'This is test blog post content...',
    topicData: { title: 'Test Topic', subheader: 'Test approach' }
  }
};

// Category 1: API Existence Tests
testRunner.addTest('autoBlogAPI should exist', async () => {
  assertExists(window.autoBlogAPI, 'autoBlogAPI global object');
}, 'api-existence');

testRunner.addTest('New workflow persistence methods should exist', async () => {
  const api = window.autoBlogAPI;
  assertType(api.saveWorkflowProgress, 'function', 'saveWorkflowProgress');
  assertType(api.getWorkflowProgress, 'function', 'getWorkflowProgress');
  assertType(api.clearWorkflowProgress, 'function', 'clearWorkflowProgress');
}, 'api-existence');

testRunner.addTest('New project management methods should exist', async () => {
  const api = window.autoBlogAPI;
  assertType(api.saveProjectFromAnalysis, 'function', 'saveProjectFromAnalysis');
  assertType(api.getUserProjects, 'function', 'getUserProjects');
}, 'api-existence');

testRunner.addTest('New content management methods should exist', async () => {
  const api = window.autoBlogAPI;
  assertType(api.saveContentVersion, 'function', 'saveContentVersion');
  assertType(api.getBlogPosts, 'function', 'getBlogPosts');
  assertType(api.trackContentExport, 'function', 'trackContentExport');
}, 'api-existence');

testRunner.addTest('New analytics methods should exist', async () => {
  const api = window.autoBlogAPI;
  assertType(api.trackUserActivity, 'function', 'trackUserActivity');
  assertType(api.getRecentActivities, 'function', 'getRecentActivities');
  assertType(api.getUsageStatistics, 'function', 'getUsageStatistics');
}, 'api-existence');

testRunner.addTest('New utility methods should exist', async () => {
  const api = window.autoBlogAPI;
  assertType(api.getSessionId, 'function', 'getSessionId');
  assertType(api.getCurrentUserId, 'function', 'getCurrentUserId');
}, 'api-existence');

// Category 2: Workflow Persistence Tests
testRunner.addTest('Should save workflow progress to localStorage', async () => {
  const api = window.autoBlogAPI;
  
  // Clear any existing progress
  await api.clearWorkflowProgress();
  
  // Save progress
  const saveResult = await api.saveWorkflowProgress(testData.mockStepResults, 2, 'test_user');
  assert(saveResult.success === true, 'Save should succeed');
  assertExists(saveResult.savedAt, 'SavedAt timestamp should exist');
  
  // Verify localStorage has the data
  const stored = localStorage.getItem('workflow_progress_test_user');
  assertExists(stored, 'Progress should be stored in localStorage');
  
  const parsed = JSON.parse(stored);
  assert(parsed.currentStep === 2, 'Current step should be saved correctly');
  assert(parsed.userId === 'test_user', 'User ID should be saved correctly');
}, 'workflow-persistence');

testRunner.addTest('Should retrieve saved workflow progress', async () => {
  const api = window.autoBlogAPI;
  
  // Get previously saved progress
  const getResult = await api.getWorkflowProgress('test_user');
  assert(getResult.success === true, 'Get should succeed');
  assert(getResult.canResume === true, 'Should be able to resume');
  assertExists(getResult.progress, 'Progress data should exist');
  assert(getResult.progress.currentStep === 2, 'Current step should be retrieved correctly');
}, 'workflow-persistence');

testRunner.addTest('Should handle anonymous workflow progress', async () => {
  const api = window.autoBlogAPI;
  
  // Save anonymous progress
  const saveResult = await api.saveWorkflowProgress(testData.mockStepResults, 1, null);
  assert(saveResult.success === true, 'Anonymous save should succeed');
  
  // Retrieve anonymous progress
  const getResult = await api.getWorkflowProgress(null);
  assert(getResult.success === true, 'Anonymous get should succeed');
  assert(getResult.progress.currentStep === 1, 'Anonymous progress should be correct');
}, 'workflow-persistence');

testRunner.addTest('Should clear workflow progress', async () => {
  const api = window.autoBlogAPI;
  
  const clearResult = await api.clearWorkflowProgress('test_user');
  assert(clearResult.success === true, 'Clear should succeed');
  
  // Verify it's cleared
  const getResult = await api.getWorkflowProgress('test_user');
  assert(getResult.canResume === false, 'Should not be able to resume after clear');
}, 'workflow-persistence');

// Category 3: Project Management Tests
testRunner.addTest('Should save project from analysis (requires auth token)', async () => {
  const api = window.autoBlogAPI;
  
  // Mock having an auth token for this test
  const originalToken = localStorage.getItem('accessToken');
  localStorage.setItem('accessToken', 'mock.jwt.token');
  
  try {
    const result = await api.saveProjectFromAnalysis(testData.mockProject, 'Test Project');
    assert(result.success === true, 'Project save should succeed with auth');
    assertExists(result.project, 'Saved project should be returned');
    assert(result.project.name === 'Test Project', 'Project name should be correct');
  } finally {
    // Restore original token
    if (originalToken) {
      localStorage.setItem('accessToken', originalToken);
    } else {
      localStorage.removeItem('accessToken');
    }
  }
}, 'project-management');

testRunner.addTest('Should get user projects', async () => {
  const api = window.autoBlogAPI;
  
  const result = await api.getUserProjects();
  assert(result.success === true, 'Get projects should succeed');
  assert(Array.isArray(result.projects), 'Projects should be an array');
}, 'project-management');

testRunner.addTest('Should handle project save without auth token', async () => {
  const api = window.autoBlogAPI;
  
  // Remove auth token temporarily
  const originalToken = localStorage.getItem('accessToken');
  localStorage.removeItem('accessToken');
  
  try {
    const result = await api.saveProjectFromAnalysis(testData.mockProject, 'Test Project');
    assert(result.success === false, 'Project save should fail without auth');
  } finally {
    // Restore token if it existed
    if (originalToken) {
      localStorage.setItem('accessToken', originalToken);
    }
  }
}, 'project-management');

// Category 4: Content Management Tests
testRunner.addTest('Should save content version (requires auth)', async () => {
  const api = window.autoBlogAPI;
  
  // Mock auth token
  const originalToken = localStorage.getItem('accessToken');
  localStorage.setItem('accessToken', 'mock.jwt.token');
  
  try {
    const result = await api.saveContentVersion(testData.mockPost, 1, 'test_project_1');
    assert(result.success === true, 'Content save should succeed with auth');
    assertExists(result.post, 'Saved post should be returned');
    assert(result.post.title === 'Test Blog Post', 'Post title should be correct');
    assert(result.post.version === 1, 'Post version should be correct');
  } finally {
    if (originalToken) {
      localStorage.setItem('accessToken', originalToken);
    } else {
      localStorage.removeItem('accessToken');
    }
  }
}, 'content-management');

testRunner.addTest('Should get blog posts', async () => {
  const api = window.autoBlogAPI;
  
  const result = await api.getBlogPosts();
  assert(result.success === true, 'Get posts should succeed');
  assert(Array.isArray(result.posts), 'Posts should be an array');
}, 'content-management');

testRunner.addTest('Should track content export', async () => {
  const api = window.autoBlogAPI;
  
  const result = await api.trackContentExport('test_post_1', 'markdown');
  assert(result.success === true, 'Export tracking should succeed');
}, 'content-management');

// Category 5: Analytics Tests
testRunner.addTest('Should track user activity', async () => {
  const api = window.autoBlogAPI;
  
  const result = await api.trackUserActivity('test_event', { testData: 'value' });
  assert(result.success === true, 'Activity tracking should succeed');
  assertExists(result.activity, 'Activity object should be returned');
  assert(result.activity.eventType === 'test_event', 'Event type should be correct');
}, 'analytics');

testRunner.addTest('Should get recent activities', async () => {
  const api = window.autoBlogAPI;
  
  const result = await api.getRecentActivities(5);
  assert(result.success === true, 'Get activities should succeed');
  assert(Array.isArray(result.activities), 'Activities should be an array');
  assert(result.activities.length <= 5, 'Should respect limit parameter');
}, 'analytics');

testRunner.addTest('Should get usage statistics', async () => {
  const api = window.autoBlogAPI;
  
  const result = await api.getUsageStatistics();
  assert(result.success === true, 'Get stats should succeed');
  assertExists(result.stats, 'Stats object should exist');
  assertType(result.stats.totalProjects, 'number', 'totalProjects');
  assertType(result.stats.totalPosts, 'number', 'totalPosts');
  assertType(result.stats.totalExports, 'number', 'totalExports');
}, 'analytics');

// Category 6: Utility Tests
testRunner.addTest('Should generate consistent session ID', async () => {
  const api = window.autoBlogAPI;
  
  const sessionId1 = api.getSessionId();
  const sessionId2 = api.getSessionId();
  
  assertExists(sessionId1, 'Session ID should exist');
  assert(sessionId1 === sessionId2, 'Session ID should be consistent within session');
  assert(sessionId1.includes('session_'), 'Session ID should have correct prefix');
}, 'utilities');

testRunner.addTest('Should handle user ID extraction safely', async () => {
  const api = window.autoBlogAPI;
  
  // Should not throw error even with invalid or missing token
  const userId = api.getCurrentUserId();
  // Could be null or a valid user ID, both are acceptable
  assert(userId === null || typeof userId === 'string', 'User ID should be null or string');
}, 'utilities');

// Category 7: Data Persistence Tests
testRunner.addTest('Should persist data across page refresh simulation', async () => {
  const api = window.autoBlogAPI;
  
  // Save some test data
  await api.saveWorkflowProgress(testData.mockStepResults, 3, 'persistence_test');
  await api.trackUserActivity('persistence_test_event', { test: true });
  
  // Simulate what happens on page refresh by creating new API instance
  const testAPI = new (window.AutoBlogAPI || window.autoBlogAPI.constructor)();
  
  // Data should still be retrievable
  const progress = await testAPI.getWorkflowProgress('persistence_test');
  assert(progress.success === true, 'Data should persist across sessions');
  assert(progress.progress.currentStep === 3, 'Persisted data should be correct');
}, 'data-persistence');

testRunner.addTest('Should handle localStorage quota limits gracefully', async () => {
  const api = window.autoBlogAPI;
  
  // Our methods should handle storage limits without crashing
  // Generate lots of test data to approach limits
  for (let i = 0; i < 60; i++) { // More than our 50 project limit
    const mockProject = {
      ...testData.mockProject,
      name: `Test Project ${i}`,
      id: `project_${i}`
    };
    
    const originalToken = localStorage.getItem('accessToken');
    localStorage.setItem('accessToken', 'mock.jwt.token');
    
    try {
      await api.saveProjectFromAnalysis(mockProject, `Test Project ${i}`);
    } catch (error) {
      // Should not crash, even if storage is full
      assert(false, `Storage handling should be graceful: ${error.message}`);
    } finally {
      if (originalToken) {
        localStorage.setItem('accessToken', originalToken);
      } else {
        localStorage.removeItem('accessToken');
      }
    }
  }
  
  // Check that we didn't exceed our limits
  const projects = await api.getUserProjects();
  assert(projects.projects.length <= 50, 'Should respect project limit to prevent storage bloat');
}, 'data-persistence');

// Category 8: Regression Tests (ensure existing functionality isn't broken)
testRunner.addTest('Original API methods should still work', async () => {
  const api = window.autoBlogAPI;
  
  // Test existing methods still exist and are callable
  assertType(api.analyzeWebsite, 'function', 'analyzeWebsite');
  assertType(api.getTrendingTopics, 'function', 'getTrendingTopics');
  assertType(api.generateContent, 'function', 'generateContent');
  assertType(api.exportContent, 'function', 'exportContent');
  assertType(api.login, 'function', 'login');
  assertType(api.register, 'function', 'register');
  assertType(api.logout, 'function', 'logout');
}, 'regression');

testRunner.addTest('localStorage should not interfere with existing app state', async () => {
  const api = window.autoBlogAPI;
  
  // Save some test data
  await api.saveWorkflowProgress(testData.mockStepResults, 2);
  await api.trackUserActivity('test_activity');
  
  // Check that existing localStorage items aren't affected
  // This test assumes the app doesn't currently use these keys
  const existingAuthData = localStorage.getItem('accessToken');
  const existingRefreshToken = localStorage.getItem('refreshToken');
  
  // Our new data should coexist with existing data
  const newWorkflowData = localStorage.getItem('workflow_progress_anonymous');
  assertExists(newWorkflowData, 'New workflow data should exist');
  
  // If auth tokens exist, they should be unchanged
  if (existingAuthData) {
    const currentAuthData = localStorage.getItem('accessToken');
    assert(existingAuthData === currentAuthData, 'Existing auth data should be unchanged');
  }
}, 'regression');

// Cleanup function
async function cleanupTestData() {
  if (!TEST_CONFIG.cleanup) return;
  
  console.log('🧹 Cleaning up test data...');
  
  // Clear test data from localStorage
  const keysToCleanup = [
    'workflow_progress_test_user',
    'workflow_progress_persistence_test',
    'workflow_progress_anonymous',
    'saved_projects',
    'saved_posts',
    'user_activity'
  ];
  
  keysToCleanup.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Clear session storage
  sessionStorage.removeItem('workflow_backup');
  sessionStorage.removeItem('autoblog_session_id');
  
  console.log('✅ Test cleanup completed');
}

// Export test runner for manual execution
window.Phase1TestRunner = testRunner;

// Auto-run tests when script is loaded (if in test environment)
if (window.location.search.includes('autotest=true') || window.AUTO_RUN_PHASE1_TESTS) {
  document.addEventListener('DOMContentLoaded', async () => {
    await delay(1000); // Wait for app to initialize
    await testRunner.runAllTests();
    await cleanupTestData();
  });
}

// Export for manual execution
window.runPhase1Tests = async function(config = {}) {
  Object.assign(TEST_CONFIG, config);
  await testRunner.runAllTests();
  if (TEST_CONFIG.cleanup) {
    await cleanupTestData();
  }
};

console.log('📋 Phase 1 test suite loaded. Run tests with: runPhase1Tests()');
console.log('🔧 Options: runPhase1Tests({verbose: true, cleanup: false})');

export { testRunner, cleanupTestData };