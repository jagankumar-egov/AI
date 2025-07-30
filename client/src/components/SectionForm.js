import React, { useState } from 'react';
import {
  Box,
  Switch,
  FormControlLabel,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import { useQuery, useMutation } from 'react-query';
import toast from 'react-hot-toast';

import { configAPI } from '../services/api';
import { useConfigStore } from '../stores/configStore';
import SchemaForm from './SchemaForm';
import MonacoEditor from './MonacoEditor';

const SectionForm = ({ section, enabled, onToggle, onComplete, isRequired = false }) => {
  const [editMode, setEditMode] = useState('form'); // 'form' or 'json'
  const { updateSection, getSectionConfig } = useConfigStore();

  // Fetch section documentation
  const { data: sectionDocs, isLoading: docsLoading } = useQuery(
    ['section-docs', section],
    () => configAPI.getSectionDocs(section),
    {
      enabled: enabled,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Generate configuration mutation
  const generateMutation = useMutation(
    (details) => configAPI.generateConfig(section, details),
    {
      onSuccess: (data) => {
        updateSection(section, data.config);
        toast.success(`${section} configuration generated successfully!`);
        onComplete?.();
      },
      onError: (error) => {
        toast.error(`Failed to generate ${section} configuration: ${error.message}`);
      },
    }
  );

  // Validate configuration mutation
  const validateMutation = useMutation(
    (config) => configAPI.validateConfig(config, section),
    {
      onSuccess: (data) => {
        if (data.valid) {
          toast.success(`${section} configuration is valid!`);
        } else {
          toast.error(`Validation failed: ${data.errors.map(e => e.message).join(', ')}`);
        }
      },
      onError: (error) => {
        toast.error(`Validation error: ${error.message}`);
      },
    }
  );

  const handleGenerate = (details) => {
    generateMutation.mutate(details);
  };

  const handleValidate = () => {
    const config = getSectionConfig(section);
    validateMutation.mutate(config);
  };

  const handleFormChange = (formData) => {
    updateSection(section, formData);
  };

  const handleJsonChange = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      updateSection(section, parsed);
    } catch (error) {
      // Invalid JSON - don't update
    }
  };

  if (!enabled) {
    return (
      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
              disabled={isRequired} // Disable switch for required sections
            />
          }
          label={`Enable ${section} configuration${isRequired ? ' (Required)' : ''}`}
        />
        {isRequired && (
          <Typography variant="caption" color="error" sx={{ ml: 4 }}>
            This section is required and cannot be disabled
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={(e) => onToggle(e.target.checked)}
                disabled={isRequired} // Disable switch for required sections
              />
            }
            label={`Enable ${section} configuration${isRequired ? ' (Required)' : ''}`}
          />
          {isRequired && (
            <Typography variant="caption" color="error" sx={{ ml: 4 }}>
              This section is required and cannot be disabled
            </Typography>
          )}
        </Box>

        {docsLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : sectionDocs ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              {sectionDocs.description}
            </Typography>

            {sectionDocs.prompting && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Tips:</strong> {sectionDocs.prompting.tips.join(', ')}
                </Typography>
              </Alert>
            )}

            <Box sx={{ mb: 2 }}>
              <Button
                variant={editMode === 'form' ? 'contained' : 'outlined'}
                onClick={() => setEditMode('form')}
                sx={{ mr: 1 }}
              >
                Form Editor
              </Button>
              <Button
                variant={editMode === 'json' ? 'contained' : 'outlined'}
                onClick={() => setEditMode('json')}
              >
                JSON Editor
              </Button>
            </Box>

            {editMode === 'form' ? (
              <SchemaForm
                schema={sectionDocs.schema}
                formData={getSectionConfig(section)}
                onChange={handleFormChange}
                onGenerate={handleGenerate}
                loading={generateMutation.isLoading}
              />
            ) : (
              <MonacoEditor
                value={JSON.stringify(getSectionConfig(section), null, 2)}
                onChange={handleJsonChange}
                language="json"
                height="300px"
              />
            )}

            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleValidate}
                disabled={validateMutation.isLoading}
                sx={{ mr: 1 }}
              >
                {validateMutation.isLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  'Validate'
                )}
              </Button>
            </Box>
          </Box>
        ) : (
          <Alert severity="error">
            Failed to load section documentation
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SectionForm; 