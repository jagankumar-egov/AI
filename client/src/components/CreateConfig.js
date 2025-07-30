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
    category: 'government',
    businessService: '',
    businessServiceSla: ''
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

    // Initialize the configuration with comprehensive details
    const initialConfig = {
      serviceName: formData.serviceName,
      module: formData.module,
      service: formData.service,
      description: formData.description,
      category: formData.category,
      // Pre-configure some basic sections
      workflow: {
        business: formData.businessService || formData.service,
        businessService: formData.serviceName,
        businessServiceSla: formData.businessServiceSla ? parseInt(formData.businessServiceSla) : 72,
        states: []
      },
      bill: {
        BusinessService: formData.service,
        taxHead: [],
        taxPeriod: []
      },
      payment: {
        gateway: "PAYTM"
      },
      access: {
        roles: ["CITIZEN", "EMPLOYEE"],
        permissions: {
          "CITIZEN": ["CREATE", "VIEW"],
          "EMPLOYEE": ["CREATE", "VIEW", "UPDATE", "DELETE"]
        }
      },
      boundary: {
        lowestLevel: "WARD",
        hierarchyType: "ADMIN"
      },
      localization: {
        language: "en_IN",
        currency: "INR",
        dateFormat: "DD/MM/YYYY"
      },
      notification: {
        channels: ["SMS", "EMAIL"],
        templates: {
          "SUBMISSION": "Your application has been submitted successfully.",
          "APPROVAL": "Your application has been approved.",
          "REJECTION": "Your application has been rejected."
        }
      }
    };

    // Set the configuration in the store
    setConfig(initialConfig);
    setServiceName(formData.serviceName);

    toast.success('Configuration created successfully! You can now configure individual sections.');
    
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
      label: 'Service Category',
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
            { value: 'tax', label: 'Tax Service' },
            { value: 'health', label: 'Health Service' },
            { value: 'education', label: 'Education Service' },
            { value: 'transport', label: 'Transport Service' }
          ],
          helperText: 'Select the category that best describes your service'
        }
      ]
    },
    {
      label: 'Initial Configuration',
      description: 'Configure basic settings for your service',
      fields: [
        {
          name: 'businessService',
          label: 'Business Service',
          type: 'text',
          required: false,
          helperText: 'Business service identifier (optional)'
        },
        {
          name: 'businessServiceSla',
          label: 'SLA (Hours)',
          type: 'number',
          required: false,
          helperText: 'Service level agreement in hours (e.g., 72 for 3 days)'
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

    if (field.type === 'number') {
      return (
        <TextField
          fullWidth
          label={field.label}
          value={formData[field.name] || ''}
          onChange={handleInputChange(field.name)}
          required={field.required}
          type="number"
          helperText={field.helperText}
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
                Pre-configured Sections
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The following sections will be pre-configured:
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                <li>Workflow - Basic workflow structure</li>
                <li>Billing - Tax heads and periods</li>
                <li>Payment - Payment gateway settings</li>
                <li>Access Control - Role-based permissions</li>
                <li>Boundary - Geographic boundaries</li>
                <li>Localization - Language and currency</li>
                <li>Notifications - SMS and email templates</li>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Sections
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You can configure these additional sections:
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                <li>Fields - Form fields and validation</li>
                <li>ID Generation - Unique ID patterns</li>
                <li>Rules - Business rules and validation</li>
                <li>Calculator - Fee calculation logic</li>
                <li>Documents - Required document uploads</li>
                <li>PDF - Certificate and receipt templates</li>
                <li>Applicant - Applicant type configuration</li>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreateConfig; 