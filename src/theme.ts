import { createTheme } from '@mui/material';

export const inkAndSteelTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffea00', // Electric Yellow
      light: '#fff250',
      dark: '#c4b300',
    },
    secondary: {
      main: '#ffffff', // Pure White
    },
    background: {
      default: '#050506', // Darker Obsidian
      paper: '#0c0d10',   // Sleeker Dark
    },
    text: {
      primary: '#ffffff',
      secondary: '#8e94a2', // Modern slate gray
    },
    divider: '#1f2229', // Sleek cyber border
  },
  typography: {
    fontFamily: '"Outfit", "Inter", sans-serif',
    h1: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 900,
      letterSpacing: '0.05em',
    },
    h4: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 900,
      letterSpacing: '0.02em',
    },
    h5: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 900,
      letterSpacing: '0.05em',
    },
    h6: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 800,
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
    },
  },
  shape: {
    borderRadius: 0, // Keep sharp geometric corners
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#1f2229 #070708',
          scrollbarWidth: 'thin',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: 0,
          textTransform: 'uppercase',
          fontWeight: 800,
          letterSpacing: '1.5px',
          fontFamily: '"Orbitron", sans-serif',
          borderWidth: '1.5px',
          padding: '8px 18px',
          transition: 'all 0.2s ease-in-out',
          ...(ownerState.variant === 'contained' &&
            ownerState.color === 'primary' && {
              color: '#000000',
              backgroundImage: 'linear-gradient(135deg, #ffea00 0%, #d4c200 100%)',
              '&:hover': {
                backgroundImage: 'linear-gradient(135deg, #ffff33 0%, #ffea00 100%)',
                boxShadow: '0 0 15px rgba(255, 234, 0, 0.4)',
              },
            }),
          ...(ownerState.variant === 'outlined' &&
            ownerState.color === 'primary' && {
              borderColor: '#ffea00',
              borderWidth: '1.5px',
              backgroundColor: 'rgba(255, 234, 0, 0.03)',
              '&:hover': {
                borderWidth: '1.5px',
                backgroundColor: 'rgba(255, 234, 0, 0.1)',
                boxShadow: '0 0 10px rgba(255, 234, 0, 0.2)',
              },
            }),
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1.5px solid #1f2229',
          backgroundImage: 'none',
          backgroundColor: '#0c0d10',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            backgroundColor: 'transparent',
            transition: 'background-color 0.2s ease',
          },
          '&:hover': {
            borderColor: '#ffea00',
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 12px rgba(255, 234, 0, 0.15)',
            '&::before': {
              backgroundColor: '#ffea00',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: '2px solid #ffea00', // Neon highlight
          backgroundImage: 'none',
          backgroundColor: '#070708',
          boxShadow: '0 0 30px rgba(255, 234, 0, 0.15)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#070708',
          borderRight: '2px solid #1f2229',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            '& fieldset': {
              borderColor: '#1f2229',
              borderWidth: '1.5px',
            },
            '&:hover fieldset': {
              borderColor: '#4d5360',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#ffea00',
            },
          },
        },
      },
    },
  },
});
