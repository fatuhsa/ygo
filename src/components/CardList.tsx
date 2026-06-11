import React, { useEffect, useState, useCallback } from 'react';
import { Container, Typography, TextField, InputAdornment, Button, Box, CircularProgress, IconButton, Grid } from '@mui/material';
import { Search, Menu } from 'lucide-react';
import { YgoCard } from './YgoCard';
import { CardDetailsModal } from './CardDetailsModal';
import { FilterSidebar } from './FilterSidebar';
import type { YgoCardData, FilterState } from '../types';

export const CardList: React.FC = () => {
  const [cards, setCards] = useState<YgoCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCard, setSelectedCard] = useState<YgoCardData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    archetype: null,
    type: null,
    attribute: null,
    level: null,
  });
  
  const limit = 20;

  const fetchCards = useCallback(async (
    reset: boolean = false, 
    currentSearch: string = '', 
    filters = activeFilters
  ) => {
    setLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      let url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${limit}&offset=${currentOffset}`;
      
      if (currentSearch) {
        url += `&fname=${encodeURIComponent(currentSearch)}`;
      }

      if (filters.archetype) {
        url += `&archetype=${encodeURIComponent(filters.archetype)}`;
      }

      if (filters.type) {
        url += `&type=${encodeURIComponent(filters.type)}`;
      }

      if (filters.attribute) {
        url += `&attribute=${encodeURIComponent(filters.attribute)}`;
      }

      if (filters.level) {
        url += `&level=${encodeURIComponent(filters.level)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      
      if (data.error) {
        if (reset) setCards([]);
        setHasMore(false);
      } else {
        const newCards = data.data || [];
        setCards(prev => reset ? newCards : [...prev, ...newCards]);
        setHasMore(newCards.length === limit);
        setOffset(reset ? limit : currentOffset + limit);
      }
    } catch (err) {
      console.error("Failed to fetch cards", err);
    } finally {
      setLoading(false);
    }
  }, [offset, activeFilters]);

  // Initial load
  useEffect(() => {
    fetchCards(true, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCards(true, searchTerm);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2, px: { xs: 1, sm: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' }, 
        gap: 2,
        pb: 1.5,
        borderBottom: '1px solid #333'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={() => setIsSidebarOpen(true)} color="primary" sx={{ border: '1px solid #333' }}>
            <Menu size={24} />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ color: 'primary.main', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
            YGO Explorer
          </Typography>
        </Box>
        <Box component="form" onSubmit={handleSearch} sx={{ width: { xs: '100%', md: '400px' } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search card name..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color="#ffea00" />
                  </InputAdornment>
                ),
              },
              htmlInput: {
                style: { color: '#ffffff', fontWeight: 500 },
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#111',
                '& fieldset': { borderColor: '#333' },
                '&:hover fieldset': { borderColor: '#555' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' },
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#888',
                opacity: 1,
              }
            }}
          />
        </Box>
      </Box>

      <Grid container spacing={2}>
        {cards.map(card => (
          <Grid key={card.id} size={{ xs: 6, sm: 4, md: 3, lg: 2, xl: 1.5 }}>
            <YgoCard card={card} onClick={setSelectedCard} />
          </Grid>
        ))}
      </Grid>

      {cards.length === 0 && !loading && (
        <Typography color="text.secondary" sx={{ py: 8, textAlign: 'center' }} component="div">
          No cards found.
        </Typography>
      )}

      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => fetchCards(false, searchTerm)}
            disabled={loading}
            size="large"
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Load More'}
          </Button>
        </Box>
      )}

      <CardDetailsModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      
      <FilterSidebar 
        open={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        filters={activeFilters}
        onFilterChange={(newFilters) => {
          setActiveFilters(newFilters);
          fetchCards(true, searchTerm, newFilters);
        }}
      />
    </Container>
  );
};
