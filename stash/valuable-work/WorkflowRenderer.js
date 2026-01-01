import React, { useState } from 'react';
import { message } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import { useTabMode } from '../../hooks/useTabMode';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext';
import ModeToggle from './ModeToggle';
import WebsiteAnalysisStep from './steps/WebsiteAnalysisStep-v2';
import CustomerStrategyStep from './steps/CustomerStrategyStep-v2';
import TopicSelectionStep from './steps/TopicSelectionStep-v2';
import ContentGenerationStep from './steps/ContentGenerationStep-v2';
import ContentEditingStep from './steps/ContentEditingStep-v2';
import ExportStep from './steps/ExportStep-v2';
import AuthModal from '../Auth/AuthModal';

/**
 * WorkflowRenderer - Unified workflow component with all steps
 * Extracted from DashboardTab to be reusable across different contexts
 */
const WorkflowRenderer = () => {
  const { user } = useAuth();
  const tabMode = useTabMode('dashboard');
  const workflowMode = useWorkflowMode();
  
  // Authentication state for logged-out users
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authContext, setAuthContext] = useState(null);

  // Prepare step data for workflow
  const prepareStepData = () => ({
    selectedAction: 'create-post',
    timestamp: new Date().toISOString()
  });

  // Check if we should show workflow content
  const isInWorkflowMode = tabMode.mode === 'workflow';

  if (isInWorkflowMode) {
    return (
      <div>
        {/* Mode Toggle for workflow mode */}
        <ModeToggle
          mode={tabMode.mode}
          tabKey="dashboard"
          workflowStep={tabMode.workflowStep}
          showModeToggle={tabMode.showModeToggle}
          showWorkflowNavigation={tabMode.showWorkflowNavigation}
          showNextButton={tabMode.showNextButton}
          showPreviousButton={tabMode.showPreviousButton}
          nextButtonText={tabMode.nextButtonText}
          previousButtonText={tabMode.previousButtonText}
          canEnterWorkflow={tabMode.canEnterWorkflow}
          onEnterWorkflowMode={tabMode.enterWorkflowMode}
          onExitToFocusMode={tabMode.exitToFocusMode}
          onContinueToNextStep={tabMode.continueToNextStep}
          onGoToPreviousStep={tabMode.goToPreviousStep}
          onSaveStepData={tabMode.saveStepData}
          stepData={prepareStepData()}
        />
        
        {/* Website Analysis Step - uses unified workflow state */}
        <WebsiteAnalysisStep 
          {...workflowMode}
          user={user}
          embedded={true}
          performWebsiteAnalysis={async () => {
            try {
              // Set loading state
              workflowMode.setIsLoading(true);
              workflowMode.setScanningMessage('Analyzing your website...');
              workflowMode.advanceStep(1);
              
              // Simulate website analysis (in real implementation, this would call the API)
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Update analysis results with sample data
              const sampleAnalysis = {
                businessName: 'Your Business',
                businessType: 'Professional Services',
                targetAudience: 'Business professionals',
                contentFocus: 'Industry expertise and thought leadership',
                brandVoice: 'Professional and informative',
                description: 'A professional services business focused on delivering expert solutions',
                brandColors: {
                  primary: '#6B8CAE',
                  secondary: '#F4E5D3',
                  accent: '#8FBC8F'
                }
              };
              
              workflowMode.updateWebsiteAnalysis(sampleAnalysis);
              workflowMode.setAnalysisCompleted(true);
              workflowMode.setIsLoading(false);
              
              message.success('Website analysis completed! Ready to continue to audience selection.');
              
              // Auto-advance to next step after a brief delay
              setTimeout(() => {
                tabMode.continueToNextStep();
              }, 1500);
              
            } catch (error) {
              workflowMode.setIsLoading(false);
              message.error('Analysis failed. Please try again.');
            }
          }}
          setNavContext={() => {
            // Navigation context for logged-in users
            if (user) {
              // Navigate to dashboard view  
            }
          }}
        />
        
        {/* Additional Workflow Steps - Rendered based on current step */}
        {workflowMode.currentWorkflowStep >= 1 && (
          <CustomerStrategyStep 
            {...workflowMode}
            user={user}
            embedded={true}
            onStrategySelected={(strategy) => {
              workflowMode.updateCustomerStrategy(strategy);
              message.success('Customer strategy selected! Moving to topic selection.');
              setTimeout(() => {
                tabMode.continueToNextStep();
              }, 1000);
            }}
          />
        )}
        
        {workflowMode.currentWorkflowStep >= 2 && (
          <TopicSelectionStep 
            {...workflowMode}
            user={user}
            embedded={true}
            onTopicSelected={(topic) => {
              workflowMode.setSelectedTopic(topic);
              message.success('Topic selected! Generating content...');
              setTimeout(() => {
                tabMode.continueToNextStep();
              }, 1000);
            }}
          />
        )}
        
        {workflowMode.currentWorkflowStep >= 3 && (
          <ContentGenerationStep 
            {...workflowMode}
            user={user}
            embedded={true}
            onContentGenerated={(content) => {
              workflowMode.setGeneratedContent(content);
              message.success('Content generated! Ready for editing.');
              setTimeout(() => {
                tabMode.continueToNextStep();
              }, 1000);
            }}
          />
        )}
        
        {workflowMode.currentWorkflowStep >= 4 && (
          <ContentEditingStep 
            {...workflowMode}
            user={user}
            embedded={true}
            onContentSaved={(editedContent) => {
              workflowMode.setGeneratedContent(editedContent);
              message.success('Content saved! Ready for export.');
              setTimeout(() => {
                tabMode.continueToNextStep();
              }, 1000);
            }}
          />
        )}
        
        {workflowMode.currentWorkflowStep >= 5 && (
          <ExportStep 
            {...workflowMode}
            user={user}
            embedded={true}
            onExportComplete={() => {
              message.success('Content exported successfully!');
              if (!user) {
                message.info('Sign up for more features and content management!');
              }
            }}
          />
        )}

        {/* Authentication Modal for logged-out users */}
        {!user && (
          <AuthModal 
            open={showAuthModal}
            onClose={() => {
              setShowAuthModal(false);
              setAuthContext(null);
            }}
            context={authContext}
            onSuccess={() => {
              // Restore workflow state after successful authentication
              setTimeout(() => {
                workflowMode.restoreWorkflowState();
              }, 100); // Small delay to ensure auth context is updated
            }}
          />
        )}
      </div>
    );
  }

  // If not in workflow mode, return null (content will be shown in appropriate tabs)
  return null;
};

export default WorkflowRenderer;