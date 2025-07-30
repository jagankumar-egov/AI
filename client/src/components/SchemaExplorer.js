import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useQuery } from 'react-query';

import { configAPI } from '../services/api';
import MonacoEditor from './MonacoEditor';

const SchemaExplorer = () => {
  const [selectedSection, setSelectedSection] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const { data: sections, isLoading, error } = useQuery(
    'sections',
    () => configAPI.getDocs(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const { data: sectionDetails } = useQuery(
    ['section-details', selectedSection],
    () => configAPI.getSectionDocs(selectedSection),
    {
      enabled: !!selectedSection,
      staleTime: 10 * 60 * 1000,
    }
  );

  const handleSectionSelect = (section) => {
    setSelectedSection(section);
    setActiveTab(0);
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
      <Alert severity="error">
        Failed to load schema sections: {error.message}
      </Alert>
    );
  }

  const availableSections = sections?.sections || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Schema Explorer
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Explore available configuration schemas and understand their structure.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Paper sx={{ width: 300, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Available Sections
          </Typography>
          <List>
            {availableSections.map((section, index) => (
              <React.Fragment key={section.name}>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={selectedSection === section.name}
                    onClick={() => handleSectionSelect(section.name)}
                  >
                    <ListItemText
                      primary={section.name}
                      secondary={section.description}
                    />
                  </ListItemButton>
                </ListItem>
                {index < availableSections.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {selectedSection && sectionDetails && (
          <Paper sx={{ flex: 1, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedSection}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {sectionDetails.description}
            </Typography>

            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Schema" />
              <Tab label="Examples" />
              <Tab label="Documentation" />
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {activeTab === 0 && (
                <MonacoEditor
                  value={JSON.stringify(sectionDetails.schema, null, 2)}
                  onChange={() => {}}
                  language="json"
                  height="500px"
                />
              )}

              {activeTab === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Basic Example
                  </Typography>
                  <MonacoEditor
                    value={JSON.stringify(sectionDetails.examples?.basic || {}, null, 2)}
                    onChange={() => {}}
                    language="json"
                    height="200px"
                  />

                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Advanced Example
                  </Typography>
                  <MonacoEditor
                    value={JSON.stringify(sectionDetails.examples?.advanced || {}, null, 2)}
                    onChange={() => {}}
                    language="json"
                    height="200px"
                  />
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Key Fields
                  </Typography>
                  <List>
                    {sectionDetails.prompting?.keyFields?.map((field) => (
                      <ListItem key={field.name}>
                        <ListItemText
                          primary={field.name}
                          secondary={`${field.type}${field.required ? ' (required)' : ''} - ${field.description}`}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Tips
                  </Typography>
                  <List>
                    {sectionDetails.prompting?.tips?.map((tip, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={tip} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {selectedSection && !sectionDetails && (
          <Paper sx={{ flex: 1, p: 2 }}>
            <Alert severity="info">
              Select a section to view its details.
            </Alert>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default SchemaExplorer; 