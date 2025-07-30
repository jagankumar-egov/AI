import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import { useQuery } from 'react-query';
import { Add as AddIcon } from '@mui/icons-material';

import { useConfigStore } from '../stores/configStore';
import { configAPI } from '../services/api';
import SectionForm from './SectionForm';
import ConfigPreview from './ConfigPreview';
import ExportDialog from './ExportDialog';

const ConfigStepper = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const { config, setConfig, addSection, removeSection } = useConfigStore();

  // Fetch available sections
  const { data: sections, isLoading, error } = useQuery(
    'sections',
    () => configAPI.getDocs(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch section order from server
  const { data: sectionOrderData } = useQuery(
    'sectionOrder',
    () => configAPI.getSectionOrder(),
    { 
      staleTime: 0, // Always fetch fresh data
      refetchOnMount: true,
      refetchOnWindowFocus: true
    }
  );

  const sectionOrder = sectionOrderData?.order || [];
  const requiredSections = sectionOrderData?.required || [];
  const availableSections = sections?.sections || [];

  // Debug log to see the order
  console.log('Section order from server:', sectionOrder);
  console.log('Required sections:', requiredSections);
  console.log('Available sections:', availableSections.map(s => s.name));

  // Order sections according to sectionOrder
  const orderedSections = sectionOrder.length > 0
    ? sectionOrder
        .map(name => availableSections.find(sec => sec.name === name))
        .filter(Boolean)
    : availableSections;
  
  console.log('Ordered sections:', orderedSections.map(s => s.name));
  const enabledSections = Object.keys(config).filter(key => key !== 'serviceName');

  // Auto-enable required sections
  useEffect(() => {
    if (requiredSections.length > 0) {
      requiredSections.forEach(sectionName => {
        if (!enabledSections.includes(sectionName)) {
          addSection(sectionName);
        }
      });
    }
  }, [requiredSections, enabledSections, addSection]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setConfig({});
  };

  const handleSectionToggle = (sectionName, enabled) => {
    // Don't allow disabling required sections
    if (requiredSections.includes(sectionName) && !enabled) {
      return;
    }
    
    if (enabled) {
      addSection(sectionName);
    } else {
      removeSection(sectionName);
    }
  };

  const handleExport = () => {
    setExportDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load configuration sections: {error.message}
      </Alert>
    );
  }

  // Show create configuration option if no configuration exists
  if (!config || Object.keys(config).length === 0) {
    return (
      <Box>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Welcome to Service Configuration Generator
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Create a new service configuration to get started. You can configure form fields, workflow states, billing, and more.
          </Typography>
          
          <Card sx={{ maxWidth: 600, mx: 'auto' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Create New Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Start by creating a new service configuration with basic details like service name, module, and description.
              </Typography>
              
              <Box component="ul" sx={{ mb: 3, pl: 2 }}>
                <li>Configure basic service information</li>
                <li>Set up form fields and validation</li>
                <li>Define workflow states and transitions</li>
                <li>Configure billing and payment settings</li>
                <li>Export the final configuration</li>
              </Box>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/create')}
                size="large"
              >
                Create New Configuration
              </Button>
            </CardActions>
          </Card>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Service Configuration Generator
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Configure your service step by step. Each section can be enabled or disabled based on your needs.
        </Typography>

        <Stepper activeStep={activeStep} orientation="vertical">
          {orderedSections.map((section, index) => (
                          <Step key={section.name}>
                <StepLabel
                  optional={
                    <Typography variant="caption" color="text.secondary">
                      {requiredSections.includes(section.name) ? 'Required' : 'Optional'}
                    </Typography>
                  }
                >
                  {section.name}
                </StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {section.description}
                  </Typography>
                  
                  <SectionForm
                    section={section.name}
                    enabled={enabledSections.includes(section.name)}
                    isRequired={requiredSections.includes(section.name)}
                    onToggle={(enabled) => handleSectionToggle(section.name, enabled)}
                    onComplete={() => {
                      if (index < orderedSections.length - 1) {
                        handleNext();
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                    disabled={index === orderedSections.length - 1}
                  >
                    {index === orderedSections.length - 1 ? 'Finish' : 'Continue'}
                  </Button>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {activeStep === orderedSections.length && (
          <Paper square elevation={0} sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>
              Configuration Complete
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              All steps completed - your configuration is ready!
            </Typography>
            <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
              Reset
            </Button>
            <Button
              variant="contained"
              onClick={handleExport}
              sx={{ mt: 1, mr: 1 }}
            >
              Export Configuration
            </Button>
          </Paper>
        )}
      </Paper>

      {enabledSections.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Configuration Preview
          </Typography>
          <ConfigPreview config={config} />
        </Paper>
      )}

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        config={config}
      />
    </Box>
  );
};

export default ConfigStepper; 