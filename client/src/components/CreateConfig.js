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
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useConfigStore } from '../stores/configStore';
import { useQuery } from 'react-query';
import { configAPI } from '../services/api';
import toast from 'react-hot-toast';
import MonacoEditor from './MonacoEditor';

const CreateConfig = () => {
  const navigate = useNavigate();
  const { setConfig, setServiceName } = useConfigStore();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [enabledOptionalFields, setEnabledOptionalFields] = useState({});
  const [guidedQuestionStates, setGuidedQuestionStates] = useState({});

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

  const handleOptionalFieldToggle = (fieldName) => (event) => {
    const enabled = event.target.checked;
    setEnabledOptionalFields(prev => ({
      ...prev,
      [fieldName]: enabled
    }));
    
    // Clear field data if disabled
    if (!enabled) {
      setFormData(prev => {
        const newData = { ...prev };
        delete newData[fieldName];
        return newData;
      });
    }
  };

  const validateField = (fieldName, value, validation) => {
    if (!validation) return null;
    
    if (validation.required && !value) {
      return 'This field is required';
    }
    
    // Validate JSON fields
    if (validation.type === 'json' || fieldName.includes('json')) {
      try {
        if (value && value.trim() !== '') {
          JSON.parse(value);
        }
      } catch (e) {
        return 'Invalid JSON format';
      }
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
        const isOptional = field.isOptional;
        const isEnabled = isOptional ? enabledOptionalFields[field.name] : true;
        
        // Only validate if field is enabled (for optional fields)
        if (isEnabled) {
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
        }
      });
    });

    if (hasErrors) {
      setValidationErrors(errors);
      toast.error('Please fix the validation errors');
      return;
    }

    // Process JSON fields from form data
    const processedFormData = processJsonFields(formData);
    
    // Process pre-configured sections with template variables
    const processedConfig = {};
    Object.keys(requirements.preConfiguredSections).forEach(sectionName => {
      const sectionConfig = requirements.preConfiguredSections[sectionName];
      processedConfig[sectionName] = processTemplateVariables(sectionConfig, processedFormData);
    });

    // Create the final configuration using only schema fields
    const initialConfig = {
      ...processedFormData,  // Include all processed form data from schema fields
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

  const processJsonFields = (formData) => {
    const processed = { ...formData };
    
    // Process JSON fields
    Object.keys(processed).forEach(key => {
      if (typeof processed[key] === 'string' && processed[key].trim().startsWith('{')) {
        try {
          processed[key] = JSON.parse(processed[key]);
        } catch (e) {
          // Keep as string if JSON parsing fails
          console.warn(`Failed to parse JSON for field ${key}:`, e);
        }
      }
    });
    
    return processed;
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
    const isOptional = field.isOptional;
    const isEnabled = isOptional ? enabledOptionalFields[field.name] : true;
    
    // For optional fields, show toggle first
    if (isOptional) {
      return (
        <Box>
          <Box display="flex" alignItems="center" mb={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={isEnabled}
                  onChange={handleOptionalFieldToggle(field.name)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle1">
                    {field.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {field.helperText}
                  </Typography>
                </Box>
              }
            />
          </Box>
          
          {isEnabled && (
            <Box ml={4}>
              {renderFieldContent(field)}
            </Box>
          )}
        </Box>
      );
    }
    
    return renderFieldContent(field);
  };

  const renderFieldContent = (field) => {
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

    if (field.type === 'json') {
      return renderGuidedJsonField(field);
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

  const renderGuidedJsonField = (field) => {
    const error = validationErrors[field.name];
    const schema = field.validation?.schema;
    const guidedQuestions = schema?.guidedQuestions;
    
    if (guidedQuestions) {
      return renderGuidedQuestions(field, guidedQuestions);
    }
    
    // Fallback to JSON editor if no guided questions
    const example = schema?.example;
    
    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {field.label} {field.required && '*'}
        </Typography>
        
        {schema && (
          <Box mb={2} p={2} bgcolor="grey.50" borderRadius={1}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              <strong>Expected Structure:</strong>
            </Typography>
            <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(example, null, 2)}
            </Typography>
          </Box>
        )}
        
        <MonacoEditor
          height="200px"
          language="json"
          value={formData[field.name] || '{}'}
          onChange={(value) => handleInputChange(field.name)({ target: { value } })}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 12,
          }}
        />
        {(field.helperText || error) && (
          <FormHelperText error={!!error}>
            {error || field.helperText}
          </FormHelperText>
        )}
      </Box>
    );
  };

  const renderGuidedQuestions = (field, questions) => {
    const fieldKey = field.name;
    const currentState = guidedQuestionStates[fieldKey] || { currentIndex: 0, answers: {} };
    const currentQuestion = questions[currentState.currentIndex];
    const isLastQuestion = currentState.currentIndex === questions.length - 1;
    
    const handleAnswer = async (answer) => {
      const newAnswers = { ...currentState.answers, [currentQuestion.id]: answer };
      const newState = { ...currentState, answers: newAnswers };
      
      if (isLastQuestion) {
        // Generate JSON from answers
        const generatedJson = await generateJsonFromAnswers(field.name, questions, newAnswers);
        handleInputChange(field.name)({ target: { value: JSON.stringify(generatedJson, null, 2) } });
      } else {
        newState.currentIndex = currentState.currentIndex + 1;
      }
      
      setGuidedQuestionStates(prev => ({ ...prev, [fieldKey]: newState }));
    };
    
    const handleBack = () => {
      if (currentState.currentIndex > 0) {
        const newState = { ...currentState, currentIndex: currentState.currentIndex - 1 };
        setGuidedQuestionStates(prev => ({ ...prev, [fieldKey]: newState }));
      }
    };
    
    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {field.label} {field.required && '*'}
        </Typography>
        
        <Box mb={2} p={2} bgcolor="blue.50" borderRadius={1}>
          <Typography variant="body2" gutterBottom>
            <strong>Question {currentState.currentIndex + 1} of {questions.length}:</strong>
          </Typography>
          <Typography variant="body1" gutterBottom>
            {currentQuestion.question}
          </Typography>
          
          {currentQuestion.type === 'number' && (
            <TextField
              fullWidth
              type="number"
              placeholder={currentQuestion.placeholder}
              value={currentState.answers[currentQuestion.id] || ''}
              onChange={(e) => {
                const newAnswers = { ...currentState.answers, [currentQuestion.id]: e.target.value };
                setGuidedQuestionStates(prev => ({ ...prev, [fieldKey]: { ...currentState, answers: newAnswers } }));
              }}
              sx={{ mt: 1 }}
            />
          )}
          
          {currentQuestion.type === 'textArray' && (
            <TextField
              fullWidth
              placeholder={currentQuestion.placeholder}
              value={currentState.answers[currentQuestion.id] || ''}
              onChange={(e) => {
                const newAnswers = { ...currentState.answers, [currentQuestion.id]: e.target.value };
                setGuidedQuestionStates(prev => ({ ...prev, [fieldKey]: { ...currentState, answers: newAnswers } }));
              }}
              helperText="Enter values separated by commas"
              sx={{ mt: 1 }}
            />
          )}
          
          {currentQuestion.type === 'multiSelect' && (
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Select options</InputLabel>
              <Select
                multiple
                value={currentState.answers[currentQuestion.id] || []}
                onChange={(e) => {
                  const newAnswers = { ...currentState.answers, [currentQuestion.id]: e.target.value };
                  setGuidedQuestionStates(prev => ({ ...prev, [fieldKey]: { ...currentState, answers: newAnswers } }));
                }}
                label="Select options"
              >
                {currentQuestion.suggestions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {currentQuestion.suggestions && currentQuestion.type !== 'multiSelect' && (
            <Box mt={1}>
              <Typography variant="caption" color="text.secondary">
                Suggestions:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
                {currentQuestion.suggestions.map((suggestion) => (
                  <Chip
                    key={suggestion}
                    label={suggestion}
                    size="small"
                    onClick={() => handleAnswer(suggestion)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
          )}
          
                      <Box display="flex" gap={1} mt={2}>
            {currentState.currentIndex > 0 && (
              <Button variant="outlined" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button 
              variant="contained" 
              onClick={() => handleAnswer(currentState.answers[currentQuestion.id])}
              disabled={!currentState.answers[currentQuestion.id]}
            >
              {isLastQuestion ? 'Generate Config' : 'Next'}
            </Button>
          </Box>
        </Box>
        
        {formData[field.name] && (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Generated Configuration:
            </Typography>
            <MonacoEditor
              height="150px"
              language="json"
              value={formData[field.name]}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 12,
                readOnly: true,
              }}
            />
          </Box>
        )}
      </Box>
    );
  };

  const generateJsonFromAnswers = async (fieldName, questions, answers) => {
    try {
      // Call server endpoint to generate JSON from guided questions
      const response = await fetch('/api/docs/generate-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldName,
          answers,
          questions
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate JSON from server');
      }
      
      const data = await response.json();
      return data.generatedJson;
    } catch (error) {
      console.error('Error generating JSON from guided questions:', error);
      return {};
    }
  };

  // The generation logic should be handled by the server based on schema
  // Client only processes the guided questions and sends answers to server

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