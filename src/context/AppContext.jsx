import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [colabUrl, setColabUrl] = useState('');
  const [activeMode, setActiveMode] = useState('hybrid');
  const [colabStatus, setColabStatus] = useState({
    online: false,
    latency: 0,
    message: 'Checking connection...',
    loading: true,
  });
  const [toastMessage, setToastMessage] = useState(null);
  const [prefillEnquiryData, setPrefillEnquiryData] = useState(null);

  // Show Toast Notification
  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Colab Config from SQLite Backend
  const fetchConfig = async () => {
    try {
      const res = await axios.get('/api/colab/config');
      if (res.data.success) {
        setColabUrl(res.data.colabUrl || '');
        setActiveMode(res.data.activeMode || 'hybrid');
      }
    } catch (err) {
      console.warn('Backend config fetch failed:', err.message);
    }
  };

  // Ping Colab API Endpoint Status
  const checkColabStatus = async () => {
    setColabStatus(prev => ({ ...prev, loading: true }));
    try {
      const res = await axios.get('/api/colab/status');
      setColabStatus({
        online: res.data.online,
        latency: res.data.latency || 0,
        message: res.data.message || (res.data.online ? 'Online' : 'Offline'),
        colabUrl: res.data.colabUrl || colabUrl,
        loading: false,
      });
    } catch (err) {
      setColabStatus({
        online: false,
        latency: 0,
        message: 'Could not reach SQLite backend proxy.',
        loading: false,
      });
    }
  };

  // Save Config to SQLite
  const saveColabConfig = async (newUrl, newMode) => {
    try {
      const res = await axios.post('/api/colab/config', {
        colabUrl: newUrl,
        activeMode: newMode,
      });
      if (res.data.success) {
        setColabUrl(res.data.colabUrl);
        setActiveMode(res.data.activeMode);
        showToast('Settings saved to SQLite database!', 'success');
        checkColabStatus();
        return true;
      }
    } catch (err) {
      showToast(`Failed to save settings: ${err.message}`, 'error');
      return false;
    }
  };

  // Pre-fill enquiry form from Chat message
  const prefillEnquiry = (queryText) => {
    setPrefillEnquiryData({
      subject: `Enquiry regarding: ${queryText.slice(0, 45)}...`,
      message: `Hello, I submitted the following question to the chat bot: "${queryText}". I would like further details.`,
      category: 'General',
    });
    setActiveTab('enquiry');
    showToast('Transferred details to formal Enquiry Lead form!', 'info');
  };

  useEffect(() => {
    fetchConfig();
    checkColabStatus();
    // Refresh status every 25s
    const interval = setInterval(checkColabStatus, 25000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        colabUrl,
        activeMode,
        colabStatus,
        checkColabStatus,
        saveColabConfig,
        toastMessage,
        showToast,
        prefillEnquiryData,
        setPrefillEnquiryData,
        prefillEnquiry,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
