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
  CardActions,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
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
  const [formData, setFormData] = useState({
    serviceName: '',
    module: '',
    service: '',
    description: '',
    category: 'government'
  });

  // Fetch available sections for reference
  const { data: sections } = useQuery(
    'sections',
    () => configAPI.getDocs(),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCreate = () => {
    // Validate required fields
    if (!formData.serviceName || !formData.module || !formData.service) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Initialize the configuration with basic details
    const initialConfig = {
      serviceName: formData.serviceName,
      module: formData.module,
      service: formData.service,
      description: formData.description,
      category: formData.category
    };

    // Set the configuration in the store
    setConfig(initialConfig);
    setServiceName(formData.serviceName);

    toast.success('Configuration created successfully!');
    
    // Navigate to the stepper to continue configuration
    navigate('/');
  };

  const steps = [
    {
      label: 'Basic Information',
      description: 'Enter the basic details for your service configuration',
      fields: [
        {
          name: 'serviceName',
          label: 'Service Name',
          type: 'text',
          required: true,
          helperText: 'Enter a unique name for your service (e.g., Trade License, Property Tax)'
        },
        {
          name: 'description',
          label: 'Description',
          type: 'text',
          required: false,
          multiline: true,
          rows: 3,
          helperText: 'Brief description of what this service does'
        }
      ]
    },
    {
      label: 'Module & Service Details',
      description: 'Configure the module and service identifiers',
      fields: [
        {
          name: 'module',
          label: 'Module',
          type: 'text',
          required: true,
          helperText: 'Enter the module name (e.g., tradelicence, propertytax)'
        },
        {
          name: 'service',
          label: 'Service',
          type: 'text',
          required: true,
          helperText: 'Enter the service identifier (e.g., TradeLicense, PropertyTax)'
        }
      ]
    },
    {
      label: 'Category & Type',
      description: 'Select the category and type of service',
      fields: [
        {
          name: 'category',
          label: 'Category',
          type: 'select',
          required: true,
          options: [
            { value: 'government', label: 'Government Service' },
            { value: 'utility', label: 'Utility Service' },
            { value: 'licensing', label: 'Licensing Service' },
            { value: 'certificate', label: 'Certificate Service' },
            { value: 'tax', label: 'Tax Service' }
          ],
          helperText: 'Select the category that best describes your service'
        }
      ]
    }
  ];

  const renderField = (field) => {
    if (field.type === 'select') {
      return (
        <FormControl fullWidth required={field.required}>
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
          {field.helperText && (
            <FormHelperText>{field.helperText}</FormHelperText>
          )}
        </FormControl>
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
        helperText={field.helperText}
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
          {steps.map((step, index) => (
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
                    onClick={index === steps.length - 1 ? handleCreate : handleNext}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    {index === steps.length - 1 ? 'Create Configuration' : 'Continue'}
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
                Required Sections
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The following sections will be automatically enabled:
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                <li>Module - Basic module information</li>
                <li>Service - Service name and details</li>
                <li>Fields - Form fields configuration</li>
                <li>ID Generation - ID generation rules</li>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Next Steps
              </Typography>
              <Typography variant="body2" color="text.secondary">
                After creating the configuration, you can:
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                <li>Configure form fields and validation</li>
                <li>Set up workflow states and transitions</li>
                <li>Configure billing and payment settings</li>
                <li>Add business rules and calculations</li>
                <li>Export the final configuration</li>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreateConfig; 