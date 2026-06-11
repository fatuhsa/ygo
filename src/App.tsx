import { ThemeProvider, CssBaseline } from '@mui/material';
import { catppuccinMocha } from './theme';
import { CardList } from './components/CardList';

function App() {
  return (
    <ThemeProvider theme={catppuccinMocha}>
      <CssBaseline />
      <CardList />
    </ThemeProvider>
  );
}

export default App;
