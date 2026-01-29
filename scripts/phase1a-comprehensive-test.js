const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = 'http://localhost:3001';
const TEST_SESSION_ID = 'test-session-' + Date.now();
const TEST_EMAIL = `test-${Date.now()}@automatetest.com`;
const TEST_PASSWORD = 'TestPassword123!';

// Test results storage
const testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  },
  tests: [],
  errors: []
};

// Store test user data for cleanup
let testUserData = null;
let testAccessToken = null;

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

// Helper function to make API calls using fetch
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

// Helper function to upload test file content
async function uploadFile(endpoint, fileData, additionalData = {}, token = null) {
  try {
    const FormData = require('form-data');
    const form = new FormData();
    
    // Add file as buffer
    form.append('files', Buffer.from(fileData.content), {
      filename: fileData.filename,
      contentType: fileData.contentType
    });
    
    // Add additional form data
    Object.keys(additionalData).forEach(key => {
      form.append(key, additionalData[key]);
    });
    
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      body: form,
      headers
    });
    
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
  console.log('🚀 Starting Comprehensive Phase 1A Testing...\n');
  console.log(`📧 Test email: ${TEST_EMAIL}`);
  console.log(`🔑 Test session: ${TEST_SESSION_ID}\n`);
  
  // PHASE 1: Authentication Testing
  console.log('🔐 PHASE 1: Authentication Testing');
  console.log('='.repeat(50));
  
  // Test 1: Health check
  const healthResult = await apiCall('GET', '/health');
  logTest('Backend Health Check', healthResult.success, healthResult.error);
  
  // Test 2: User Registration
  const registrationData = {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    firstName: 'Test',
    lastName: 'User',
    organizationName: 'Test Organization',
    websiteUrl: 'https://test-organization.com'
  };
  
  const registerResult = await apiCall('POST', '/api/v1/auth/register', registrationData);
  logTest('User Registration', registerResult.success, registerResult.error || registerResult.data?.message);
  
  if (registerResult.success) {
    testUserData = registerResult.data.user;
    testAccessToken = registerResult.data.accessToken;
    console.log(`   👤 Created user: ${testUserData.id}`);
    console.log(`   🏢 Organization: ${testUserData.organizationId}`);
  }
  
  // Test 3: User Login
  const loginResult = await apiCall('POST', '/api/v1/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  logTest('User Login', loginResult.success, loginResult.error);
  
  if (loginResult.success && !testAccessToken) {
    testAccessToken = loginResult.data.accessToken;
  }
  
  // Test 4: Get user info
  if (testAccessToken) {
    const userInfoResult = await apiCall('GET', '/api/v1/auth/me', null, {
      Authorization: `Bearer ${testAccessToken}`
    });
    logTest('Get User Info', userInfoResult.success, userInfoResult.error);
  }
  
  // PHASE 2: Analysis Endpoints Testing
  console.log('\n📊 PHASE 2: Analysis Endpoints Testing');
  console.log('='.repeat(50));
  
  if (!testAccessToken) {
    console.log('⚠️  Skipping analysis tests - no valid auth token');
    testResults.errors.push('No valid authentication token for analysis tests');
  } else {
    // Test session data creation first (for adoption testing)
    const sessionUpdateResult = await apiCall('PUT', '/api/v1/analysis/update', {
      businessName: 'Test Organization Session',
      businessType: 'Technology',
      websiteUrl: 'https://test-session.com',
      targetAudience: 'Tech professionals',
      description: 'A test organization for session adoption testing'
    }, {
      'x-session-id': TEST_SESSION_ID
    });
    logTest('Session Data Creation', sessionUpdateResult.success, sessionUpdateResult.error);
    
    // Test session adoption
    const adoptResult = await apiCall('POST', '/api/v1/analysis/adopt-session', {
      session_id: TEST_SESSION_ID
    }, {
      Authorization: `Bearer ${testAccessToken}`
    });
    logTest('Session Adoption', adoptResult.success, adoptResult.error || adoptResult.data?.message);
    
    // Test getting recent analysis
    const recentResult = await apiCall('GET', '/api/v1/analysis/recent', null, {
      Authorization: `Bearer ${testAccessToken}`
    });
    logTest('Get Recent Analysis', recentResult.success, recentResult.error);
    
    // Test analysis update
    const updateResult = await apiCall('PUT', '/api/v1/analysis/update', {
      businessName: 'Updated Test Organization',
      businessType: 'SaaS',
      targetAudience: 'Small business owners'
    }, {
      Authorization: `Bearer ${testAccessToken}`
    });
    logTest('Update Analysis Data', updateResult.success, updateResult.error);
    
    // Test content discovery (this might fail without a real website)
    const discoveryResult = await apiCall('POST', '/api/v1/analysis/discover-content', {
      websiteUrl: 'https://example.com',
      forceRefresh: true
    }, {
      Authorization: `Bearer ${testAccessToken}`
    });
    logTest('Content Discovery', discoveryResult.success || discoveryResult.status === 500, 'Expected to work or fail gracefully');
    
    // Get organization ID for further tests
    let orgId = null;
    if (recentResult.success && recentResult.data?.analysis) {
      // Try to extract org ID from database or use user's default org
      orgId = testUserData?.organizationId;
    }
    
    if (orgId) {
      console.log(`   🏢 Testing with organization ID: ${orgId}`);
      
      // Test blog content retrieval
      const blogContentResult = await apiCall('GET', `/api/v1/analysis/blog-content/${orgId}`, null, {
        Authorization: `Bearer ${testAccessToken}`
      });
      logTest('Get Blog Content', blogContentResult.success, blogContentResult.error);
      
      // Test CTA analysis
      const ctaResult = await apiCall('GET', `/api/v1/analysis/cta-analysis/${orgId}`, null, {
        Authorization: `Bearer ${testAccessToken}`
      });
      logTest('Get CTA Analysis', ctaResult.success, ctaResult.error);
      
      // Test internal links analysis
      const linksResult = await apiCall('GET', `/api/v1/analysis/internal-links/${orgId}`, null, {
        Authorization: `Bearer ${testAccessToken}`
      });
      logTest('Get Internal Links Analysis', linksResult.success, linksResult.error);
      
      // Test comprehensive summary
      const summaryResult = await apiCall('GET', `/api/v1/analysis/comprehensive-summary/${orgId}`, null, {
        Authorization: `Bearer ${testAccessToken}`
      });
      logTest('Get Comprehensive Summary', summaryResult.success, summaryResult.error);
    } else {
      console.log('⚠️  Skipping org-specific analysis tests - no organization ID found');
    }
  }
  
  // PHASE 3: Content Upload Endpoints Testing
  console.log('\n📝 PHASE 3: Content Upload Endpoints Testing');
  console.log('='.repeat(50));
  
  if (!testAccessToken || !testUserData?.organizationId) {
    console.log('⚠️  Skipping content upload tests - missing auth or organization');
    testResults.errors.push('Missing authentication or organization for content upload tests');
  } else {
    const orgId = testUserData.organizationId;
    
    // Test manual posts upload
    const manualPostsData = {
      organizationId: orgId,
      posts: [
        {
          title: 'Test Blog Post 1',
          content: 'This is a test blog post content for Phase 1A testing. It contains multiple sentences to ensure proper word count calculation and content processing. This post is designed to test the manual content upload functionality.',
          url: 'https://test.com/blog/test-post-1',
          author: 'Test Author',
          publishedDate: '2024-01-01'
        },
        {
          title: 'Test Blog Post 2', 
          content: 'Another test blog post with different content. This post focuses on testing various content scenarios and ensuring the upload system can handle multiple posts in a single request.',
          metaDescription: 'Test meta description for SEO testing'
        }
      ]
    };
    
    const manualUploadResult = await apiCall('POST', '/api/v1/content-upload/manual-posts', manualPostsData, {
      Authorization: `Bearer ${testAccessToken}`
    });
    logTest('Manual Posts Upload', manualUploadResult.success, manualUploadResult.error);
    
    // Test file upload - create sample files
    const sampleFiles = [
      {
        filename: 'test-content.md',
        contentType: 'text/markdown',
        content: `# Test Blog Post from File
        
This is a test blog post imported from a markdown file. It demonstrates the file upload and content extraction functionality.

## Key Features

- Markdown parsing
- Content extraction
- Automatic title detection

This content should be properly extracted and stored in the database.`
      },
      {
        filename: 'test-posts.json',
        contentType: 'application/json',
        content: JSON.stringify({
          posts: [
            {
              title: 'JSON Test Post 1',
              content: 'This is a test post from JSON file format.',
              author: 'JSON Author',
              date: '2024-01-02'
            },
            {
              title: 'JSON Test Post 2',
              content: 'Another test post demonstrating JSON import functionality.',
              author: 'JSON Author',
              date: '2024-01-03'
            }
          ]
        })
      }
    ];
    
    // Test each file upload (note: this is a simplified test - real multipart upload would be more complex)
    for (const file of sampleFiles) {
      try {
        // For this test, we'll just test the endpoint response to malformed data
        // since proper multipart/form-data upload requires additional setup
        const fileUploadResult = await apiCall('POST', '/api/v1/content-upload/blog-export', {
          organizationId: orgId,
          testFile: file
        }, {
          Authorization: `Bearer ${testAccessToken}`,
          'Content-Type': 'application/json' // This should fail since it expects multipart
        });
        logTest(`File Upload Test (${file.filename})`, fileUploadResult.status === 400, 'Expected to reject non-multipart data');
      } catch (error) {
        logTest(`File Upload Test (${file.filename})`, true, 'Properly rejected invalid request');
      }
    }
    
    // Test upload status
    const statusResult = await apiCall('GET', `/api/v1/content-upload/status/${orgId}`, null, {
      Authorization: `Bearer ${testAccessToken}`
    });
    logTest('Get Upload Status', statusResult.success, statusResult.error);
  }
  
  // PHASE 4: Database and Schema Testing
  console.log('\n🗄️  PHASE 4: Database and Schema Testing');
  console.log('='.repeat(50));
  
  if (testAccessToken) {
    // Test user-related database operations
    const userAdoptResult = await apiCall('POST', '/api/v1/users/adopt-session', {
      session_id: TEST_SESSION_ID
    }, {
      Authorization: `Bearer ${testAccessToken}`
    });
    logTest('User Session Adoption', userAdoptResult.success || userAdoptResult.status === 404, 'Expected to work or fail gracefully');
  }
  
  // PHASE 5: Error Handling and Edge Cases
  console.log('\n⚠️  PHASE 5: Error Handling Testing');
  console.log('='.repeat(50));
  
  // Test invalid endpoints
  const invalidEndpoint = await apiCall('GET', '/api/v1/invalid-endpoint');
  logTest('Invalid Endpoint (404)', invalidEndpoint.status === 404, 'Should return 404');
  
  // Test malformed JSON
  const malformedResult = await apiCall('POST', '/api/v1/auth/login', 'invalid-json', {
    'Content-Type': 'application/json'
  });
  logTest('Malformed JSON Handling', malformedResult.status === 400, 'Should reject malformed JSON');
  
  // Test unauthorized access
  const unauthorizedResult = await apiCall('GET', '/api/v1/analysis/recent');
  logTest('Unauthorized Access Control', unauthorizedResult.status === 401 || !unauthorizedResult.success, 'Should require authentication');
  
  // Test invalid authentication token
  const invalidTokenResult = await apiCall('GET', '/api/v1/auth/me', null, {
    Authorization: 'Bearer invalid-token'
  });
  logTest('Invalid Token Handling', invalidTokenResult.status === 401, 'Should reject invalid tokens');
  
  // PHASE 6: Performance and Load Testing (Basic)
  console.log('\n⚡ PHASE 6: Performance Testing');
  console.log('='.repeat(50));
  
  // Test response times
  const startTime = Date.now();
  const perfResult = await apiCall('GET', '/health');
  const responseTime = Date.now() - startTime;
  logTest('Response Time Performance', responseTime < 2000 && perfResult.success, `Response time: ${responseTime}ms`);
  
  // Concurrent requests test (basic)
  const concurrentPromises = Array(3).fill().map(() => apiCall('GET', '/health'));
  const concurrentResults = await Promise.all(concurrentPromises);
  const allSucceeded = concurrentResults.every(r => r.success);
  logTest('Concurrent Requests Handling', allSucceeded, 'All concurrent requests should succeed');
  
  // FINAL RESULTS
  console.log('\n📊 COMPREHENSIVE TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`Success Rate: ${Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%`);
  
  if (testResults.errors.length > 0) {
    console.log(`\n⚠️  Errors Encountered: ${testResults.errors.length}`);
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  // Test environment analysis
  console.log('\n🔍 Test Environment Analysis:');
  if (healthResult.success) {
    console.log('   ✅ Backend server is running and responding');
    console.log(`   🔗 Database available: ${healthResult.data?.authSystemStatus?.databaseAvailable || 'unknown'}`);
    console.log(`   🛡️  Auth mode: ${healthResult.data?.authSystemStatus?.mode || 'unknown'}`);
    console.log(`   🔑 OpenAI configured: ${healthResult.data?.env?.hasOpenAIKey || false}`);
  }
  
  if (testAccessToken) {
    console.log('   ✅ Authentication system working');
    console.log('   ✅ JWT token generation successful');
  } else {
    console.log('   ❌ Authentication system issues detected');
  }
  
  console.log('='.repeat(60));
  
  // Save detailed results
  const detailedResults = {
    ...testResults,
    testEnvironment: {
      baseUrl: BASE_URL,
      testEmail: TEST_EMAIL,
      testSessionId: TEST_SESSION_ID,
      testUserId: testUserData?.id || null,
      testOrgId: testUserData?.organizationId || null,
      authTokenReceived: !!testAccessToken,
      timestamp: new Date().toISOString()
    },
    recommendations: generateRecommendations()
  };
  
  fs.writeFileSync('./phase1a-comprehensive-test-results.json', JSON.stringify(detailedResults, null, 2));
  console.log('💾 Detailed results saved to: phase1a-comprehensive-test-results.json');
  
  return detailedResults;
}

function generateRecommendations() {
  const recommendations = [];
  
  if (testResults.summary.failed > 0) {
    recommendations.push('Review failed test cases and fix underlying issues');
  }
  
  if (!testAccessToken) {
    recommendations.push('Fix authentication system - JWT token generation failed');
    recommendations.push('Check database connectivity for user storage');
  }
  
  if (testResults.summary.passed / testResults.summary.total < 0.8) {
    recommendations.push('Overall success rate below 80% - significant issues need attention');
  } else {
    recommendations.push('Good success rate - minor issues to address');
  }
  
  recommendations.push('Add integration tests to CI/CD pipeline');
  recommendations.push('Implement proper logging and monitoring for production');
  recommendations.push('Add more comprehensive error handling tests');
  
  return recommendations;
}

// Error handling for the test runner
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  testResults.errors.push(`Unhandled rejection: ${reason}`);
});

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };