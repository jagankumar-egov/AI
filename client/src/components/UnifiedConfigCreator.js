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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import { 
  Send as SendIcon, 
  SmartToy as AIIcon, 
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  Code as CodeIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useMutation, useQuery } from 'react-query';
import toast from 'react-hot-toast';

import { configAPI } from '../services/api';
import { useConfigStore } from '../stores/configStore';
import MonacoEditor from './MonacoEditor';

const UnifiedConfigCreator = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  const [sectionProgress, setSectionProgress] = useState({});
  const [showManualMode, setShowManualMode] = useState(false);
  const [manualFormData, setManualFormData] = useState({});
  const [showConfigProgress, setShowConfigProgress] = useState(false);
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
        // Handle different response types
        if (data.success === false) {
          // Conversational response (clarification needed, help, etc.)
          const aiMessage = {
            id: Date.now(),
            type: 'ai',
            content: data.message,
            section: data.section,
            timestamp: new Date().toISOString(),
          };
          addChatMessage(aiMessage);
          setIsTyping(false);
          
          if (data.type === 'clarification_needed') {
            toast('AI needs more information', { icon: '💬' });
          } else if (data.type === 'conversational_response') {
            toast('AI provided guidance', { icon: '💡' });
          }
        } else {
          // Successful configuration generation
          const isDefaultConfig = data.context?.useDefault || data.config?.isDefault;
          const aiMessage = {
            id: Date.now(),
            type: 'ai',
            content: isDefaultConfig 
              ? `✅ Applied default configuration for ${data.section}. Moving to the next step...`
              : `Perfect! I've generated the ${data.section} configuration based on your requirements. Here's what I created:`,
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
          toast.success(isDefaultConfig ? `Default ${data.section} configuration applied!` : `${data.section} configuration generated successfully!`);
          
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
          
          // Handle multi-attribute generation if applicable
          if (data.multiAttributes && Object.keys(data.multiAttributes).length > 0) {
            // Update multiple sections at once
            Object.entries(data.multiAttributes).forEach(([sectionName, sectionConfig]) => {
              updateSection(sectionName, sectionConfig);
              setSectionProgress(prev => ({
                ...prev,
                [sectionName]: 'completed'
              }));
            });
            
            // Show multi-section completion message
            const multiSectionMessage = {
              id: Date.now() + 2,
              type: 'ai',
              content: `Perfect! I've configured multiple sections based on your input:\n\n${Object.keys(data.multiAttributes).map(section => `• ${section}: ${JSON.stringify(data.multiAttributes[section])}`).join('\n')}`,
              timestamp: new Date().toISOString(),
            };
            addChatMessage(multiSectionMessage);
          }
          
          // Move to next section
          moveToNextSection(data.section);
        }
      },
      onError: (error) => {
        const aiMessage = {
          id: Date.now(),
          type: 'ai',
          content: `I'm sorry, I encountered an issue. ${error.message}. Could you please try again with more specific details?`,
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
      const getWelcomeMessage = async () => {
        try {
          // Get guidance for the first required section
          const firstSection = aiGuidedInfo.requiredSections?.[0] || aiGuidedInfo.sections?.[0]?.name;
          if (firstSection) {
            const guidance = await configAPI.getSectionAIGuidance(firstSection);
            const copyablePrompts = guidance.aiPrompts?.copyablePrompts || [];
            
            let promptSection = '';
            if (copyablePrompts.length > 0) {
              promptSection = `**📋 Copy & Edit These Prompts:**

${copyablePrompts.map((prompt, index) => 
  `${index + 1}. **${prompt.title}**
   \`${prompt.prompt}\`
   ${prompt.description}
   
`
).join('')}

**💡 How to use:**
1. Copy any prompt above
2. Edit it with your specific requirements  
3. Paste it in the chat below
4. I'll generate the configuration for you`;
            } else {
              promptSection = `**💡 How to configure:**
1. Describe what you need in natural language
2. I'll read the schema to understand requirements
3. I'll ask for missing information if needed
4. I'll generate the configuration for you`;
            }
            
            return `Welcome to the Unified AI-Powered Config Creator! 🎉

I'll help you create any configuration using schemas and AI guidance. This is the **ONE unified way** to create configurations.

**Required Sections:**
${aiGuidedInfo.requiredSections?.map(section => `• ${section}`).join('\n')}

**Available Sections:**
${aiGuidedInfo.sections?.slice(0, 5).map(section => `• ${section.label}`).join('\n')}

${promptSection}

**🎯 Examples:** Try saying "I need a [service_type] service" or "Create a [configuration_type] system"

What type of configuration do you want to create?`;
          }
        } catch (error) {
          console.error('Error fetching section guidance:', error);
          // Fallback welcome message
          return `Welcome to the Unified AI-Powered Config Creator! 🎉

I'll help you create any configuration using schemas and AI guidance. This is the **ONE unified way** to create configurations.

**Required Sections:**
${aiGuidedInfo.requiredSections?.map(section => `• ${section}`).join('\n')}

**Available Sections:**
${aiGuidedInfo.sections?.slice(0, 5).map(section => `• ${section.label}`).join('\n')}

**💡 How to get started:**
1. Describe what you need in natural language
2. I'll read schemas to understand requirements
3. I'll ask for missing information
4. I'll generate validated configurations
5. We'll progress through all sections

**🎯 Examples:** Try saying "I need a [service_type] service" or "Create a [configuration_type] system"

What type of configuration do you want to create?`;
        }
      };
      
      getWelcomeMessage().then(messageContent => {
        const welcomeMessage = {
          id: Date.now(),
          type: 'ai',
          content: messageContent,
          timestamp: new Date().toISOString(),
        };
        addChatMessage(welcomeMessage);
      });
    }
  }, [aiGuidedInfo, chatHistory.length]);

  const moveToNextSection = (completedSection) => {
    if (!aiGuidedInfo?.sections) return;
    
    const currentSectionIndex = aiGuidedInfo.sections.findIndex(section => 
      section.name === completedSection
    );
    
    // Count completed sections to determine progression behavior
    const completedSectionsCount = Object.keys(sectionProgress).filter(section => 
      sectionProgress[section] === 'completed'
    ).length;
    
    if (currentSectionIndex < aiGuidedInfo.sections.length - 1) {
      const nextSection = aiGuidedInfo.sections[currentSectionIndex + 1];
      
      setCurrentSection(nextSection.name);
      
      // Get section-specific AI guidance
      const getSectionGuidance = async () => {
        try {
          const guidance = await configAPI.getSectionAIGuidance(nextSection.name);
          const copyablePrompts = guidance.aiPrompts?.copyablePrompts || [];
          
          let promptSection = '';
          if (copyablePrompts.length > 0) {
            promptSection = `**📋 Copy & Edit These Prompts:**

${copyablePrompts.map((prompt, index) => 
  `${index + 1}. **${prompt.title}**
   \`${prompt.prompt}\`
   ${prompt.description}
   
`
).join('')}

**💡 How to use:**
1. Copy any prompt above
2. Edit it with your specific requirements
3. Paste it in the chat below
4. I'll generate the configuration for you`;
          } else {
            promptSection = `**💡 How to configure:**
1. Describe what you need in natural language
2. I'll read the schema to understand requirements
3. I'll ask for missing information if needed
4. I'll generate the configuration for you`;
          }
          
          // Enhanced message based on completion count
          let nextMessage = '';
          
          if (completedSectionsCount >= 2) {
            // After 2+ steps completed, show focused next step
            nextMessage = `✅ **${completedSectionsCount} sections completed!** 

Now let's configure the **${nextSection.label}** section:

${nextSection.description}

${promptSection}

**💡 Quick Options:**
• Describe your specific requirements
• Say "yes" or "ok" to proceed with sensible defaults
• Say "keep it default" to use default settings and skip to next
• Say "skip this section" to move to the next section

**🎯 Example:** Try describing what you need for ${nextSection.label.toLowerCase()}

What would you like to configure for ${nextSection.label}?`;
          } else {
            // First few steps - show full guidance
            nextMessage = `Great! Now let's configure the **${nextSection.label}** section.

${nextSection.description}

${promptSection}

**🎯 Example:** Try describing what you need for ${nextSection.label.toLowerCase()}

What would you like to configure for ${nextSection.label}?`;
          }

          return nextMessage;
        } catch (error) {
          console.error('Error fetching section guidance:', error);
          
          if (completedSectionsCount >= 2) {
            return `✅ **${completedSectionsCount} sections completed!** 

Now let's configure the **${nextSection.label}** section:

${nextSection.description}

**💡 Quick Options:**
• Describe your specific requirements
• Say "keep it default" to use default settings and skip to next
• Say "skip this section" to move to the next section

**🎯 Example:** Try describing what you need for ${nextSection.label.toLowerCase()}

What would you like to configure for ${nextSection.label}?`;
          } else {
            return `Great! Now let's configure the **${nextSection.label}** section.

${nextSection.description}

**💡 How to configure:**
1. Describe what you need in natural language
2. I'll read the schema to understand requirements
3. I'll ask for missing information if needed
4. I'll generate the configuration for you

**🎯 Example:** Try describing what you need for ${nextSection.label.toLowerCase()}

What would you like to configure for ${nextSection.label}?`;
          }
        }
      };
      
      getSectionGuidance().then(messageContent => {
        const nextMessage = {
          id: Date.now(),
          type: 'ai',
          content: messageContent,
          timestamp: new Date().toISOString(),
        };
        addChatMessage(nextMessage);
      });
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
    } else if (intent.type === 'multi_generate') {
      // Handle multi-attribute generation
      const context = {
        currentSection: intent.sections[0], // Start with first section
        completedSections: Object.keys(sectionProgress).filter(section => 
          sectionProgress[section] === 'completed'
        ),
        existingConfig: config,
        multiAttributes: intent.attributes
      };
      
      generateMutation.mutate({
        section: intent.sections[0],
        details: { prompt: message },
        context: context
      });
    } else if (intent.type === 'keep_default') {
      // Handle keep default command
      const context = {
        currentSection: currentSection || intent.section,
        completedSections: Object.keys(sectionProgress).filter(section => 
          sectionProgress[section] === 'completed'
        ),
        existingConfig: config,
        useDefault: true
      };
      
      generateMutation.mutate({
        section: currentSection || intent.section,
        details: { prompt: 'use default configuration' },
        context: context
      });
    } else if (intent.type === 'skip_section') {
      // Handle skip section command
      const skipMessage = {
        id: Date.now(),
        type: 'ai',
        content: `✅ Skipped the current section. Moving to the next step...`,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(skipMessage);
      
      // Move to next section immediately
      if (currentSection) {
        moveToNextSection(currentSection);
      }
      setIsTyping(false);
    } else if (intent.type === 'proceed_next') {
      // Handle affirmative responses to proceed to next step
      const proceedMessage = {
        id: Date.now(),
        type: 'ai',
        content: `✅ Got it! Moving to the next step...`,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(proceedMessage);
      
      // Move to next section immediately
      if (currentSection) {
        moveToNextSection(currentSection);
      }
      setIsTyping(false);
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
      // Enhanced fallback with context-aware suggestions
      let fallbackMessage = '';
      
      if (currentSection) {
        // If we have a current section, provide section-specific guidance
        fallbackMessage = `I understand you want to configure the **${currentSection}** section. Could you be more specific? For example:

• Describe what you need for ${currentSection.toLowerCase()}
• Say "yes" or "ok" to proceed with sensible defaults
• Say "keep it default" to use default settings
• Say "skip this section" to move to the next step
• Say "next" to proceed with current settings

What would you like to configure for ${currentSection}?`;
      } else {
        // General guidance for unknown input
        fallbackMessage = `I understand you want to configure something. Could you be more specific? For example:

• "Create a workflow with DRAFT, REVIEW, and APPROVED states"
• "Generate a form with name, email, and phone fields"
• "Set up billing with tax calculation"
• "Configure access control with different roles"
• Say "yes" or "next" to proceed
• Say "keep it default" to use default settings

Or ask for help to see what I can do!`;
      }
      
      const aiMessage = {
        id: Date.now(),
        type: 'ai',
        content: fallbackMessage,
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
    
    // Enhanced multi-section detection
    const detectedSections = [];
    
    for (const section of aiGuidedInfo.sections) {
      const sectionName = section.name.toLowerCase();
      const sectionLabel = section.label.toLowerCase();
      
      if (lowerMessage.includes(sectionName) || lowerMessage.includes(sectionLabel)) {
        detectedSections.push(section.name);
      }
    }
    
    // Check for help intent
    if (lowerMessage.includes('help') || lowerMessage.includes('what') || lowerMessage.includes('how')) {
      return { type: 'help' };
    }
    
    // Check for affirmative responses and natural language commands
    const affirmativePatterns = [
      /^(yes|yeah|yep|ok|okay|fine|good|sure|alright|right|correct)$/i,
      /^(yes|yeah|yep|ok|okay|fine|good|sure|alright|right|correct)\s+(fine|good|ok|okay|alright)$/i,
      /^(yes|yeah|yep|ok|okay|fine|good|sure|alright|right|correct)\s+(next|proceed|continue|go|move)$/i,
      /^(next|proceed|continue|go|move)\s+(step|section|ahead|forward)$/i,
      /^(yes|yeah|yep|ok|okay|fine|good|sure|alright|right|correct)\s+(next|proceed|continue|go|move)\s+(step|section|ahead|forward)$/i
    ];
    
    for (const pattern of affirmativePatterns) {
      if (pattern.test(message)) {
        return { type: 'proceed_next', section: currentSection || detectedSections[0] || 'current' };
      }
    }
    
    // Check for skip/keep default commands
    if (lowerMessage.includes('keep it default') || lowerMessage.includes('use default') || lowerMessage.includes('default settings')) {
      return { type: 'keep_default', section: detectedSections[0] || 'current' };
    }
    
    if (lowerMessage.includes('skip this section') || lowerMessage.includes('skip section') || lowerMessage.includes('move to next')) {
      return { type: 'skip_section', section: detectedSections[0] || 'current' };
    }
    
    // Check for multi-attribute inputs (like "create a module called tradelicence and service as NewTl")
    const multiAttributePatterns = [
      /create\s+a\s+module\s+called\s+(\w+)\s+and\s+service\s+as\s+(\w+)/i,
      /module\s+(\w+)\s+and\s+service\s+(\w+)/i,
      /service\s+(\w+)\s+and\s+module\s+(\w+)/i
    ];
    
    for (const pattern of multiAttributePatterns) {
      const match = message.match(pattern);
      if (match) {
        return { 
          type: 'multi_generate', 
          sections: ['module', 'service'],
          attributes: {
            module: match[1],
            service: match[2]
          }
        };
      }
    }
    
    // Check for general configuration patterns
    const configPatterns = [
      /create\s+(\w+)/i,
      /generate\s+(\w+)/i,
      /set\s+up\s+(\w+)/i,
      /configure\s+(\w+)/i
    ];
    
    for (const pattern of configPatterns) {
      const match = message.match(pattern);
      if (match) {
        const configType = match[1].toLowerCase();
        for (const section of aiGuidedInfo.sections) {
          if (configType.includes(section.name.toLowerCase()) || 
              configType.includes(section.label.toLowerCase())) {
            return { type: 'generate', section: section.name };
          }
        }
      }
    }
    
    // If multiple sections detected, prioritize required ones
    if (detectedSections.length > 0) {
      const requiredSections = detectedSections.filter(sectionName => {
        const section = aiGuidedInfo.sections.find(s => s.name === sectionName);
        return section && section.required;
      });
      
      if (requiredSections.length > 0) {
        return { type: 'generate', section: requiredSections[0] };
      }
      
      return { type: 'generate', section: detectedSections[0] };
    }
    
    return { type: 'unknown' };
  };

  const getHelpResponse = (intent) => {
    if (!aiGuidedInfo?.sections) {
      return 'I can help you configure your service. What would you like to set up?';
    }
    
    // Get examples from available sections
    const availableSections = aiGuidedInfo.sections.slice(0, 5);
    const sectionExamples = availableSections.map(section => 
      `• Configure ${section.label.toLowerCase()}`
    ).join('\n');
    
    return `I can help you configure your service! Here are some things you can ask me:

${sectionExamples}

**💡 Examples:**
• "I need a [service_type] service"
• "Create a [section_name] configuration"
• "Set up [specific_requirements]"

What would you like to configure?`;
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

  const handleManualModeToggle = () => {
    setShowManualMode(!showManualMode);
  };

  const handleManualInputChange = (fieldName) => (event) => {
    const value = event.target.value;
    setManualFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleManualSubmit = async () => {
    if (!currentSection) return;
    
    // Use the same AI generation for manual mode
    const context = {
      currentSection,
      completedSections: Object.keys(sectionProgress).filter(section => 
        sectionProgress[section] === 'completed'
      ),
      existingConfig: config
    };
    
    generateMutation.mutate({
      section: currentSection,
      details: { prompt: `Manual input: ${JSON.stringify(manualFormData)}` },
      context: context
    });
    
    setShowManualMode(false);
    setManualFormData({});
  };

  return (
    <Box sx={{ display: 'flex', gap: 3, height: '100vh' }}>
      {/* Progress Panel */}
      <Box sx={{ width: 300, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Configuration Progress
          {Object.keys(sectionProgress).filter(section => sectionProgress[section] === 'completed').length >= 2 && (
            <Typography variant="caption" display="block" color="success.main" sx={{ mt: 1 }}>
              ✅ Quick mode enabled - After 2+ steps, you can use "keep it default" or "skip this section"
            </Typography>
          )}
        </Typography>
        
        <Stepper orientation="vertical" sx={{ mt: 2 }}>
          {getProgressSteps().map((step, index) => (
            <Step key={step.name} active={step.status === 'completed'}>
              <StepLabel
                icon={step.status === 'completed' ? <CheckIcon /> : index + 1}
                optional={
                  <Typography variant="caption" color="text.secondary">
                    {step.status === 'completed' ? 'Completed' : step.required ? 'Required' : 'Optional'}
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
              
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showManualMode}
                      onChange={handleManualModeToggle}
                      size="small"
                    />
                  }
                  label="Manual Mode"
                />
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Main Interface */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Chat Interface */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {chatHistory.length === 0 && (
              <Box textAlign="center" py={4}>
                <AIIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Unified AI Config Creator
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start by describing your configuration requirements.
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

          {/* Manual Mode Form */}
          {showManualMode && currentSection && (
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                Manual Configuration: {currentSection}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Configuration JSON"
                    multiline
                    rows={4}
                    value={JSON.stringify(manualFormData, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setManualFormData(parsed);
                      } catch (error) {
                        // Invalid JSON, keep as string
                      }
                    }}
                    helperText="Enter the configuration in JSON format"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={handleManualSubmit}
                    startIcon={<PlayIcon />}
                  >
                    Generate with AI
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

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

      {/* Floating Configuration Progress Button */}
      <Fab
        color={Object.keys(config).length > 0 ? "success" : "primary"}
        aria-label="Configuration Progress"
        onClick={() => setShowConfigProgress(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          '&:hover': {
            transform: 'scale(1.1)',
            transition: 'transform 0.2s',
          },
        }}
      >
        <Tooltip 
          title={
            Object.keys(config).length > 0 
              ? `View Configuration Progress (${Object.keys(config).length} sections completed)`
              : "View Configuration Progress"
          } 
          placement="left"
        >
          <Box sx={{ position: 'relative' }}>
            <CodeIcon />
            {Object.keys(config).length > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: 'success.main',
                  color: 'white',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                {Object.keys(config).length}
              </Box>
            )}
          </Box>
        </Tooltip>
      </Fab>

      {/* Configuration Progress Dialog */}
      <Dialog
        open={showConfigProgress}
        onClose={() => setShowConfigProgress(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Configuration Progress
            </Typography>
            <IconButton onClick={() => setShowConfigProgress(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Generated Sections:
            </Typography>
            <Grid container spacing={1}>
              {Object.entries(config).map(([section, sectionConfig]) => (
                <Grid item xs={12} sm={6} key={section}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                          {section}
                        </Typography>
                        <CheckIcon color="success" fontSize="small" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Current Configuration:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
              <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace' }}>
                {JSON.stringify(config, null, 2)}
              </pre>
            </Paper>
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Progress Summary:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={`${Object.keys(config).length} sections completed`}
                color="primary"
                variant="outlined"
              />
              {aiGuidedInfo?.requiredSections && (
                <Chip 
                  label={`${aiGuidedInfo.requiredSections.length} required sections`}
                  color="secondary"
                  variant="outlined"
                />
              )}
              {currentSection && (
                <Chip 
                  label={`Current: ${currentSection}`}
                  color="info"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfigProgress(false)}>
            Close
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              // Copy configuration to clipboard
              navigator.clipboard.writeText(JSON.stringify(config, null, 2));
              toast.success('Configuration copied to clipboard!');
            }}
            disabled={Object.keys(config).length === 0}
          >
            Copy JSON
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UnifiedConfigCreator; 