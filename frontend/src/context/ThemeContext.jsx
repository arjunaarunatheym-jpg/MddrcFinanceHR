import { createContext, useContext, useState, useEffect } from 'react';
import { axiosInstance } from '../App';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState({
    primaryColor: '#3b82f6',
    secondaryColor: '#6366f1',
    companyName: 'Malaysian Defensive Driving and Riding Centre Sdn Bhd',
    logoUrl: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const response = await axiosInstance.get('/settings');
      setTheme({
        primaryColor: response.data.primary_color || '#3b82f6',
        secondaryColor: response.data.secondary_color || '#6366f1',
        companyName: response.data.company_name || 'Malaysian Defensive Driving and Riding Centre Sdn Bhd',
        logoUrl: response.data.logo_url || null
      });
    } catch (error) {
      console.error('Failed to load theme');
    } finally {
      setLoading(false);
    }
  };

  const refreshTheme = () => {
    loadTheme();
  };

  return (
    <ThemeContext.Provider value={{ ...theme, loading, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
