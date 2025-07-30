import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';

import Header from './components/Header';
import UnifiedConfigCreator from './components/UnifiedConfigCreator';
import SchemaExplorer from './components/SchemaExplorer';
import ChatAssistant from './components/ChatAssistant';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
        <Routes>
          <Route path="/" element={<UnifiedConfigCreator />} />
          <Route path="/explorer" element={<SchemaExplorer />} />
          <Route path="/chat" element={<ChatAssistant />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App; 