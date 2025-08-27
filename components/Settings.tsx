import React, { useState } from 'react';
import { testAllModels, runComprehensiveTest, ModelTestResult } from '../utils/modelTester';

interface SettingsProps {
  apiKey: string;
  onApiKeyChange: (newKey: string) => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ apiKey, onApiKeyChange, onClose }) => {
  const [newApiKey, setNewApiKey] = useState(apiKey);
  const [isTestingModels, setIsTestingModels] = useState(false);
  const [testResults, setTestResults] = useState<ModelTestResult[]>([]);

  const handleSave = () => {
    onApiKeyChange(newApiKey);
    onClose();
  };

  const handleTestModels = async () => {
    setIsTestingModels(true);
    setTestResults([]);
    
    try {
      console.log('🚀 Starting model tests from Settings panel...');
      const results = await testAllModels(newApiKey);
      setTestResults(results);
    } catch (error) {
      console.error('❌ Model testing failed:', error);
    } finally {
      setIsTestingModels(false);
    }
  };

  const handleComprehensiveTest = async () => {
    setIsTestingModels(true);
    setTestResults([]);
    
    try {
      console.log('🔬 Starting comprehensive model tests...');
      const { regular, streaming } = await runComprehensiveTest(newApiKey);
      setTestResults(regular);
    } catch (error) {
      console.error('❌ Comprehensive testing failed:', error);
    } finally {
      setIsTestingModels(false);
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <div className="settings-content">
          <div className="settings-item">
            <label htmlFor="api-key">Gemini API Key:</label>
            <input
              id="api-key"
              type="password"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              className="settings-input"
              placeholder="Enter your API key..."
            />
            <small className="help-text">
              Get your API key from <a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
            </small>
          </div>
          
          <div className="settings-item">
            <label>Model Testing:</label>
            <div className="model-testing">
              <button 
                onClick={handleTestModels} 
                disabled={isTestingModels || !newApiKey}
                className="test-btn"
              >
                {isTestingModels ? '🧪 Testing...' : '🧪 Test All Models'}
              </button>
              <button 
                onClick={handleComprehensiveTest} 
                disabled={isTestingModels || !newApiKey}
                className="test-btn comprehensive"
              >
                {isTestingModels ? '🔬 Running...' : '🔬 Comprehensive Test'}
              </button>
            </div>
            <small className="help-text">
              Test which models are available with your API key. Check browser console (F12) for detailed results.
            </small>
            
            {testResults.length > 0 && (
              <div className="test-results">
                <h4>Test Results:</h4>
                <div className="results-grid">
                  {testResults.map((result) => (
                    <div key={result.model} className={`result-item ${result.available ? 'success' : 'error'}`}>
                      <div className="result-model">{result.model}</div>
                      <div className="result-status">
                        {result.available ? (
                          <>
                            <span className="status-icon">✅</span>
                            <span className="response-time">{result.responseTime}ms</span>
                          </>
                        ) : (
                          <>
                            <span className="status-icon">❌</span>
                            <span className="error-msg">{result.error}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="settings-actions">
            <button onClick={handleSave} className="settings-save-btn">
              Save & Close
            </button>
            <button onClick={onClose} className="settings-cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
