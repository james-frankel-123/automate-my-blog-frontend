const fs = require('fs');

const BASE_URL = 'http://localhost:3001';
const TEST_SESSION_ID = 'test-session-' + Date.now();
const TEST_USER_ID = 'test-user-' + Date.now();

// Test results storage
const testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  },
  tests: []
};

// Helper function to log test results
function logTest(name, passed, details) {
  testResults.summary.total++;
  if (passed) {
    testResults.summary.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ ${name} - ${details}`);
  }
  
  testResults.tests.push({
    name,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
}

// Helper function to make API calls using fetch (Node.js 18+)
async function apiCall(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.body = typeof data === 'string' ? data : JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const responseData = await response.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(responseData);
    } catch (e) {
      parsedData = responseData;
    }
    
    return { 
      success: response.ok, 
      data: parsedData, 
      status: response.status,
      error: response.ok ? null : parsedData
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 500
    };
  }
}

async function runTests() {
  console.log('🚀 Starting Phase 1A API Testing...\n');
  
  // 1. Test health endpoint
  console.log('📋 Testing Backend Health:');
  const healthResult = await apiCall('GET', '/health');
  logTest('Backend Health Check', healthResult.success, healthResult.error);
  
  // 2. Test analysis endpoints
  console.log('\n📊 Testing Analysis Endpoints:');
  
  // Test GET /api/v1/analysis/recent without authentication (should fail)
  const recentNoAuth = await apiCall('GET', '/api/v1/analysis/recent');
  logTest('Analysis Recent - No Auth (expected fail)', recentNoAuth.status === 401, 'Should require authentication');
  
  // Test GET /api/v1/analysis/recent with mock auth header
  const recentWithAuth = await apiCall('GET', '/api/v1/analysis/recent', null, {
    'x-mock-user-id': TEST_USER_ID
  });
  logTest('Analysis Recent - With Mock Auth', recentWithAuth.success, recentWithAuth.error);
  
  // Test PUT /api/v1/analysis/update with session
  const updateData = {
    businessName: 'Test Company',
    businessType: 'Technology',
    websiteUrl: 'https://test-company.com',
    targetAudience: 'Tech enthusiasts',
    description: 'A test company for API testing'
  };
  
  const updateResult = await apiCall('PUT', '/api/v1/analysis/update', updateData, {
    'x-session-id': TEST_SESSION_ID
  });
  logTest('Analysis Update - With Session', updateResult.success, updateResult.error);
  
  // Test POST /api/v1/analysis/discover-content without auth (should fail)
  const discoverNoAuth = await apiCall('POST', '/api/v1/analysis/discover-content', {
    websiteUrl: 'https://test-company.com'
  });
  logTest('Content Discovery - No Auth (expected fail)', discoverNoAuth.status === 401, 'Should require authentication');
  
  // Test POST /api/v1/analysis/adopt-session (requires user auth)
  const adoptResult = await apiCall('POST', '/api/v1/analysis/adopt-session', {
    session_id: TEST_SESSION_ID
  }, {
    'x-mock-user-id': TEST_USER_ID
  });
  logTest('Session Adoption', adoptResult.success, adoptResult.error);
  
  // 3. Test content upload endpoints  
  console.log('\n📝 Testing Content Upload Endpoints:');
  
  // Test manual posts upload without auth (should fail)
  const manualPostsNoAuth = await apiCall('POST', '/api/v1/content-upload/manual-posts', {
    posts: [{ title: 'Test Post', content: 'Test content' }]
  });
  logTest('Manual Posts - No Auth (expected fail)', manualPostsNoAuth.status === 401, 'Should require authentication');
  
  // Test upload status without auth (should fail)
  const statusNoAuth = await apiCall('GET', '/api/v1/content-upload/status/test-org-id');
  logTest('Upload Status - No Auth (expected fail)', statusNoAuth.status === 401, 'Should require authentication');
  
  // 4. Test user routes
  console.log('\n👤 Testing User Endpoints:');
  
  // Test user info
  const userInfoResult = await apiCall('GET', '/api/v1/users/info', null, {
    'x-mock-user-id': TEST_USER_ID
  });
  logTest('User Info', userInfoResult.success, userInfoResult.error);
  
  // 5. Test session routes
  console.log('\n🎯 Testing Session Endpoints:');
  
  // Test session save
  const sessionSaveResult = await apiCall('POST', '/api/v1/session/save', {
    session_id: TEST_SESSION_ID,
    data: { test: true },
    data_type: 'test'
  });
  logTest('Session Save', sessionSaveResult.success, sessionSaveResult.error);
  
  // Test session load
  const sessionLoadResult = await apiCall('GET', `/api/v1/session/load/${TEST_SESSION_ID}`);
  logTest('Session Load', sessionLoadResult.success, sessionLoadResult.error);
  
  // 6. Test error handling
  console.log('\n⚠️ Testing Error Handling:');
  
  // Test invalid endpoint
  const invalidEndpoint = await apiCall('GET', '/api/v1/invalid-endpoint');
  logTest('Invalid Endpoint (expected 404)', invalidEndpoint.status === 404, 'Should return 404');
  
  // Test malformed JSON
  const malformedJson = await apiCall('POST', '/api/v1/analysis/adopt-session', 'invalid-json', {
    'Content-Type': 'application/json'
  });
  logTest('Malformed JSON (expected 400)', malformedJson.status >= 400 && malformedJson.status < 500, 'Should reject malformed JSON');
  
  // 7. Test database endpoints
  console.log('\n🗄️ Testing Database Operations:');
  
  // Test database connection through projects endpoint
  const projectsResult = await apiCall('GET', '/api/v1/posts/projects', null, {
    'x-mock-user-id': TEST_USER_ID
  });
  logTest('Database Connection (Projects)', projectsResult.success, projectsResult.error);
  
  console.log('\n📊 TEST SUMMARY:');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`Success Rate: ${Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%`);
  console.log('='.repeat(50));
  
  // Save detailed results to file
  fs.writeFileSync('./phase1a-api-test-results.json', JSON.stringify(testResults, null, 2));
  console.log('💾 Detailed results saved to: phase1a-api-test-results.json');
  
  return testResults;
}

// Error handling for the test runner
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };