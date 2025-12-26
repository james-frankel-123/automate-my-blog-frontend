# App.js Dependency Analysis
## Complete Breakdown of 3964-line Monolithic Component

### STATE VARIABLES (28 total)

#### Core Workflow State
1. **currentStep** - Controls workflow progression (0-6)
   - **Used by**: All step rendering logic, progress calculation, useEffect hooks
   - **Dependencies**: Almost every function reads/writes this

2. **websiteUrl** - User's website URL input
   - **Used by**: analyzeWebsite(), completeWebsiteAnalysis(), export functions
   - **Dependencies**: Step 0 input, API calls, export metadata

3. **selectedTopic** - Currently selected topic ID
   - **Used by**: generateContent(), topic rendering, export functions
   - **Dependencies**: Topic selection UI, content generation

4. **generatedContent** - The AI-generated blog content
   - **Used by**: Content editing, preview, export functions, word count calculations
   - **Dependencies**: Content generation, editing, export

5. **isLoading** - General loading state
   - **Used by**: Multiple API calls, loading UI across all steps
   - **Dependencies**: Website analysis, topic generation, content generation

6. **scanningMessage** - Progress message during loading
   - **Used by**: completeWebsiteAnalysis(), loadTrendingTopics(), loading UI
   - **Dependencies**: API call progress updates

#### UI State
7. **editingStep** - Which step is being edited (null = none)
   - **Used by**: Step editing UI, edit step results function
   - **Dependencies**: Edit mode controls

8. **previewMode** - Content preview vs edit mode toggle
   - **Used by**: Content editing step, preview rendering
   - **Dependencies**: Content editing UI

9. **expandedSteps** - Array of expanded step summary IDs
   - **Used by**: Step summary rendering, toggle functions
   - **Dependencies**: Summary expansion UI

#### Analysis & Strategy State
10. **analysisCompleted** - Website analysis completion flag
    - **Used by**: Step 1 UI rendering, progression logic
    - **Dependencies**: completeWebsiteAnalysis() completion

11. **strategyCompleted** - Strategy selection completion flag
    - **Used by**: Step 2-3 progression, UI rendering
    - **Dependencies**: Strategy selection, topic generation

12. **selectedCustomerStrategy** - Selected customer strategy object
    - **Used by**: Topic generation, content customization
    - **Dependencies**: Strategy cards, API calls

13. **strategySelectionCompleted** - Strategy selection completion flag
    - **Used by**: Topic generation triggering
    - **Dependencies**: Strategy selection progression

#### Content Strategy State
14. **postState** - Post state: 'draft', 'exported', 'locked'
    - **Used by**: Export functions, edit permissions
    - **Dependencies**: Export locking logic

15. **contentStrategy** - Content configuration object
    - **Used by**: Content generation, strategy display, modals
    - **Dependencies**: Strategy customization, content generation

16. **customFeedback** - User feedback for regeneration
    - **Used by**: Content regeneration, changes summary
    - **Dependencies**: Regeneration functionality

#### Modal & UI Control State
17. **showStrategyGate** - Strategy customization modal visibility
    - **Used by**: Strategy modal rendering, payment gates
    - **Dependencies**: Strategy customization triggers

18. **showExportWarning** - Export warning modal visibility
    - **Used by**: Export modal rendering, export flow
    - **Dependencies**: Export warnings

19. **showAuthModal** - Authentication modal visibility
    - **Used by**: Auth modal rendering, login gates
    - **Dependencies**: Authentication flow

20. **authContext** - Authentication context (gate vs nav)
    - **Used by**: Auth modal, login flow
    - **Dependencies**: Login context tracking

#### Content Management State
21. **previousContent** - Content before regeneration
    - **Used by**: Changes tracking, regeneration comparison
    - **Dependencies**: Content regeneration features

22. **showChanges** - Show changes summary flag
    - **Used by**: Changes summary rendering
    - **Dependencies**: Content regeneration UI

#### Business Logic State
23. **blogGenerating** - Blog generation in progress flag
    - **Used by**: Content generation UI, loading states
    - **Dependencies**: generateContent() API calls

24. **selectedCMS** - Selected CMS platform
    - **Used by**: Export functions, CMS integration
    - **Dependencies**: CMS selection, export logic

#### Research & Enhancement State
25. **webSearchInsights** - Web search research results
    - **Used by**: Analysis quality indicators, topic enhancement
    - **Dependencies**: Website analysis, topic generation

26. **demoMode** - Demo mode bypass flag
    - **Used by**: Payment gate bypassing, demo functionality
    - **Dependencies**: Demo controls, payment gates

#### Data Storage State
27. **stepResults** - Complete analysis and topic data
    - **Used by**: ALL UI rendering, business logic, API calls
    - **Dependencies**: Almost every function - this is the central data store

### MAJOR FUNCTIONS & THEIR DEPENDENCIES

#### Core API Functions
1. **completeWebsiteAnalysis()**
   - **Reads**: websiteUrl, isLoading
   - **Writes**: scanningMessage, isLoading, stepResults, webSearchInsights, analysisCompleted
   - **Calls**: autoBlogAPI.analyzeWebsite()
   - **UI Impact**: Step 1 rendering, business overview

