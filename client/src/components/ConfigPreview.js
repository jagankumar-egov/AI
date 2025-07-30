import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Alert,
} from '@mui/material';
import ReactJson from 'react-json-view';

const ConfigPreview = ({ config }) => {
  if (!config || Object.keys(config).length === 0) {
    return (
      <Alert severity="info">
        No configuration data to preview. Start by enabling and configuring sections.
      </Alert>
    );
  }

  const enabledSections = Object.keys(config).filter(key => key !== 'serviceName');

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6">Configuration Preview</Typography>
        <Chip label={`${enabledSections.length} sections`} size="small" color="primary" />
      </Box>

      <Paper sx={{ p: 2 }}>
        <ReactJson
          src={config}
          name={false}
          theme="monokai"
          style={{
            backgroundColor: 'transparent',
            fontSize: '14px',
          }}
          displayDataTypes={false}
          displayObjectSize={false}
          enableClipboard={true}
          collapsed={2}
        />
      </Paper>
    </Box>
  );
};

export default ConfigPreview; 