import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';

import { configAPI } from '../services/api';

const ExportDialog = ({ open, onClose, config }) => {
  const [format, setFormat] = useState('json');
  const [serviceName, setServiceName] = useState('');
  const [exportType, setExportType] = useState('download');

  const exportMutation = useMutation(
    (data) => {
      if (exportType === 'github') {
        return configAPI.sendToGitHub(data.config, data.options);
      } else if (exportType === 's3') {
        return configAPI.sendToS3(data.config, data.options);
      }
      return Promise.resolve({ success: true });
    },
    {
      onSuccess: (data) => {
        if (exportType === 'download') {
          downloadConfig();
        } else {
          toast.success(`Configuration exported to ${exportType} successfully!`);
        }
        onClose();
      },
      onError: (error) => {
        toast.error(`Export failed: ${error.message}`);
      },
    }
  );

  const downloadConfig = () => {
    const fullConfig = {
      serviceName: serviceName || 'GeneratedService',
      enabledSections: Object.keys(config).filter(key => key !== 'serviceName'),
      ...config,
    };

    let content, filename, mimeType;

    if (format === 'json') {
      content = JSON.stringify(fullConfig, null, 2);
      filename = `${serviceName || 'service'}-config.json`;
      mimeType = 'application/json';
    } else if (format === 'yaml') {
      // Simple YAML conversion (in production, use a proper YAML library)
      content = convertToYaml(fullConfig);
      filename = `${serviceName || 'service'}-config.yaml`;
      mimeType = 'text/yaml';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Configuration downloaded successfully!');
  };

  const convertToYaml = (obj, indent = 0) => {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${convertToYaml(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            yaml += `${spaces}- ${convertToYaml(item, indent + 1).trim()}`;
          } else {
            yaml += `${spaces}- ${item}\n`;
          }
        });
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  };

  const handleExport = () => {
    if (exportType === 'download') {
      downloadConfig();
    } else {
      // For external services, you'd need to collect additional options
      exportMutation.mutate({
        config,
        options: {
          // Add service-specific options here
        },
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Configuration</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Service Name"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="Enter service name"
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Export Type</InputLabel>
            <Select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              label="Export Type"
            >
              <MenuItem value="download">Download File</MenuItem>
              <MenuItem value="github">GitHub Repository</MenuItem>
              <MenuItem value="s3">AWS S3</MenuItem>
            </Select>
          </FormControl>

          {exportType === 'download' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Format</InputLabel>
              <Select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                label="Format"
              >
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="yaml">YAML</MenuItem>
              </Select>
            </FormControl>
          )}

          {exportType === 'github' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              GitHub integration requires repository and token configuration.
            </Alert>
          )}

          {exportType === 's3' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              S3 integration requires bucket and credentials configuration.
            </Alert>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary">
          Configuration will be exported with {Object.keys(config).length} sections.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleExport}
          variant="contained"
          disabled={exportMutation.isLoading}
        >
          {exportMutation.isLoading ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog; 