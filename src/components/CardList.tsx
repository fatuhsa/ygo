import React, { useEffect, useState, useCallback } from 'react';
import { Container, Typography, TextField, InputAdornment, Button, Box, CircularProgress, IconButton, Grid, Tooltip } from '@mui/material';
import { Search, Menu, Compass, Star, Gift, Briefcase, ArrowRightLeft, BarChart3, HelpCircle, X } from 'lucide-react';
import { YgoCard } from './YgoCard';
import { CardDetailsModal } from './CardDetailsModal';
import { FilterSidebar } from './FilterSidebar';
import { BoosterGacha } from './BoosterGacha';
import { DeckBuilder } from './DeckBuilder';
import { CardComparator } from './CardComparator';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { CardQuiz } from './CardQuiz';
import type { YgoCardData, FilterState } from '../types';
import { playClick } from '../utils/sound';

export const CardList: React.FC = () => {
  const [cards, setCards] = useState<YgoCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCard, setSelectedCard] = useState<YgoCardData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'explorer' | 'favorites' | 'deck' | 'comparator' | 'analytics' | 'quiz' | 'gacha'>('explorer');
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [favoriteCards, setFavoriteCards] = useState<YgoCardData[]>([]);
  const [comparisonCards, setComparisonCards] = useState<YgoCardData[]>([]);

  const handleAddToCompare = (card: YgoCardData) => {
    setComparisonCards(prev => {
      // Toggle if already exists
      if (prev.some(c => c.id === card.id)) {
        return prev.filter(c => c.id !== card.id);
      }
      if (prev.length >= 2) {
        alert('Comparison tray is full. Remove a card before adding another.');
        return prev;
      }
      return [...prev, card];
    });
  };

  const handleRemoveFromCompare = (cardId: number) => {
    setComparisonCards(prev => prev.filter(c => c.id !== cardId));
  };

  const handleClearCompare = () => {
    setComparisonCards([]);
  };

  const [activeFilters, setActiveFilters] = useState<FilterState>({
    archetype: null,
    type: null,
    attribute: null,
    level: null,
  });
  
  const limit = 20;

  // 1. Fetch search result from local offline SQLite DB
  const fetchCards = useCallback(async (
    reset: boolean = false, 
    currentSearch: string = '', 
    filters = activeFilters
  ) => {
    setLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      let url = `/api/cards?limit=${limit}&offset=${currentOffset}`;
      
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
      const json = await res.json();
      
      const newCards = json.data || [];
      setCards(prev => reset ? newCards : [...prev, ...newCards]);
      setHasMore(newCards.length === limit);
      setOffset(reset ? limit : currentOffset + limit);
    } catch (err) {
      console.error("Failed to fetch cards", err);
    } finally {
      setLoading(false);
    }
  }, [offset, activeFilters]);

  // 2. Fetch favorite cards from local SQLite DB
  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/favorites');
      if (res.ok) {
        const json = await res.json();
        const favList = json.data || [];
        setFavoriteCards(favList);
        setFavoriteIds(new Set(favList.map((c: YgoCardData) => c.id)));
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCards(true, '');
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync favorites when details modal is closed/opened (favorited status could change in modal)
  useEffect(() => {
    fetchFavorites();
  }, [selectedCard]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCards(true, searchTerm);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3, pb: comparisonCards.length > 0 ? { xs: 14, md: 3 } : 3, px: { xs: 1, sm: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header Panel */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' }, 
        gap: 2,
        pb: 2,
        pt: 1,
        position: { xs: 'static', md: 'sticky' },
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(5, 5, 6, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '2px solid #1f2229',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 234, 0, 0.05)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={() => setIsSidebarOpen(true)} 
            color="primary" 
            sx={{ 
              border: '1.5px solid #1f2229', 
              borderRadius: 0,
              bgcolor: 'rgba(255,234,0,0.02)',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'rgba(255,234,0,0.1)',
                boxShadow: '0 0 10px rgba(255, 234, 0, 0.2)'
              }
            }}
          >
            <Menu size={20} />
          </IconButton>
          <Box>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                color: 'primary.main', 
                fontWeight: 950, 
                textTransform: 'uppercase', 
                letterSpacing: '2px',
                fontFamily: '"Orbitron", sans-serif',
                textShadow: '0 0 10px rgba(255,234,0,0.3)',
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              YGO EXPLORER
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' }, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.65rem' }}>
              DATABASE TERMINAL // VER 2.0
            </Typography>
          </Box>
        </Box>

        {/* Tab Navigation Menu */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          border: '1px solid #1f2229', 
          p: 0.5, 
          bgcolor: '#050506',
          overflowX: 'auto',
          maxWidth: { xs: '100%', md: 'auto' },
          '&::-webkit-scrollbar': { display: 'none' }
        }}>
          <Tooltip title="Explorer" enterTouchDelay={0}>
            <Button
              size="small"
              onClick={() => { playClick(); setActiveTab('explorer'); }}
              sx={{
                color: activeTab === 'explorer' ? '#000000' : 'text.secondary',
                bgcolor: activeTab === 'explorer' ? 'primary.main' : 'transparent',
                fontFamily: '"Orbitron", sans-serif',
                fontWeight: 800,
                letterSpacing: '0.5px',
                borderRadius: 0,
                fontSize: '0.68rem',
                whiteSpace: 'nowrap',
                minWidth: { xs: '40px', md: 'auto' },
                px: { xs: 1.2, md: 2 },
                backgroundImage: activeTab === 'explorer' ? 'linear-gradient(135deg, #ffea00 0%, #d4c200 100%)' : 'none',
                '&:hover': {
                  bgcolor: activeTab === 'explorer' ? 'primary.main' : 'rgba(255,234,0,0.05)',
                  color: activeTab === 'explorer' ? '#000000' : 'primary.main',
                }
              }}
            >
              <Compass size={16} />
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' }, ml: 1 }}>
                EXPLORER
              </Box>
            </Button>
          </Tooltip>
          
          <Tooltip title="Favorites" enterTouchDelay={0}>
            <Button
              size="small"
              onClick={() => { playClick(); setActiveTab('favorites'); fetchFavorites(); }}
              sx={{
                color: activeTab === 'favorites' ? '#000000' : 'text.secondary',
                bgcolor: activeTab === 'favorites' ? 'primary.main' : 'transparent',
                fontFamily: '"Orbitron", sans-serif',
                fontWeight: 800,
                letterSpacing: '0.5px',
                borderRadius: 0,
                fontSize: '0.68rem',
                whiteSpace: 'nowrap',
                minWidth: { xs: '40px', md: 'auto' },
                px: { xs: 1.2, md: 2 },
                backgroundImage: activeTab === 'favorites' ? 'linear-gradient(135deg, #ffea00 0%, #d4c200 100%)' : 'none',
                '&:hover': {
                  bgcolor: activeTab === 'favorites' ? 'primary.main' : 'rgba(255,234,0,0.05)',
                  color: activeTab === 'favorites' ? '#000000' : 'primary.main',
                }
              }}
            >
              <Star size={16} />
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' }, ml: 1 }}>
                FAVORITES
              </Box>
            </Button>
          </Tooltip>

          <Tooltip title="Deck Builder" enterTouchDelay={0}>
            <Button
              size="small"
              onClick={() => { playClick(); setActiveTab('deck'); }}
              sx={{
                color: activeTab === 'deck' ? '#000000' : 'text.secondary',
                bgcolor: activeTab === 'deck' ? 'primary.main' : 'transparent',
                fontFamily: '"Orbitron", sans-serif',
                fontWeight: 800,
                letterSpacing: '0.5px',
                borderRadius: 0,
                fontSize: '0.68rem',
                whiteSpace: 'nowrap',
                minWidth: { xs: '40px', md: 'auto' },
                px: { xs: 1.2, md: 2 },
                backgroundImage: activeTab === 'deck' ? 'linear-gradient(135deg, #ffea00 0%, #d4c200 100%)' : 'none',
                '&:hover': {
                  bgcolor: activeTab === 'deck' ? 'primary.main' : 'rgba(255,234,0,0.05)',
                  color: activeTab === 'deck' ? '#000000' : 'primary.main',
                }
              }}
            >
              <Briefcase size={16} />
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' }, ml: 1 }}>
                DECK BUILDER
              </Box>
            </Button>
          </Tooltip>

          <Tooltip title="Comparator" enterTouchDelay={0}>
            <Button
              size="small"
              onClick={() => { playClick(); setActiveTab('comparator'); }}
              sx={{
                color: activeTab === 'comparator' ? '#000000' : 'text.secondary',
                bgcolor: activeTab === 'comparator' ? 'primary.main' : 'transparent',
                fontFamily: '"Orbitron", sans-serif',
                fontWeight: 800,
                letterSpacing: '0.5px',
                borderRadius: 0,
                fontSize: '0.68rem',
                whiteSpace: 'nowrap',
                minWidth: { xs: '40px', md: 'auto' },
                px: { xs: 1.2, md: 2 },
                backgroundImage: activeTab === 'comparator' ? 'linear-gradient(135deg, #ffea00 0%, #d4c200 100%)' : 'none',
                '&:hover': {
                  bgcolor: activeTab === 'comparator' ? 'primary.main' : 'rgba(255,234,0,0.05)',
                  color: activeTab === 'comparator' ? '#000000' : 'primary.main',
                }
              }}
            >
              <ArrowRightLeft size={16} />
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' }, ml: 1 }}>
                COMPARATOR
              </Box>
            </Button>
          </Tooltip>

          <Tooltip title="Analytics" enterTouchDelay={0}>
            <Button
              size="small"
              onClick={() => { playClick(); setActiveTab('analytics'); }}
              sx={{
                color: activeTab === 'analytics' ? '#000000' : 'text.secondary',
                bgcolor: activeTab === 'analytics' ? 'primary.main' : 'transparent',
                fontFamily: '"Orbitron", sans-serif',
                fontWeight: 800,
                letterSpacing: '0.5px',
                borderRadius: 0,
                fontSize: '0.68rem',
                whiteSpace: 'nowrap',
                minWidth: { xs: '40px', md: 'auto' },
                px: { xs: 1.2, md: 2 },
                backgroundImage: activeTab === 'analytics' ? 'linear-gradient(135deg, #ffea00 0%, #d4c200 100%)' : 'none',
                '&:hover': {
                  bgcolor: activeTab === 'analytics' ? 'primary.main' : 'rgba(255,234,0,0.05)',
                  color: activeTab === 'analytics' ? '#000000' : 'primary.main',
                }
              }}
            >
              <BarChart3 size={16} />
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' }, ml: 1 }}>
                ANALYTICS
              </Box>
            </Button>
          </Tooltip>

          <Tooltip title="Quiz Terminal" enterTouchDelay={0}>
            <Button
              size="small"
              onClick={() => { playClick(); setActiveTab('quiz'); }}
              sx={{
                color: activeTab === 'quiz' ? '#000000' : 'text.secondary',
                bgcolor: activeTab === 'quiz' ? 'primary.main' : 'transparent',
                fontFamily: '"Orbitron", sans-serif',
                fontWeight: 800,
                letterSpacing: '0.5px',
                borderRadius: 0,
                fontSize: '0.68rem',
                whiteSpace: 'nowrap',
                minWidth: { xs: '40px', md: 'auto' },
                px: { xs: 1.2, md: 2 },
                backgroundImage: activeTab === 'quiz' ? 'linear-gradient(135deg, #ffea00 0%, #d4c200 100%)' : 'none',
                '&:hover': {
                  bgcolor: activeTab === 'quiz' ? 'primary.main' : 'rgba(255,234,0,0.05)',
                  color: activeTab === 'quiz' ? '#000000' : 'primary.main',
                }
              }}
            >
              <HelpCircle size={16} />
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' }, ml: 1 }}>
                QUIZ
              </Box>
            </Button>
          </Tooltip>

          <Tooltip title="Booster Gacha" enterTouchDelay={0}>
            <Button
              size="small"
              onClick={() => { playClick(); setActiveTab('gacha'); }}
              sx={{
                color: activeTab === 'gacha' ? '#000000' : 'text.secondary',
                bgcolor: activeTab === 'gacha' ? 'primary.main' : 'transparent',
                fontFamily: '"Orbitron", sans-serif',
                fontWeight: 800,
                letterSpacing: '0.5px',
                borderRadius: 0,
                fontSize: '0.68rem',
                whiteSpace: 'nowrap',
                minWidth: { xs: '40px', md: 'auto' },
                px: { xs: 1.2, md: 2 },
                backgroundImage: activeTab === 'gacha' ? 'linear-gradient(135deg, #ffea00 0%, #d4c200 100%)' : 'none',
                '&:hover': {
                  bgcolor: activeTab === 'gacha' ? 'primary.main' : 'rgba(255,234,0,0.05)',
                  color: activeTab === 'gacha' ? '#000000' : 'primary.main',
                }
              }}
            >
              <Gift size={16} />
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' }, ml: 1 }}>
                GACHA
              </Box>
            </Button>
          </Tooltip>
        </Box>

        {activeTab === 'explorer' && (
          <Box component="form" onSubmit={handleSearch} sx={{ width: { xs: '100%', md: '300px' } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="SEARCH CARD DATABASE..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="#ffea00" style={{ filter: 'drop-shadow(0 0 2px #ffea00)' }} />
                    </InputAdornment>
                  ),
                },
                htmlInput: {
                  style: { 
                    color: '#ffffff', 
                    fontWeight: 600, 
                    letterSpacing: '0.5px',
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '0.85rem'
                  },
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#0c0d10',
                  '&:hover fieldset': { borderColor: '#4d5360' },
                  '&.Mui-focused fieldset': { 
                    borderColor: 'primary.main',
                    boxShadow: '0 0 10px rgba(255, 234, 0, 0.15)'
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#5a6273',
                  letterSpacing: '1px',
                  fontSize: '0.75rem',
                  opacity: 1,
                }
              }}
            />
          </Box>
        )}
      </Box>

      {/* Tab Panels */}
      {activeTab === 'explorer' && (
        <>
          <Grid container spacing={2}>
            {cards.map(card => (
              <Grid key={card.id} size={{ xs: 6, sm: 4, md: 3, lg: 2, xl: 1.5 }}>
                <YgoCard 
                  card={card} 
                  onClick={setSelectedCard} 
                  isFavorited={favoriteIds.has(card.id)} 
                  onAddToCompare={handleAddToCompare}
                  isComparing={comparisonCards.some(c => c.id === card.id)}
                />
              </Grid>
            ))}
          </Grid>

          {cards.length === 0 && !loading && (
            <Typography color="text.secondary" sx={{ py: 8, textAlign: 'center', fontFamily: '"Orbitron", sans-serif' }} component="div">
              NO CORRESPONDING DATA OVERLAYS FOUND.
            </Typography>
          )}

          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => fetchCards(false, searchTerm)}
                disabled={loading}
                size="large"
                sx={{
                  px: 6,
                  py: 1.5,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,234,0,0.1), transparent)',
                    transform: 'translateX(-100%)',
                    transition: 'transform 0.5s ease-in-out',
                  },
                  '&:hover::after': {
                    transform: 'translateX(100%)',
                  }
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'INITIATE LOAD MORE'}
              </Button>
            </Box>
          )}
        </>
      )}

      {activeTab === 'favorites' && (
        <>
          <Typography variant="h6" sx={{ fontFamily: '"Orbitron", sans-serif', color: 'primary.main', mb: 1, fontWeight: 800 }}>
            SECURED FAVORITES INDEX ({favoriteCards.length})
          </Typography>
          
          <Grid container spacing={2}>
            {favoriteCards.map(card => (
              <Grid key={card.id} size={{ xs: 6, sm: 4, md: 3, lg: 2, xl: 1.5 }}>
                <YgoCard 
                  card={card} 
                  onClick={setSelectedCard} 
                  isFavorited={true} 
                  onAddToCompare={handleAddToCompare}
                  isComparing={comparisonCards.some(c => c.id === card.id)}
                />
              </Grid>
            ))}
          </Grid>

          {favoriteCards.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 8, textAlign: 'center', fontFamily: '"Orbitron", sans-serif' }} component="div">
              NO SECURED DATA RECORDED. CLICK THE STAR ICON ON CARD DETAILS TO SECURE METADATA.
            </Typography>
          )}
        </>
      )}

      {activeTab === 'gacha' && <BoosterGacha />}
      {activeTab === 'deck' && <DeckBuilder />}
      {activeTab === 'comparator' && (
        <CardComparator 
          comparisonCards={comparisonCards} 
          onRemoveCard={handleRemoveFromCompare}
          onAddCard={handleAddToCompare}
          onClear={handleClearCompare}
        />
      )}
      {activeTab === 'analytics' && <AnalyticsDashboard />}
      {activeTab === 'quiz' && <CardQuiz />}

      {/* Details Dialog */}
      <CardDetailsModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      
      {/* Sidebar drawer */}
      <FilterSidebar 
        open={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        filters={activeFilters}
        onFilterChange={(newFilters) => {
          setActiveFilters(newFilters);
          fetchCards(true, searchTerm, newFilters);
        }}
      />

      {/* Floating comparison dock */}
      {comparisonCards.length > 0 && activeTab !== 'comparator' && (
        <Box sx={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999,
          bgcolor: '#0c0d10',
          border: '1.5px solid #ffea00',
          boxShadow: '0 8px 32px rgba(0,0,0,0.85), 0 0 15px rgba(255, 234, 0, 0.2)',
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          width: '90%',
          maxWidth: '550px',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
            <Typography variant="caption" sx={{ color: '#ffea00', fontWeight: 900, fontFamily: '"Orbitron", sans-serif', letterSpacing: '0.5px' }}>
              COMPARE:
            </Typography>
            {comparisonCards.map(card => (
              <Box key={card.id} sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.8,
                bgcolor: '#050506',
                border: '1px solid #1f2229',
                px: 1.2,
                py: 0.4
              }}>
                <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 800, whiteSpace: 'nowrap', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.7rem' }}>
                  {card.name}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleRemoveFromCompare(card.id)}
                  sx={{ color: '#ff5555', p: 0.1 }}
                >
                  <X size={10} />
                </IconButton>
              </Box>
            ))}
          </Box>

          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={() => {
              playClick();
              setActiveTab('comparator');
            }}
            sx={{ borderRadius: 0, fontFamily: '"Orbitron", sans-serif', fontSize: '0.65rem', fontWeight: 900, py: 0.8, px: 2, whiteSpace: 'nowrap' }}
          >
            COMPARE
          </Button>
        </Box>
      )}
    </Container>
  );
};
