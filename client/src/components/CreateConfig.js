import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useConfigStore } from '../stores/configStore';
import { useQuery } from 'react-query';
import { configAPI } from '../services/api';
import toast from 'react-hot-toast';

const CreateConfig = () => {
  const navigate = useNavigate();
  const { setConfig, setServiceName } = useConfigStore();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch creation requirements from server
  const { data: requirements, isLoading, error } = useQuery(
    'createRequirements',
    () => configAPI.getCreateRequirements(),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const handleInputChange = (fieldName) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };

  const validateField = (fieldName, value, validation) => {
    if (!validation) return null;
    
    if (validation.required && !value) {
      return 'This field is required';
    }
    
    if (validation.minLength && value.length < validation.minLength) {
      return `Minimum length is ${validation.minLength} characters`;
    }
    
    if (validation.maxLength && value.length > validation.maxLength) {
      return `Maximum length is ${validation.maxLength} characters`;
    }
    
    if (validation.min && Number(value) < validation.min) {
      return `Minimum value is ${validation.min}`;
    }
    
    if (validation.max && Number(value) > validation.max) {
      return `Maximum value is ${validation.max}`;
    }
    
    if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
      return 'Invalid format';
    }
    
    return null;
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCreate = () => {
    if (!requirements) return;

    // Validate all required fields
    const errors = {};
    let hasErrors = false;

    requirements.steps.forEach(step => {
      step.fields.forEach(field => {
        const value = formData[field.name];
        const validation = requirements.validation[field.name];
        
        if (validation) {
          const error = validateField(field.name, value, { ...field, ...validation });
          if (error) {
            errors[field.name] = error;
            hasErrors = true;
          }
        } else if (field.required && !value) {
          errors[field.name] = 'This field is required';
          hasErrors = true;
        }
      });
    });

    if (hasErrors) {
      setValidationErrors(errors);
      toast.error('Please fix the validation errors');
      return;
    }

    // Process pre-configured sections with template variables
    const processedConfig = {};
    Object.keys(requirements.preConfiguredSections).forEach(sectionName => {
      const sectionConfig = requirements.preConfiguredSections[sectionName];
      processedConfig[sectionName] = processTemplateVariables(sectionConfig, formData);
    });

    // Create the final configuration
    const initialConfig = {
      serviceName: formData.serviceName,
      module: formData.module,
      service: formData.service,
      description: formData.description,
      category: formData.category,
      ...processedConfig
    };

    // Set the configuration in the store
    setConfig(initialConfig);
    setServiceName(formData.serviceName);

    toast.success('Configuration created successfully! You can now configure individual sections.');
    
    // Navigate to the stepper to continue configuration
    navigate('/');
  };

  const processTemplateVariables = (config, formData) => {
    if (typeof config === 'string') {
      return config.replace(/\${(\w+)}/g, (match, key) => {
        return formData[key] || match;
      });
    } else if (typeof config === 'object' && config !== null) {
      if (Array.isArray(config)) {
        return config.map(item => processTemplateVariables(item, formData));
      } else {
        const processed = {};
        Object.keys(config).forEach(key => {
          processed[key] = processTemplateVariables(config[key], formData);
        });
        return processed;
      }
    }
    return config;
  };

  // Show loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load configuration requirements: {error.message}
      </Alert>
    );
  }

  // Show form only when requirements are loaded
  if (!requirements) {
    return null;
  }

  const renderField = (field) => {
    const error = validationErrors[field.name];
    
    if (field.type === 'select') {
      return (
        <FormControl fullWidth required={field.required} error={!!error}>
          <InputLabel>{field.label}</InputLabel>
          <Select
            value={formData[field.name] || ''}
            onChange={handleInputChange(field.name)}
            label={field.label}
          >
            {field.options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {(field.helperText || error) && (
            <FormHelperText>{error || field.helperText}</FormHelperText>
          )}
        </FormControl>
      );
    }

    if (field.type === 'number') {
      return (
        <TextField
          fullWidth
          label={field.label}
          value={formData[field.name] || ''}
          onChange={handleInputChange(field.name)}
          required={field.required}
          type="number"
          error={!!error}
          helperText={error || field.helperText}
          variant="outlined"
        />
      );
    }

    return (
      <TextField
        fullWidth
        label={field.label}
        value={formData[field.name] || ''}
        onChange={handleInputChange(field.name)}
        required={field.required}
        multiline={field.multiline}
        rows={field.rows}
        error={!!error}
        helperText={error || field.helperText}
        variant="outlined"
      />
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create New Service Configuration
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Set up a new service configuration by providing the basic details. You can then configure individual sections in the next step.
        </Typography>

        <Stepper activeStep={activeStep} orientation="vertical">
          {requirements.steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {step.description}
                </Typography>
                
                <Grid container spacing={2}>
                  {step.fields.map((field) => (
                    <Grid item xs={12} key={field.name}>
                      {renderField(field)}
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={index === requirements.steps.length - 1 ? handleCreate : handleNext}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    {index === requirements.steps.length - 1 ? 'Create Configuration' : 'Continue'}
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
      </Paper>

      {/* Information Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {requirements.informationCards.preConfigured.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {requirements.informationCards.preConfigured.description}
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                {requirements.informationCards.preConfigured.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {requirements.informationCards.available.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {requirements.informationCards.available.description}
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                {requirements.informationCards.available.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreateConfig; 