2. **loadTrendingTopics()**
   - **Reads**: stepResults, currentStep
   - **Writes**: scanningMessage, isLoading
   - **Calls**: proceedWithTopicGeneration()
   - **UI Impact**: Step 3 topic loading

3. **proceedWithTopicGeneration()**
   - **Reads**: stepResults, selectedCustomerStrategy, webSearchInsights
   - **Writes**: isLoading, scanningMessage, stepResults, strategyCompleted
   - **Calls**: autoBlogAPI.getTrendingTopics()
   - **UI Impact**: Step 3 topic cards

4. **generateContent(topicId)**
   - **Reads**: demoMode, selectedTopic, stepResults, selectedCustomerStrategy, webSearchInsights
   - **Writes**: selectedTopic, isLoading, blogGenerating, scanningMessage, currentStep, stepResults, generatedContent, previewMode
   - **Calls**: autoBlogAPI.generateContent()
   - **UI Impact**: Step 4-5 content generation and editing

#### UI Helper Functions
5. **requireAuth(action, context)**
   - **Reads**: user, showAuthModal, authContext
   - **Writes**: authContext, showAuthModal
   - **UI Impact**: Authentication gates throughout workflow

6. **analyzeWebsite()**
   - **Reads**: websiteUrl
   - **Writes**: websiteUrl, currentStep
   - **UI Impact**: Step 0 to Step 1 progression

7. **resetDemo()**
   - **Writes**: Reloads entire page
   - **UI Impact**: Complete workflow reset

#### Export Functions
8. **exportAsMarkdown(), exportAsHTML(), exportAsJSON()**
   - **Reads**: selectedTopic, generatedContent, stepResults
   - **Writes**: postState, previewMode
   - **Calls**: getCurrentPost(), downloadFile()
   - **UI Impact**: Step 6 export functionality

9. **getCurrentPost()**
   - **Reads**: stepResults, selectedTopic, generatedContent
   - **Returns**: Complete post object for export
   - **Dependencies**: Export functions, post metadata

#### Content Management Functions
10. **handleContentChange(e)**
    - **Reads**: e.target.value
    - **Writes**: generatedContent
    - **UI Impact**: Content editing in Step 5

11. **getStrategyDisplayText(type, value)**
    - **Reads**: type, value parameters
    - **Returns**: Human-readable strategy text
    - **Dependencies**: Strategy display throughout UI

### UI RENDERING DEPENDENCIES

#### Massive JSX Sections (2000+ lines)
1. **Authentication Header (lines 1804-1855)**
   - **Depends**: user, showAuthModal, authContext

2. **Hero Section (lines 1900-1953)**
   - **Depends**: currentStep, websiteUrl, analyzeWebsite()

3. **Progress Steps (lines 1956-2010)**
   - **Depends**: currentStep, steps array, user

4. **Step 0: Website Input (lines 1909-1941)**
   - **Depends**: websiteUrl, analyzeWebsite()

5. **Step 1: Website Analysis (lines ~2020-2080)**
   - **Depends**: currentStep, isLoading, scanningMessage, analysisCompleted, stepResults

6. **Step 2: Customer Strategy (lines 2082-2410)**
   - **Depends**: currentStep, stepResults, webSearchInsights, selectedCustomerStrategy

7. **Step 3: Topic Selection (lines 2410-3020)**
   - **Depends**: currentStep, strategyCompleted, isLoading, stepResults, webSearchInsights

8. **Step 4: Content Generation (lines 3022-3074)**
   - **Depends**: currentStep, blogGenerating, stepResults

9. **Step 5: Content Editing (lines 3075-3462)**
   - **Depends**: currentStep, blogGenerating, generatedContent, previewMode, user, stepResults

10. **Step 6: Export (lines 3463-3600)**
    - **Depends**: currentStep, stepResults, selectedCMS, generatedContent, getCurrentPost()

#### Modal Components
11. **Strategy Gate Modal**
    - **Depends**: showStrategyGate, contentStrategy, getStrategyDisplayText(), demoMode

12. **Export Warning Modal**
    - **Depends**: showExportWarning, currentStep

13. **Auth Modal**
    - **Depends**: showAuthModal, authContext

### CRITICAL DEPENDENCIES & COUPLING POINTS

1. **stepResults** - Central data store used by 90% of functions
2. **currentStep** - Controls entire workflow flow, used everywhere
3. **user + requireAuth()** - Authentication gates throughout workflow
4. **isLoading + scanningMessage** - Loading states across multiple steps
5. **API Functions** - Complex interdependencies with state management

### LOGICAL SEPARATION BOUNDARIES

#### High Cohesion, Low Coupling Candidates:
1. **Export Functionality** - Self-contained with clear inputs/outputs
2. **Authentication Logic** - Mostly isolated auth flow
3. **Individual Step UIs** - Each step has distinct UI but shares state
4. **API Service Layer** - Can be extracted with consistent interfaces
5. **Utility Functions** - Pure functions without side effects

#### High Coupling Areas (Require Careful Planning):
1. **State Management** - 28 interconnected variables
2. **Workflow Progression** - currentStep controls entire flow  
3. **stepResults Management** - Core data dependencies
4. **Loading States** - Shared across multiple async operations

This analysis reveals why piecemeal extraction failed - the tight coupling requires a systematic state architecture redesign before component extraction can succeed.