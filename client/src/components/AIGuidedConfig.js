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
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Alert,
  Divider,
} from '@mui/material';
import { 
  Send as SendIcon, 
  SmartToy as AIIcon, 
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useMutation, useQuery } from 'react-query';
import toast from 'react-hot-toast';

import { configAPI } from '../services/api';
import { useConfigStore } from '../stores/configStore';

const AIGuidedConfig = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  const [sectionProgress, setSectionProgress] = useState({});
  const messagesEndRef = useRef(null);
  const { 
    chatHistory, 
    addChatMessage, 
    clearChatHistory, 
    updateSection,
    config,
    setConfig,
    setServiceName 
  } = useConfigStore();

  // Fetch AI-guided information from schema
  const { data: aiGuidedInfo, isLoading: loadingInfo } = useQuery(
    'aiGuidedInfo',
    () => configAPI.getAIGuidedInfo(),
    { staleTime: 10 * 60 * 1000 }
  );

  // Fetch creation requirements
  const { data: requirements } = useQuery(
    'createRequirements',
    () => configAPI.getCreateRequirements(),
    { staleTime: 5 * 60 * 1000 }
  );

  const generateMutation = useMutation(
    (data) => configAPI.generateAIGuidedConfig(data.section, data.details, data.context),
    {
      onSuccess: (data) => {
        const aiMessage = {
          id: Date.now(),
          type: 'ai',
          content: `Perfect! I've generated the ${data.section} configuration based on your requirements. Here's what I created:`,
          config: data.config,
          section: data.section,
          timestamp: new Date().toISOString(),
        };
        addChatMessage(aiMessage);
        updateSection(data.section, data.config);
        
        // Update section progress
        setSectionProgress(prev => ({
          ...prev,
          [data.section]: 'completed'
        }));
        
        setIsTyping(false);
        toast.success(`${data.section} configuration generated successfully!`);
        
        // Show next step suggestions
        if (data.suggestions && data.suggestions.length > 0) {
          const suggestionMessage = {
            id: Date.now() + 1,
            type: 'ai',
            content: `Great! Here are some suggestions for what to configure next:\n\n${data.suggestions.map(s => `• ${s}`).join('\n')}`,
            timestamp: new Date().toISOString(),
          };
          addChatMessage(suggestionMessage);
        }
        
        // Move to next section
        moveToNextSection(data.section);
      },
      onError: (error) => {
        const aiMessage = {
          id: Date.now(),
          type: 'ai',
          content: `I'm sorry, I couldn't generate the configuration. ${error.message}. Could you please provide more specific details?`,
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

  // Initialize with welcome message from schema
  useEffect(() => {
    if (chatHistory.length === 0 && aiGuidedInfo) {
      const welcomeMessage = {
        id: Date.now(),
        type: 'ai',
        content: `Welcome to the AI Service Configuration Assistant! 🎉

I'll help you configure your service step by step using schema-driven guidance.

**Required Sections:**
${aiGuidedInfo.requiredSections?.map(section => `• ${section}`).join('\n')}

**Available Sections:**
${aiGuidedInfo.sections?.slice(0, 5).map(section => `• ${section.label}`).join('\n')}

What type of service are you building? (e.g., "I'm creating a trade license service" or "I need a property tax system")`,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(welcomeMessage);
    }
  }, [aiGuidedInfo, chatHistory.length]);

  const moveToNextSection = (completedSection) => {
    if (!aiGuidedInfo?.sections) return;
    
    const currentSectionIndex = aiGuidedInfo.sections.findIndex(section => 
      section.name === completedSection
    );
    
    if (currentSectionIndex < aiGuidedInfo.sections.length - 1) {
      const nextSection = aiGuidedInfo.sections[currentSectionIndex + 1];
      
      setCurrentSection(nextSection.name);
      
      const nextMessage = {
        id: Date.now(),
        type: 'ai',
        content: `Great! Now let's configure the **${nextSection.label}** section.

${nextSection.description}

${nextSection.guidedQuestions && nextSection.guidedQuestions.length > 0 ? 
  `I'll ask you a few questions to configure this properly:` : 
  `You can describe what you need, and I'll generate the configuration.`
}`,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(nextMessage);
    } else {
      // All sections completed
      const completionMessage = {
        id: Date.now(),
        type: 'ai',
        content: `🎉 Excellent! We've configured all the main sections of your service.

Your configuration is ready! You can:
• Review the generated configuration
• Export it as JSON
• Make any final adjustments

Would you like me to show you the complete configuration or help you with anything specific?`,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(completionMessage);
      setCurrentSection('completed');
    }
  };

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

    // Detect intent and generate configuration
    const intent = detectIntent(message);
    
    if (intent.type === 'generate') {
      // Get context for AI generation
      const context = {
        currentSection: intent.section,
        completedSections: Object.keys(sectionProgress).filter(section => 
          sectionProgress[section] === 'completed'
        ),
        existingConfig: config
      };
      
      generateMutation.mutate({
        section: intent.section,
        details: { prompt: message },
        context: context
      });
    } else if (intent.type === 'help') {
      const helpMessage = {
        id: Date.now(),
        type: 'ai',
        content: getHelpResponse(intent),
        timestamp: new Date().toISOString(),
      };
      addChatMessage(helpMessage);
      setIsTyping(false);
    } else {
      const aiMessage = {
        id: Date.now(),
        type: 'ai',
        content: `I understand you want to configure something. Could you be more specific? For example:
• "Create a workflow with DRAFT, REVIEW, and APPROVED states"
• "Generate a form with name, email, and phone fields"
• "Set up billing with tax calculation"
• "Configure access control with different roles"

Or ask for help to see what I can do!`,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(aiMessage);
      setIsTyping(false);
    }
  };

  const detectIntent = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Use schema-driven section detection
    if (!aiGuidedInfo?.sections) return { type: 'unknown' };
    
    for (const section of aiGuidedInfo.sections) {
      const sectionName = section.name.toLowerCase();
      const sectionLabel = section.label.toLowerCase();
      
      if (lowerMessage.includes(sectionName) || lowerMessage.includes(sectionLabel)) {
        return { type: 'generate', section: section.name };
      }
    }
    
    // Check for help intent
    if (lowerMessage.includes('help') || lowerMessage.includes('what') || lowerMessage.includes('how')) {
      return { type: 'help' };
    }
    
    return { type: 'unknown' };
  };

  const getCurrentContext = () => {
    return {
      currentSection,
      completedSections: Object.keys(sectionProgress).filter(section => 
        sectionProgress[section] === 'completed'
      ),
      existingConfig: config
    };
  };

  const getHelpResponse = (intent) => {
    if (!aiGuidedInfo?.sections) {
      return 'I can help you configure your service. What would you like to set up?';
    }
    
    switch (intent.type) {
      case 'help':
        return `I can help you configure your service! Here are some things you can ask me:

**Configuration Sections:**
${aiGuidedInfo.sections.map(section => 
  `• **${section.label}**: "${section.description}"`
).join('\n')}

**Commands:**
• "Show me the current configuration"
• "What sections are available?"
• "Help me with [specific section]"

Just describe what you need, and I'll generate the configuration for you!`;
      
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

  const getProgressSteps = () => {
    if (!aiGuidedInfo?.sections) return [];
    
    return aiGuidedInfo.sections.map(section => ({
      label: section.label,
      name: section.name,
      status: sectionProgress[section.name] || 'pending',
      required: section.required
    }));
  };

  return (
    <Box sx={{ display: 'flex', gap: 3, height: '100vh' }}>
      {/* Progress Panel */}
      <Box sx={{ width: 300, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Configuration Progress
        </Typography>
        
        <Stepper orientation="vertical" sx={{ mt: 2 }}>
          {getProgressSteps().map((step, index) => (
            <Step key={step.name} active={step.status === 'completed'}>
              <StepLabel
                icon={step.status === 'completed' ? <CheckIcon /> : index + 1}
                optional={
                  <Typography variant="caption" color="text.secondary">
                    {step.status === 'completed' ? 'Completed' : 'Pending'}
                  </Typography>
                }
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {currentSection && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Current Section
              </Typography>
              <Typography variant="body2" color="primary">
                {currentSection}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Chat Interface */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Chat Messages */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {chatHistory.length === 0 && (
              <Box textAlign="center" py={4}>
                <AIIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  AI Configuration Assistant
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start by describing your service requirements.
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
                      <Typography variant="body1" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        AI is thinking...
                      </Typography>
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
                startIcon={<HelpIcon />}
              >
                Clear Chat
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AIGuidedConfig; 