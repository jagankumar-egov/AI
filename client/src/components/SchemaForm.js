import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

const SchemaForm = ({ schema, formData, onChange, onGenerate, loading }) => {
  const [promptText, setPromptText] = useState('');

  const handleFormChange = ({ formData }) => {
    onChange(formData);
  };

  const handleGenerate = () => {
    if (promptText.trim()) {
      onGenerate({ prompt: promptText.trim() });
    }
  };

  const uiSchema = {
    'ui:submitButtonOptions': {
      submitText: 'Save Configuration',
    },
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          AI-Powered Generation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Describe what you want to configure, and AI will generate the configuration for you.
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          label="Describe your configuration needs"
          placeholder="e.g., Create a workflow with DRAFT, REVIEW, and APPROVED states for a trade license service"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={loading || !promptText.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Generating...' : 'Generate with AI'}
        </Button>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Manual Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Fill out the form below to manually configure this section.
        </Typography>
        
        <Form
          schema={schema}
          uiSchema={uiSchema}
          formData={formData}
          onChange={handleFormChange}
          validator={validator}
          showErrorList={false}
          noHtml5Validate
        />
      </Paper>
    </Box>
  );
};

export default SchemaForm; 