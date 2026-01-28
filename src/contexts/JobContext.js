import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import autoBlogAPI from '../services/api';

const JobContext = createContext();

/**
 * JobContext - Manages job progress tracking with polling
 * 
 * Features:
 * - Polls job status every 2-3 seconds
 * - Stores active jobs in localStorage for resumption
 * - Provides job status updates to components
 * - Handles job cancellation and retry
 */
export const JobProvider = ({ children }) => {
  const [activeJobs, setActiveJobs] = useState({});
  const [jobPollingIntervals, setJobPollingIntervals] = useState({});

  // Load active jobs from localStorage on mount
  useEffect(() => {
    const storedJobs = localStorage.getItem('activeJobs');
    if (storedJobs) {
      try {
        const jobs = JSON.parse(storedJobs);
        // Resume polling for incomplete jobs
        Object.keys(jobs).forEach(jobId => {
          const job = jobs[jobId];
          if (job.status === 'queued' || job.status === 'running') {
            startPolling(jobId, job.type);
          }
        });
        setActiveJobs(jobs);
      } catch (error) {
        console.error('Failed to load active jobs from localStorage:', error);
        localStorage.removeItem('activeJobs');
      }
    }
  }, []);

  // Save active jobs to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(activeJobs).length > 0) {
      localStorage.setItem('activeJobs', JSON.stringify(activeJobs));
    } else {
      localStorage.removeItem('activeJobs');
    }
  }, [activeJobs]);

  /**
   * Start a new job and begin polling
   */
  const startJob = useCallback((jobId, jobType, initialData = {}) => {
    const newJob = {
      jobId,
      type: jobType,
      status: 'queued',
      progress: 0,
      currentStep: 'Initializing...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...initialData
    };

    setActiveJobs(prev => ({
      ...prev,
      [jobId]: newJob
    }));

    startPolling(jobId, jobType);
    return jobId;
  }, []);

  /**
   * Start polling for a job's status
   */
  const startPolling = useCallback((jobId, jobType) => {
    // Clear any existing polling interval
    if (jobPollingIntervals[jobId]) {
      clearInterval(jobPollingIntervals[jobId]);
    }

    // Poll every 2-3 seconds (randomized to avoid thundering herd)
    const pollInterval = 2000 + Math.random() * 1000;
    
    const intervalId = setInterval(async () => {
      try {
        const status = await autoBlogAPI.getJobStatus(jobId);
        
        setActiveJobs(prev => {
          const updated = {
            ...prev,
            [jobId]: {
              ...prev[jobId],
              ...status,
              updatedAt: new Date().toISOString()
            }
          };

          // Stop polling if job is complete
          if (status.status === 'succeeded' || status.status === 'failed') {
            if (jobPollingIntervals[jobId]) {
              clearInterval(jobPollingIntervals[jobId]);
            }
            setJobPollingIntervals(prev => {
              const next = { ...prev };
              delete next[jobId];
              return next;
            });
          }

          return updated;
        });
      } catch (error) {
        console.error(`Error polling job ${jobId}:`, error);
        // On error, mark job as failed
        setActiveJobs(prev => ({
          ...prev,
          [jobId]: {
            ...prev[jobId],
            status: 'failed',
            error: error.message,
            updatedAt: new Date().toISOString()
          }
        }));
        
        // Stop polling on error
        if (jobPollingIntervals[jobId]) {
          clearInterval(jobPollingIntervals[jobId]);
        }
        setJobPollingIntervals(prev => {
          const next = { ...prev };
          delete next[jobId];
          return next;
        });
      }
    }, pollInterval);

    setJobPollingIntervals(prev => ({
      ...prev,
      [jobId]: intervalId
    }));
  }, [jobPollingIntervals]);

  /**
   * Cancel a running job
   */
  const cancelJob = useCallback(async (jobId) => {
    try {
      await autoBlogAPI.cancelJob(jobId);
      
      // Stop polling
      if (jobPollingIntervals[jobId]) {
        clearInterval(jobPollingIntervals[jobId]);
      }
      setJobPollingIntervals(prev => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });

      // Update job status
      setActiveJobs(prev => ({
        ...prev,
        [jobId]: {
          ...prev[jobId],
          status: 'failed',
          error: 'Job cancelled by user',
          updatedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error(`Error cancelling job ${jobId}:`, error);
      throw error;
    }
  }, [jobPollingIntervals]);

  /**
   * Retry a failed job
   */
  const retryJob = useCallback(async (jobId) => {
    try {
      const result = await autoBlogAPI.retryJob(jobId);
      const newJobId = result.jobId || jobId;
      
      // Start polling for the retried job
      const job = activeJobs[jobId];
      if (job) {
        startJob(newJobId, job.type, {
          ...job,
          status: 'queued',
          progress: 0,
          error: null
        });
      }
      
      return newJobId;
    } catch (error) {
      console.error(`Error retrying job ${jobId}:`, error);
      throw error;
    }
  }, [activeJobs, startJob]);

  /**
   * Remove a job from tracking
   */
  const removeJob = useCallback((jobId) => {
    // Stop polling
    if (jobPollingIntervals[jobId]) {
      clearInterval(jobPollingIntervals[jobId]);
    }
    setJobPollingIntervals(prev => {
      const next = { ...prev };
      delete next[jobId];
      return next;
    });

    // Remove from state
    setActiveJobs(prev => {
      const next = { ...prev };
      delete next[jobId];
      return next;
    });
  }, [jobPollingIntervals]);

  /**
   * Get active jobs count
   */
  const getActiveJobsCount = useCallback(() => {
    return Object.values(activeJobs).filter(
      job => job.status === 'queued' || job.status === 'running'
    ).length;
  }, [activeJobs]);

  /**
   * Get jobs by type
   */
  const getJobsByType = useCallback((type) => {
    return Object.values(activeJobs).filter(job => job.type === type);
  }, [activeJobs]);

  const value = {
    activeJobs,
    startJob,
    cancelJob,
    retryJob,
    removeJob,
    getActiveJobsCount,
    getJobsByType,
    getJob: (jobId) => activeJobs[jobId]
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};

export const useJob = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJob must be used within a JobProvider');
  }
  return context;
};

export default JobContext;
