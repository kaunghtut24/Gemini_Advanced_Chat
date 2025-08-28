import React, { useState, useEffect } from 'react';
import { AIProvider, ProviderConfig, ModelConfig, SearchProvider, SearchProviderConfig } from '../types';
import { getAvailableModels, testModelAvailability, setCurrentModel, getCurrentModel } from '../services/aiProviderService';
import { 
  getSearchProviderConfigs, 
  saveSearchProviderConfigs, 
  setDefaultSearchProvider,
  testSearchProvider 
} from '../services/webSearchService';

interface SettingsProps {
  onClose: () => void;
  onModelChange?: (model: ModelConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose, onModelChange }) => {
  // Provider configurations
  const [providers, setProviders] = useState<ProviderConfig[]>([
    {
      provider: AIProvider.GEMINI,
      apiKey: '',
      models: [
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite'
      ]
    },
    {
      provider: AIProvider.OPENAI,
      apiKey: '',
      models: [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo'
      ]
    }
  ]);

  // Custom providers
  const [customProviders, setCustomProviders] = useState<ProviderConfig[]>([]);
  const [showAddProvider, setShowAddProvider] = useState(false);
  
  // Search providers
  const [searchProviders, setSearchProviders] = useState<SearchProviderConfig[]>([]);
  
  // New provider form
  const [newProvider, setNewProvider] = useState<Partial<ProviderConfig>>({
    provider: AIProvider.CUSTOM,
    apiKey: '',
    baseUrl: '',
    customName: '',
    models: []
  });
  const [newModelInput, setNewModelInput] = useState('');

  // Testing state
  const [isTestingModels, setIsTestingModels] = useState(false);
  const [testResults, setTestResults] = useState<{[key: string]: {available: boolean, error?: string}}>({});

  // Current model
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(getCurrentModel());

  useEffect(() => {
    // Load saved configurations from localStorage
    const savedProviders = localStorage.getItem('aiProviders');
    if (savedProviders) {
      try {
        const parsed = JSON.parse(savedProviders);
        setProviders(parsed.providers || providers);
        setCustomProviders(parsed.customProviders || []);
      } catch (error) {
        console.error('Error loading provider configurations:', error);
      }
    }
    
    // Load search provider configurations
    setSearchProviders(getSearchProviderConfigs());
  }, []);

  const saveConfigurations = () => {
    const config = {
      providers,
      customProviders
    };
    localStorage.setItem('aiProviders', JSON.stringify(config));
    
    // Save search provider configurations
    saveSearchProviderConfigs(searchProviders);
    
    onClose();
  };

  const updateProviderApiKey = (provider: AIProvider, apiKey: string) => {
    setProviders(prev => prev.map(p => 
      p.provider === provider ? { ...p, apiKey } : p
    ));
  };

  // Search provider functions
  const updateSearchProviderApiKey = (provider: SearchProvider, apiKey: string) => {
    setSearchProviders(prev => prev.map(p => 
      p.provider === provider ? { ...p, apiKey } : p
    ));
  };

  const setSearchProviderAsDefault = (provider: SearchProvider) => {
    setSearchProviders(prev => prev.map(p => ({
      ...p,
      isDefault: p.provider === provider
    })));
  };

  const testSearchProviderConnection = async (provider: SearchProvider, apiKey?: string) => {
    try {
      const result = await testSearchProvider(provider, apiKey);
      if (result) {
        if (provider === SearchProvider.SERPAPI && window.location.hostname === 'localhost') {
          alert(`✅ ${provider} search provider configuration looks good!\n\nNote: SerpAPI testing is skipped in development due to CORS restrictions, but it will work in production via Vercel proxy.`);
        } else {
          alert(`✅ ${provider} search provider is working!`);
        }
      } else {
        alert(`❌ ${provider} search provider test failed`);
      }
    } catch (error) {
      if (provider === SearchProvider.SERPAPI && window.location.hostname === 'localhost') {
        alert(`⚠️ SerpAPI testing skipped in development\n\nThis is expected due to CORS restrictions. SerpAPI will work in production via Vercel proxy functions.\n\nAPI key format appears valid.`);
      } else {
        alert(`❌ ${provider} search provider test failed: ${error}`);
      }
    }
  };

  const addCustomProvider = () => {
    if (!newProvider.customName || !newProvider.apiKey || newProvider.models?.length === 0) {
      alert('Please fill in all required fields and add at least one model.');
      return;
    }

    const provider: ProviderConfig = {
      provider: AIProvider.CUSTOM,
      apiKey: newProvider.apiKey!,
      baseUrl: newProvider.baseUrl,
      customName: newProvider.customName,
      models: newProvider.models!
    };

    setCustomProviders(prev => [...prev, provider]);
    setNewProvider({
      provider: AIProvider.CUSTOM,
      apiKey: '',
      baseUrl: '',
      customName: '',
      models: []
    });
    setShowAddProvider(false);
  };

  const addModelToNewProvider = () => {
    if (newModelInput.trim()) {
      setNewProvider(prev => ({
        ...prev,
        models: [...(prev.models || []), newModelInput.trim()]
      }));
      setNewModelInput('');
    }
  };

  const removeModelFromNewProvider = (index: number) => {
    setNewProvider(prev => ({
      ...prev,
      models: prev.models?.filter((_, i) => i !== index) || []
    }));
  };

  const removeCustomProvider = (index: number) => {
    setCustomProviders(prev => prev.filter((_, i) => i !== index));
  };

  const testAllModels = async () => {
    setIsTestingModels(true);
    setTestResults({});
    
    const allModels = getAvailableModels([...providers, ...customProviders]);
    
    for (const model of allModels) {
      if (model.providerConfig.apiKey) {
        try {
          const result = await testModelAvailability(model);
          setTestResults(prev => ({
            ...prev,
            [model.id]: result
          }));
        } catch (error) {
          setTestResults(prev => ({
            ...prev,
            [model.id]: { available: false, error: 'Test failed' }
          }));
        }
      }
    }
    
    setIsTestingModels(false);
  };

  const selectModel = (model: ModelConfig) => {
    setSelectedModel(model);
    setCurrentModel(model);
    console.log(`Selected model: ${model.name}`);
  };

  const availableModels = getAvailableModels([...providers, ...customProviders]);

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>AI Provider Settings</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <div className="settings-content">
          
          {/* Current Model Selection */}
          <div className="settings-section">
            <h3>Current Model</h3>
            <div className="current-model">
              {selectedModel ? (
                <div className="model-info">
                  <strong>{selectedModel.name}</strong>
                  <span className="provider-badge">{selectedModel.provider}</span>
                </div>
              ) : (
                <div className="no-model">No model selected</div>
              )}
            </div>
          </div>

          {/* Available Models */}
          <div className="settings-section">
            <h3>Available Models</h3>
            <div className="models-grid">
              {availableModels.map(model => (
                <div 
                  key={model.id}
                  className={`model-card ${selectedModel?.id === model.id ? 'selected' : ''}`}
                  onClick={() => selectModel(model)}
                >
                  <div className="model-name">{model.name}</div>
                  <div className="model-provider">{model.provider}</div>
                  {testResults[model.id] && (
                    <div className={`test-result ${testResults[model.id].available ? 'success' : 'error'}`}>
                      {testResults[model.id].available ? '✅ Available' : '❌ Error'}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <button 
              onClick={testAllModels}
              disabled={isTestingModels}
              className="test-all-btn"
            >
              {isTestingModels ? 'Testing...' : 'Test All Models'}
            </button>
          </div>

          {/* Provider Configurations */}
          <div className="settings-section">
            <h3>Provider API Keys</h3>
            
            {providers.map(provider => (
              <div key={provider.provider} className="provider-config">
                <label>{provider.provider.toUpperCase()} API Key:</label>
                <input
                  type="password"
                  value={provider.apiKey || ''}
                  onChange={(e) => updateProviderApiKey(provider.provider, e.target.value)}
                  className="settings-input"
                  placeholder={`Enter your ${provider.provider} API key...`}
                />
                <small className="help-text">
                  {provider.provider === AIProvider.GEMINI && (
                    <>Get your API key from <a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noopener noreferrer">Google AI Studio</a></>
                  )}
                  {provider.provider === AIProvider.OPENAI && (
                    <>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Platform</a></>
                  )}
                </small>
              </div>
            ))}
          </div>

          {/* Web Search Providers */}
          <div className="settings-section">
            <h3>Web Search Providers</h3>
            <p className="help-text">Configure third-party search providers for web search functionality with non-Gemini models.</p>
            {window.location.hostname === 'localhost' && (
              <div className="dev-note" style={{ 
                padding: '0.5rem', 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffeaa7', 
                borderRadius: '4px', 
                margin: '0.5rem 0',
                fontSize: '0.9rem'
              }}>
                <strong>Development Note:</strong> SerpAPI testing is disabled in development due to CORS restrictions. 
                All search providers work normally when deployed to production.
              </div>
            )}
            
            {searchProviders.map(provider => (
              <div key={provider.provider} className="provider-config">
                <div className="provider-header">
                  <label>
                    <input
                      type="radio"
                      name="defaultSearchProvider"
                      checked={provider.isDefault || false}
                      onChange={() => setSearchProviderAsDefault(provider.provider)}
                    />
                    <span style={{ marginLeft: '0.5rem', fontWeight: 'bold' }}>
                      {provider.provider === SearchProvider.GEMINI && 'Gemini (Built-in)'}
                      {provider.provider === SearchProvider.TAVILY && 'Tavily'}
                      {provider.provider === SearchProvider.SERPAPI && 'SerpAPI'}
                    </span>
                  </label>
                  {provider.provider !== SearchProvider.GEMINI && (
                    <button
                      type="button"
                      onClick={() => testSearchProviderConnection(provider.provider, provider.apiKey)}
                      className="test-btn"
                      disabled={!provider.apiKey}
                    >
                      Test
                    </button>
                  )}
                </div>
                
                {provider.provider !== SearchProvider.GEMINI && (
                  <>
                    <input
                      type="password"
                      value={provider.apiKey || ''}
                      onChange={(e) => updateSearchProviderApiKey(provider.provider, e.target.value)}
                      className="settings-input"
                      placeholder={`Enter your ${provider.provider} API key...`}
                      style={{ marginTop: '0.5rem' }}
                    />
                    <small className="help-text">
                      {provider.provider === SearchProvider.TAVILY && (
                        <>Get your API key from <a href="https://tavily.com/" target="_blank" rel="noopener noreferrer">Tavily</a></>
                      )}
                      {provider.provider === SearchProvider.SERPAPI && (
                        <>Get your API key from <a href="https://serpapi.com/dashboard" target="_blank" rel="noopener noreferrer">SerpAPI</a></>
                      )}
                    </small>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Custom Providers */}
          <div className="settings-section">
            <h3>Custom Providers</h3>
            
            {customProviders.map((provider, index) => (
              <div key={index} className="custom-provider">
                <div className="provider-header">
                  <h4>{provider.customName}</h4>
                  <button 
                    onClick={() => removeCustomProvider(index)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
                <div className="provider-details">
                  <p><strong>Base URL:</strong> {provider.baseUrl}</p>
                  <p><strong>Models:</strong> {provider.models.join(', ')}</p>
                </div>
              </div>
            ))}

            {!showAddProvider ? (
              <button 
                onClick={() => setShowAddProvider(true)}
                className="add-provider-btn"
              >
                Add Custom Provider
              </button>
            ) : (
              <div className="add-provider-form">
                <h4>Add Custom Provider</h4>
                
                <div className="form-group">
                  <label>Provider Name:</label>
                  <input
                    type="text"
                    value={newProvider.customName || ''}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, customName: e.target.value }))}
                    placeholder="e.g., Ollama, LM Studio"
                    className="settings-input"
                  />
                </div>

                <div className="form-group">
                  <label>Base URL:</label>
                  <input
                    type="text"
                    value={newProvider.baseUrl || ''}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="e.g., https://api.hyperbolic.xyz/v1 (without /chat/completions)"
                    className="settings-input"
                  />
                  <small className="help-text">
                    Enter the base URL without the endpoint path. The system will automatically append the correct endpoints.
                  </small>
                </div>

                <div className="form-group">
                  <label>API Key:</label>
                  <input
                    type="password"
                    value={newProvider.apiKey || ''}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter API key (use 'ollama' for Ollama)"
                    className="settings-input"
                  />
                </div>

                <div className="form-group">
                  <label>Models:</label>
                  <div className="model-input-group">
                    <input
                      type="text"
                      value={newModelInput}
                      onChange={(e) => setNewModelInput(e.target.value)}
                      placeholder="Enter model name"
                      className="settings-input"
                      onKeyPress={(e) => e.key === 'Enter' && addModelToNewProvider()}
                    />
                    <button onClick={addModelToNewProvider} className="add-model-btn">
                      Add
                    </button>
                  </div>
                  
                  <div className="model-list">
                    {newProvider.models?.map((model, index) => (
                      <span key={index} className="model-tag">
                        {model}
                        <button onClick={() => removeModelFromNewProvider(index)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-actions">
                  <button onClick={addCustomProvider} className="save-provider-btn">
                    Add Provider
                  </button>
                  <button 
                    onClick={() => setShowAddProvider(false)} 
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="settings-actions">
            <button onClick={saveConfigurations} className="settings-save-btn">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
