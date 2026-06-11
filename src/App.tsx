import { ThemeProvider, CssBaseline } from '@mui/material';
import { inkAndSteelTheme } from './theme';
import { CardList } from './components/CardList';

function App() {
  return (
    <ThemeProvider theme={inkAndSteelTheme}>
      <CssBaseline />
      <CardList />
    </ThemeProvider>
  );
}

export default App;
