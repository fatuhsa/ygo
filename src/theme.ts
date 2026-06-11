import { createTheme } from '@mui/material';

export const catppuccinMocha = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#89b4fa' },  // blue
    secondary: { main: '#cba6f7' }, // mauve
    background: { default: '#1e1e2e', paper: '#181825' },
    text: { primary: '#cdd6f4', secondary: '#a6adc8' },
    error: { main: '#f38ba8' },
    warning: { main: '#fab387' },
    info: { main: '#89b4fa' },
    success: { main: '#a6e3a1' },
  },
  typography: { fontFamily: 'Inter, sans-serif' },
});
