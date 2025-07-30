import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useConfigStore = create(
  persist(
    (set, get) => ({
      // Configuration state
      config: {},
      
      // Service name
      serviceName: '',
      
      // Enabled sections
      enabledSections: [],
      
      // Actions
      setConfig: (config) => set({ config }),
      
      setServiceName: (serviceName) => set({ serviceName }),
      
      addSection: (sectionName) => {
        const { config, enabledSections } = get();
        if (!enabledSections.includes(sectionName)) {
          set({
            enabledSections: [...enabledSections, sectionName],
            config: {
              ...config,
              [sectionName]: {}
            }
          });
        }
      },
      
      removeSection: (sectionName) => {
        const { config, enabledSections } = get();
        const newConfig = { ...config };
        delete newConfig[sectionName];
        
        set({
          enabledSections: enabledSections.filter(s => s !== sectionName),
          config: newConfig
        });
      },
      
      updateSection: (sectionName, sectionConfig) => {
        const { config } = get();
        set({
          config: {
            ...config,
            [sectionName]: sectionConfig
          }
        });
      },
      
      clearConfig: () => set({
        config: {},
        enabledSections: [],
        serviceName: ''
      }),
      
      // Validation state
      validationErrors: {},
      
      setValidationErrors: (errors) => set({ validationErrors: errors }),
      
      clearValidationErrors: () => set({ validationErrors: {} }),
      
      // Export state
      exportFormat: 'json',
      
      setExportFormat: (format) => set({ exportFormat: format }),
      
      // Chat state
      chatHistory: [],
      
      addChatMessage: (message) => {
        const { chatHistory } = get();
        set({
          chatHistory: [...chatHistory, message]
        });
      },
      
      clearChatHistory: () => set({ chatHistory: [] }),
      
      // Utility methods
      getFullConfig: () => {
        const { config, serviceName, enabledSections } = get();
        return {
          serviceName: serviceName || 'GeneratedService',
          enabledSections,
          ...config
        };
      },
      
      isValid: () => {
        const { validationErrors } = get();
        return Object.keys(validationErrors).length === 0;
      },
      
      getSectionConfig: (sectionName) => {
        const { config } = get();
        return config[sectionName] || {};
      },
      
      hasSection: (sectionName) => {
        const { enabledSections } = get();
        return enabledSections.includes(sectionName);
      }
    }),
    {
      name: 'service-config-storage',
      partialize: (state) => ({
        config: state.config,
        serviceName: state.serviceName,
        enabledSections: state.enabledSections,
        chatHistory: state.chatHistory
      })
    }
  )
);

export { useConfigStore }; 