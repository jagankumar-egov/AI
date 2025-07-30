import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';

import Header from './components/Header';
import ConfigStepper from './components/ConfigStepper';
import SchemaExplorer from './components/SchemaExplorer';
import ChatAssistant from './components/ChatAssistant';
import CreateConfig from './components/CreateConfig';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
        <Routes>
          <Route path="/" element={<ConfigStepper />} />
          <Route path="/create" element={<CreateConfig />} />
          <Route path="/explorer" element={<SchemaExplorer />} />
          <Route path="/chat" element={<ChatAssistant />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App; 