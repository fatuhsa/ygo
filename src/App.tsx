import { ThemeProvider, CssBaseline } from '@mui/material';
import { inkAndSteelTheme } from './theme';
import { CardList } from './components/CardList';

function App() {
  return (
    <ThemeProvider theme={inkAndSteelTheme}>
      <CssBaseline />
      <div className="cyber-scanlines"></div>
      <CardList />
    </ThemeProvider>
  );
}

export default App;
