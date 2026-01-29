/**
 * Phase 1A Frontend Integration Testing
 * 
 * This script tests the frontend components and their integration with the backend API.
 * We'll simulate user interactions and test the complete workflow.
 */

const fs = require('fs');

// Try to load puppeteer, fallback gracefully if not available
let puppeteer = null;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.log('ℹ️  Puppeteer not available, using static analysis mode');
}

const FRONTEND_URL = 'http://localhost:3000';
const TEST_EMAIL = `frontend-test-${Date.now()}@automatetest.com`;
const TEST_PASSWORD = 'TestPassword123!';

// Test results storage
const testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  },
  tests: [],
  errors: [],
  screenshots: []
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

async function takeScreenshot(page, name) {
  try {
    const filename = `./screenshots/phase1a-${name}-${Date.now()}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    testResults.screenshots.push({ name, filename, timestamp: new Date().toISOString() });
    console.log(`📸 Screenshot saved: ${filename}`);
  } catch (error) {
    console.warn(`Failed to take screenshot ${name}:`, error.message);
  }
}

async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.warn(`Element not found: ${selector}`);
    return false;
  }
}

async function runFrontendTests() {
  let browser = null;
  let page = null;
  
  try {
    console.log('🚀 Starting Phase 1A Frontend Testing...\n');
    console.log(`📧 Test email: ${TEST_EMAIL}`);
    console.log(`🌐 Frontend URL: ${FRONTEND_URL}\n`);
    
    // Create screenshots directory
    if (!fs.existsSync('./screenshots')) {
      fs.mkdirSync('./screenshots');
    }
    
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, // Set to false to see the browser
      slowMo: 100, // Slow down for better observation
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // PHASE 1: Frontend Loading and Basic Navigation
    console.log('🌐 PHASE 1: Frontend Loading and Basic Navigation');
    console.log('='.repeat(50));
    
    try {
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0', timeout: 30000 });
      await takeScreenshot(page, 'homepage-loaded');
      logTest('Homepage Loading', true, 'Frontend loaded successfully');
    } catch (error) {
      logTest('Homepage Loading', false, `Failed to load: ${error.message}`);
      console.error('Cannot proceed with frontend tests - site not accessible');
      return testResults;
    }
    
    // Check if main components exist
    const hasMainContent = await page.$('.ant-layout-content, .App, main') !== null;
    logTest('Main Content Present', hasMainContent, 'Main application content found');
    
    await takeScreenshot(page, 'initial-state');
    
    // PHASE 2: User Registration Flow
    console.log('\n🔐 PHASE 2: User Registration and Authentication');
    console.log('='.repeat(50));
    
    // Look for login/register buttons
    const loginButtonExists = await waitForElement(page, '[data-testid="login-button"], .login-btn, button:has-text("Login"), button:has-text("Sign In")', 5000);
    
    if (!loginButtonExists) {
      // Try looking for any authentication-related elements
      const authElements = await page.$$eval('button, a, [class*="auth"], [class*="login"], [class*="register"]', elements => 
        elements.map(el => ({ 
          text: el.textContent?.trim(), 
          className: el.className,
          tagName: el.tagName 
        })).filter(el => 
          el.text && (
            el.text.toLowerCase().includes('login') || 
            el.text.toLowerCase().includes('sign') || 
            el.text.toLowerCase().includes('auth') ||
            el.text.toLowerCase().includes('register')
          )
        )
      );
      
      console.log('🔍 Found potential auth elements:', authElements);
      
      if (authElements.length > 0) {
        // Try to click the first authentication element
        await page.evaluate((elements) => {
          const element = elements[0];
          const domElement = Array.from(document.querySelectorAll('*')).find(el => 
            el.textContent?.trim() === element.text
          );
          if (domElement) domElement.click();
        }, authElements);
        await page.waitForTimeout(2000);
      }
    } else {
      await page.click('[data-testid="login-button"], .login-btn, button:has-text("Login"), button:has-text("Sign In")');
      await page.waitForTimeout(2000);
    }
    
    await takeScreenshot(page, 'auth-attempt');
    
    // Check for registration form or modal
    const registrationFormExists = await waitForElement(page, 'form, .ant-form, [class*="register"], [class*="signup"]', 3000);
    logTest('Authentication UI Present', registrationFormExists, 'Registration/login interface found');
    
    // PHASE 3: Website Analysis Workflow
    console.log('\n📊 PHASE 3: Website Analysis Workflow Testing');
    console.log('='.repeat(50));
    
    // Look for website URL input field
    const websiteInputExists = await waitForElement(page, 
      'input[type="url"], input[placeholder*="website"], input[placeholder*="URL"], input[name*="website"], input[name*="url"]', 
      5000
    );
    
    if (websiteInputExists) {
      // Try to input a test website URL
      await page.focus('input[type="url"], input[placeholder*="website"], input[placeholder*="URL"], input[name*="website"], input[name*="url"]');
      await page.type('input[type="url"], input[placeholder*="website"], input[placeholder*="URL"], input[name*="website"], input[name*="url"]', 'https://example.com');
      await takeScreenshot(page, 'website-input-filled');
      
      // Look for analyze/submit button
      const analyzeButton = await page.$('button:has-text("Analyze"), button:has-text("Submit"), button:has-text("Scan"), [data-testid*="analyze"]');
      if (analyzeButton) {
        await analyzeButton.click();
        await page.waitForTimeout(3000);
        await takeScreenshot(page, 'analysis-started');
        logTest('Website Analysis Initiation', true, 'Website analysis workflow started');
      } else {
        logTest('Website Analysis Initiation', false, 'Analyze button not found');
      }
    } else {
      logTest('Website URL Input', false, 'Website URL input field not found');
    }
    
    // PHASE 4: Dashboard and Analysis Components
    console.log('\n📋 PHASE 4: Dashboard and Analysis Components');
    console.log('='.repeat(50));
    
    // Check for dashboard elements
    const dashboardElements = await page.$$eval('[class*="dashboard"], [class*="analysis"], .ant-tabs, .ant-card', elements => 
      elements.length
    );
    logTest('Dashboard Components Present', dashboardElements > 0, `Found ${dashboardElements} dashboard-related components`);
    
    // Check for tabs (comprehensive analysis tab)
    const tabsExist = await waitForElement(page, '.ant-tabs, [role="tablist"], .tabs', 3000);
    if (tabsExist) {
      const tabCount = await page.$$eval('.ant-tabs-tab, [role="tab"], .tab', tabs => tabs.length);
      logTest('Navigation Tabs Present', tabCount > 0, `Found ${tabCount} navigation tabs`);
      
      // Try to find comprehensive analysis tab
      const comprehensiveTab = await page.$('.ant-tabs-tab:has-text("Comprehensive"), .ant-tabs-tab:has-text("Analysis"), [role="tab"]:has-text("Analysis")');
      if (comprehensiveTab) {
        await comprehensiveTab.click();
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'comprehensive-tab');
        logTest('Comprehensive Analysis Tab', true, 'Comprehensive analysis tab found and clickable');
      }
    }
    
    // PHASE 5: Content Upload Modal Testing
    console.log('\n📝 PHASE 5: Content Upload Modal Testing');
    console.log('='.repeat(50));
    
    // Look for upload buttons
    const uploadButtons = await page.$$eval(
      'button:has-text("Upload"), button:has-text("Add"), [class*="upload"], [data-testid*="upload"]',
      buttons => buttons.map(btn => ({
        text: btn.textContent?.trim(),
        className: btn.className
      }))
    );
    
    logTest('Upload Buttons Present', uploadButtons.length > 0, `Found ${uploadButtons.length} potential upload buttons`);
    
    if (uploadButtons.length > 0) {
      try {
        // Try to click the first upload button
        await page.click('button:has-text("Upload"), button:has-text("Add")');
        await page.waitForTimeout(2000);
        
        // Check for modal or form
        const modalExists = await waitForElement(page, '.ant-modal, .modal, [role="dialog"]', 3000);
        if (modalExists) {
          await takeScreenshot(page, 'upload-modal');
          logTest('Content Upload Modal', true, 'Content upload modal opened successfully');
          
          // Test manual content input
          const textAreaExists = await waitForElement(page, 'textarea, .ant-input', 2000);
          if (textAreaExists) {
            await page.focus('textarea, .ant-input');
            await page.type('textarea, .ant-input', 'Test blog post content for Phase 1A testing');
            logTest('Manual Content Input', true, 'Manual content input works');
          }
          
          // Close modal
          const closeButton = await page.$('.ant-modal-close, button:has-text("Cancel"), button:has-text("Close")');
          if (closeButton) {
            await closeButton.click();
            await page.waitForTimeout(1000);
          }
        }
      } catch (error) {
        logTest('Content Upload Modal', false, `Failed to open: ${error.message}`);
      }
    }
    
    // PHASE 6: API Integration Testing (via browser console)
    console.log('\n🔌 PHASE 6: Frontend API Integration Testing');
    console.log('='.repeat(50));
    
    // Test if autoBlogAPI is available in the global scope or can be accessed
    const apiAvailable = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Check if API service is available
        if (window.autoBlogAPI || window.AutoBlogAPI) {
          resolve(true);
        } else {
          // Check if fetch works for a basic health check
          fetch('/health').then(response => {
            resolve(response.ok);
          }).catch(() => {
            resolve(false);
          });
        }
      });
    });
    
    logTest('API Service Integration', apiAvailable, 'Frontend can communicate with backend API');
    
    // PHASE 7: Responsive Design Testing
    console.log('\n📱 PHASE 7: Responsive Design Testing');
    console.log('='.repeat(50));
    
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'mobile-view');
    
    const mobileElementsVisible = await page.evaluate(() => {
      const elements = document.querySelectorAll('.ant-layout, .App, main');
      return Array.from(elements).some(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
    });
    
    logTest('Mobile Responsive Layout', mobileElementsVisible, 'Layout adapts to mobile viewport');
    
    // Reset to desktop viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // PHASE 8: Performance and Load Testing
    console.log('\n⚡ PHASE 8: Performance Testing');
    console.log('='.repeat(50));
    
    // Measure page load performance
    const performanceMetrics = await page.metrics();
    const loadTime = performanceMetrics.TaskDuration || 0;
    
    logTest('Page Load Performance', loadTime < 5000, `Load time: ${Math.round(loadTime)}ms`);
    
    // Check for console errors
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForTimeout(3000);
    
    logTest('Console Errors Check', consoleErrors.length === 0, `Found ${consoleErrors.length} console errors`);
    
    if (consoleErrors.length > 0) {
      testResults.errors.push(...consoleErrors.slice(0, 5)); // Limit to first 5 errors
    }
    
    await takeScreenshot(page, 'final-state');
    
  } catch (error) {
    console.error('❌ Frontend testing failed:', error);
    testResults.errors.push(`Test runner error: ${error.message}`);
    
    if (page) {
      await takeScreenshot(page, 'error-state');
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // FINAL RESULTS
  console.log('\n📊 FRONTEND TEST SUMMARY');
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
  
  if (testResults.screenshots.length > 0) {
    console.log(`\n📸 Screenshots taken: ${testResults.screenshots.length}`);
    testResults.screenshots.forEach(screenshot => {
      console.log(`   • ${screenshot.name}: ${screenshot.filename}`);
    });
  }
  
  console.log('='.repeat(60));
  
  // Save detailed results
  const detailedResults = {
    ...testResults,
    testEnvironment: {
      frontendUrl: FRONTEND_URL,
      testEmail: TEST_EMAIL,
      userAgent: 'Puppeteer Frontend Test',
      viewport: { width: 1280, height: 800 },
      timestamp: new Date().toISOString()
    },
    recommendations: generateFrontendRecommendations()
  };
  
  fs.writeFileSync('./phase1a-frontend-test-results.json', JSON.stringify(detailedResults, null, 2));
  console.log('💾 Detailed results saved to: phase1a-frontend-test-results.json');
  
  return detailedResults;
}

function generateFrontendRecommendations() {
  const recommendations = [];
  
  if (testResults.summary.failed > 0) {
    recommendations.push('Review failed frontend test cases and improve UI/UX');
  }
  
  if (testResults.errors.length > 0) {
    recommendations.push('Fix console errors and JavaScript issues');
  }
  
  if (testResults.summary.passed / testResults.summary.total < 0.8) {
    recommendations.push('Overall frontend success rate below 80% - significant improvements needed');
  }
  
  recommendations.push('Add proper data-testid attributes for better testing');
  recommendations.push('Implement comprehensive error boundaries');
  recommendations.push('Add loading states and user feedback mechanisms');
  recommendations.push('Consider adding automated frontend tests to CI/CD pipeline');
  
  return recommendations;
}

// Check if puppeteer is available
async function checkPuppeteerAvailability() {
  if (puppeteer) {
    return true;
  } else {
    console.log('❌ Puppeteer not available for frontend testing');
    console.log('📦 Install with: npm install puppeteer');
    console.log('🔄 Falling back to basic frontend analysis...\n');
    return false;
  }
}

// Fallback frontend analysis without puppeteer
async function basicFrontendAnalysis() {
  console.log('🔍 Basic Frontend Analysis (Static)');
  console.log('='.repeat(50));
  
  // Check if key frontend files exist
  const frontendFiles = [
    'src/components/Workflow/steps/WebsiteAnalysisStep.js',
    'src/components/Dashboard/ComprehensiveAnalysisTab.js',
    'src/components/ContentUpload/ContentUploadModal.js',
    'src/services/api.js'
  ];
  
  let filesExist = 0;
  for (const file of frontendFiles) {
    try {
      const fullPath = `/Users/jamesfrankel/codebases/Automate My Blog/automate-my-blog-frontend/${file}`;
      if (fs.existsSync(fullPath)) {
        filesExist++;
        logTest(`File Exists: ${file}`, true, 'Component file found');
      } else {
        logTest(`File Exists: ${file}`, false, 'Component file missing');
      }
    } catch (error) {
      logTest(`File Exists: ${file}`, false, error.message);
    }
  }
  
  // Check package.json for required dependencies
  try {
    const packageJsonPath = '/Users/jamesfrankel/codebases/Automate My Blog/automate-my-blog-frontend/package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredDeps = ['react', 'antd', '@ant-design/icons'];
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );
    
    logTest('Required Dependencies', missingDeps.length === 0, 
      missingDeps.length > 0 ? `Missing: ${missingDeps.join(', ')}` : 'All dependencies present');
  } catch (error) {
    logTest('Package.json Analysis', false, error.message);
  }
  
  console.log('\n📊 BASIC FRONTEND ANALYSIS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files Checked: ${frontendFiles.length}`);
  console.log(`✅ Files Found: ${filesExist}`);
  console.log(`❌ Files Missing: ${frontendFiles.length - filesExist}`);
  
  return testResults;
}

// Run tests
if (require.main === module) {
  checkPuppeteerAvailability().then(async (puppeteerAvailable) => {
    try {
      if (puppeteerAvailable) {
        await runFrontendTests();
      } else {
        await basicFrontendAnalysis();
      }
    } catch (error) {
      console.error('Test runner failed:', error);
      process.exit(1);
    }
  });
}

module.exports = { runFrontendTests, basicFrontendAnalysis };