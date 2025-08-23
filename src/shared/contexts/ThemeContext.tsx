import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
  setMode: (mode: PaletteMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>('light');

  useEffect(() => {
    // 로컬 스토리지에서 테마 설정 불러오기
    const savedMode = localStorage.getItem('theme-mode') as PaletteMode;
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      setMode(savedMode);
    } else {
      // 시스템 설정 확인
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
      },
      secondary: {
        main: '#dc004e',
        light: '#ff5983',
        dark: '#9a0036',
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      text: {
        primary: mode === 'light' ? '#000000' : '#ffffff',
        secondary: mode === 'light' ? '#666666' : '#b0b0b0',
      },
    },
    typography: {
      h6: {
        fontSize: '1.1rem',
        fontWeight: 600,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.4,
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'light' 
              ? '0 2px 8px rgba(0,0,0,0.1)' 
              : '0 2px 8px rgba(0,0,0,0.3)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            minHeight: 44,
            minWidth: 44,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
            color: mode === 'light' ? '#000000' : '#ffffff',
            boxShadow: mode === 'light' 
              ? '0 1px 3px rgba(0,0,0,0.1)' 
              : '0 1px 3px rgba(0,0,0,0.3)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
            borderRight: mode === 'light' 
              ? '1px solid rgba(0,0,0,0.12)' 
              : '1px solid rgba(255,255,255,0.12)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: mode === 'light' ? '#ffffff' : '#2d2d2d',
              '& fieldset': {
                borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
              },
              '&.Mui-focused fieldset': {
                borderColor: mode === 'light' ? '#1976d2' : '#42a5f5',
              },
            },
            '& .MuiInputLabel-root': {
              color: mode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
            },
            '& .MuiInputBase-input': {
              color: mode === 'light' ? '#000000' : '#ffffff',
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
            color: mode === 'light' ? '#000000' : '#ffffff',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            color: mode === 'light' ? '#000000' : '#ffffff',
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            color: mode === 'light' ? '#000000' : '#ffffff',
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#2d2d2d',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? '#1976d2' : '#42a5f5',
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: mode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setMode }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
