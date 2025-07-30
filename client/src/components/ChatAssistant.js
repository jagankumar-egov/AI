import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  Avatar,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Send as SendIcon, SmartToy as AIIcon, Person as PersonIcon } from '@mui/icons-material';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';

import { configAPI } from '../services/api';
import { useConfigStore } from '../stores/configStore';

const ChatAssistant = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { chatHistory, addChatMessage, clearChatHistory, updateSection } = useConfigStore();

  const generateMutation = useMutation(
    (data) => configAPI.generateConfig(data.section, data.details),
    {
      onSuccess: (data) => {
        const aiMessage = {
          id: Date.now(),
          type: 'ai',
          content: `I've generated the ${data.section} configuration for you. Here's what I created:`,
          config: data.config,
          section: data.section,
          timestamp: new Date().toISOString(),
        };
        addChatMessage(aiMessage);
        updateSection(data.section, data.config);
        setIsTyping(false);
        toast.success(`${data.section} configuration generated successfully!`);
      },
      onError: (error) => {
        const aiMessage = {
          id: Date.now(),
          type: 'ai',
          content: `Sorry, I couldn't generate the configuration. Error: ${error.message}`,
          timestamp: new Date().toISOString(),
        };
        addChatMessage(aiMessage);
        setIsTyping(false);
        toast.error('Failed to generate configuration');
      },
    }
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    addChatMessage(userMessage);
    setMessage('');
    setIsTyping(true);

    // Simple intent detection (in production, use a more sophisticated NLP approach)
    const intent = detectIntent(message);
    
    if (intent.type === 'generate') {
      generateMutation.mutate({
        section: intent.section,
        details: { prompt: message },
      });
    } else {
      const aiMessage = {
        id: Date.now(),
        type: 'ai',
        content: getHelpResponse(intent),
        timestamp: new Date().toISOString(),
      };
      addChatMessage(aiMessage);
      setIsTyping(false);
    }
  };

  const detectIntent = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Check for generation intent
    if (lowerMessage.includes('workflow') || lowerMessage.includes('state')) {
      return { type: 'generate', section: 'workflow' };
    }
    if (lowerMessage.includes('form') || lowerMessage.includes('field')) {
      return { type: 'generate', section: 'form' };
    }
    if (lowerMessage.includes('billing') || lowerMessage.includes('payment')) {
      return { type: 'generate', section: 'billing' };
    }
    if (lowerMessage.includes('access') || lowerMessage.includes('role')) {
      return { type: 'generate', section: 'access' };
    }
    
    // Check for help intent
    if (lowerMessage.includes('help') || lowerMessage.includes('what') || lowerMessage.includes('how')) {
      return { type: 'help' };
    }
    
    return { type: 'unknown' };
  };

  const getHelpResponse = (intent) => {
    switch (intent.type) {
      case 'help':
        return `I can help you configure your service! Here are some things you can ask me:

• "Create a workflow with DRAFT, REVIEW, and APPROVED states"
• "Generate a form with name, email, and phone fields"
• "Set up billing with tax calculation"
• "Configure access control with different roles"

Just describe what you need, and I'll generate the configuration for you!`;
      
      case 'unknown':
        return `I'm not sure how to help with that. Try asking me to:
• Generate a workflow configuration
• Create a form with specific fields
• Set up billing or access control
• Or ask for help to see what I can do`;
      
      default:
        return 'I can help you configure your service. What would you like to set up?';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        AI Configuration Assistant
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Chat with AI to configure your service using natural language.
      </Typography>

      <Paper sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        {/* Chat Messages */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {chatHistory.length === 0 && (
            <Box textAlign="center" py={4}>
              <AIIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Welcome to the AI Configuration Assistant!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start by asking me to help you configure your service.
              </Typography>
            </Box>
          )}

          <List>
            {chatHistory.map((msg) => (
              <ListItem key={msg.id} sx={{ display: 'block', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Avatar sx={{ bgcolor: msg.type === 'ai' ? 'primary.main' : 'grey.500' }}>
                    {msg.type === 'ai' ? <AIIcon /> : <PersonIcon />}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2">
                        {msg.type === 'ai' ? 'AI Assistant' : 'You'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </Typography>
                      {msg.section && (
                        <Chip label={msg.section} size="small" color="primary" />
                      )}
                    </Box>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {msg.content}
                    </Typography>
                    {msg.config && (
                      <Paper sx={{ p: 1, bgcolor: 'grey.50', fontFamily: 'monospace', fontSize: '12px' }}>
                        <pre>{JSON.stringify(msg.config, null, 2)}</pre>
                      </Paper>
                    )}
                  </Box>
                </Box>
              </ListItem>
            ))}
            
            {isTyping && (
              <ListItem sx={{ display: 'block', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <AIIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      AI Assistant
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        Generating configuration...
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </ListItem>
            )}
          </List>
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe what you want to configure..."
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!message.trim() || isTyping}
              sx={{ minWidth: 'auto' }}
            >
              <SendIcon />
            </Button>
          </Box>
          
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Button
              size="small"
              onClick={clearChatHistory}
              disabled={chatHistory.length === 0}
            >
              Clear Chat
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatAssistant; 