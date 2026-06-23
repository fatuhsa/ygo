import React, { useState } from 'react';
import { Box, Typography, Button, Paper, TextField, InputAdornment, Grid, CardMedia, IconButton, Divider } from '@mui/material';
import { Trash2, X, Shield, Swords, Star, Search, ArrowRightLeft } from 'lucide-react';
import type { YgoCardData } from '../types';
import { playClick, playHover } from '../utils/sound';

interface CardComparatorProps {
  comparisonCards: YgoCardData[];
  onRemoveCard: (id: number) => void;
  onAddCard: (card: YgoCardData) => void;
  onClear: () => void;
}

export const CardComparator: React.FC<CardComparatorProps> = ({
  comparisonCards,
  onRemoveCard,
  onAddCard,
  onClear,
}) => {
  const [searchQueries, setSearchQueries] = useState<[string, string]>(['', '']);
  const [searchResults, setSearchResults] = useState<[YgoCardData[], YgoCardData[]]>([[], []]);


  const searchCardsForSlot = async (slotIdx: number, query: string) => {
    if (!query.trim()) {
      setSearchResults(prev => {
        const next = [...prev] as [YgoCardData[], YgoCardData[]];
        next[slotIdx] = [];
        return next;
      });
      return;
    }

    // searching is unused

    try {
      const res = await fetch(`/api/cards?fname=${encodeURIComponent(query)}&limit=5`);
      const json = await res.json();
      setSearchResults(prev => {
        const next = [...prev] as [YgoCardData[], YgoCardData[]];
        next[slotIdx] = json.data || [];
        return next;
      });
    } catch (e) {
      console.error('Failed to search comparator slot:', e);
    }
  };

  const handleSearchChange = (slotIdx: number, val: string) => {
    setSearchQueries(prev => {
      const next = [...prev] as [string, string];
      next[slotIdx] = val;
      return next;
    });
    searchCardsForSlot(slotIdx, val);
  };

  const handleSelectCard = (slotIdx: number, card: YgoCardData) => {
    playClick();
    onAddCard(card);
    setSearchQueries(prev => {
      const next = [...prev] as [string, string];
      next[slotIdx] = '';
      return next;
    });
    setSearchResults(prev => {
      const next = [...prev] as [YgoCardData[], YgoCardData[]];
      next[slotIdx] = [];
      return next;
    });
  };

  // Extract card prices safely
  const getCardPrice = (card: YgoCardData | undefined, type: 'tcg' | 'cm') => {
    if (!card || !card.card_prices || card.card_prices.length === 0) return 0;
    if (type === 'tcg') {
      return parseFloat(card.card_prices[0].tcgplayer_price) || 0;
    } else {
      return parseFloat(card.card_prices[0].cardmarket_price) || 0;
    }
  };

  const card1 = comparisonCards[0];
  const card2 = comparisonCards[1];

  // Compare functions
  const getStatHighlight = (val1: number | undefined, val2: number | undefined, target: 'atk' | 'def' | 'level' | 'price') => {
    if (val1 === undefined || val2 === undefined) return { color: '#ffffff', shadow: 'none' };
    
    // For price, lower is better. For others, higher is better.
    let isBetter = false;
    let isWorse = false;

    if (target === 'price') {
      isBetter = val1 < val2;
      isWorse = val1 > val2;
    } else {
      isBetter = val1 > val2;
      isWorse = val1 < val2;
    }

    if (isBetter) {
      return { color: '#a6e3a1', shadow: '0 0 8px rgba(166, 227, 161, 0.4)' }; // neon green
    }
    if (isWorse) {
      return { color: '#ff5555', shadow: '0 0 8px rgba(255, 85, 85, 0.4)' }; // neon red
    }
    return { color: '#ffffff', shadow: 'none' }; // equal
  };

  const renderSlot = (slotIdx: number, card: YgoCardData | undefined) => {
    if (card) {
      return (
        <Paper sx={{ 
          p: 3, 
          bgcolor: '#0c0d10', 
          border: '1.5px solid #1f2229', 
          borderRadius: 0,
          backgroundImage: 'none',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}>
          <IconButton 
            onClick={() => { playClick(); onRemoveCard(card.id); }}
            sx={{ 
              position: 'absolute', 
              top: 10, 
              right: 10, 
              color: '#5a6273',
              '&:hover': { color: '#ff5555' }
            }}
          >
            <X size={18} />
          </IconButton>

          <CardMedia
            component="img"
            image={`https://images.ygoprodeck.com/images/cards/${card.id}.jpg`}
            alt={card.name}
            sx={{
              width: '100%',
              maxWidth: '220px',
              aspectRatio: '2/3',
              mb: 2.5,
              border: '2px solid #1f2229',
              boxShadow: '0 8px 16px rgba(0,0,0,0.6)'
            }}
          />

          <Typography variant="h6" sx={{ fontWeight: 900, textAlign: 'center', mb: 0.5, color: '#ffffff', fontFamily: '"Outfit", sans-serif', letterSpacing: '0.5px' }}>
            {card.name.toUpperCase()}
          </Typography>
          
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, mb: 3, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {card.type}
          </Typography>

          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Divider sx={{ borderColor: '#1f2229' }} />
            
            {/* Attribute & Level */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#5a6273', fontWeight: 700 }}>ATTRIBUTE</Typography>
              <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 800 }}>{card.attribute || 'N/A'}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#5a6273', fontWeight: 700 }}>LEVEL / RANK</Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 900,
                  color: getStatHighlight(
                    card.level, 
                    slotIdx === 0 ? card2?.level : card1?.level, 
                    'level'
                  ).color,
                  textShadow: getStatHighlight(
                    card.level, 
                    slotIdx === 0 ? card2?.level : card1?.level, 
                    'level'
                  ).shadow
                }}
              >
                {card.level !== undefined ? card.level : 'N/A'}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: '#1f2229' }} />

            {/* ATK */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#5a6273' }}>
                <Swords size={15} />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>ATK</Typography>
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 900,
                  fontFamily: '"Orbitron", sans-serif',
                  color: getStatHighlight(
                    card.atk, 
                    slotIdx === 0 ? card2?.atk : card1?.atk, 
                    'atk'
                  ).color,
                  textShadow: getStatHighlight(
                    card.atk, 
                    slotIdx === 0 ? card2?.atk : card1?.atk, 
                    'atk'
                  ).shadow
                }}
              >
                {card.atk !== undefined ? card.atk : 'N/A'}
              </Typography>
            </Box>

            {/* DEF */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#5a6273' }}>
                <Shield size={15} />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>DEF</Typography>
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 900,
                  fontFamily: '"Orbitron", sans-serif',
                  color: getStatHighlight(
                    card.def, 
                    slotIdx === 0 ? card2?.def : card1?.def, 
                    'def'
                  ).color,
                  textShadow: getStatHighlight(
                    card.def, 
                    slotIdx === 0 ? card2?.def : card1?.def, 
                    'def'
                  ).shadow
                }}
              >
                {card.def !== undefined ? card.def : 'N/A'}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: '#1f2229' }} />

            {/* Prices */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#5a6273', fontWeight: 700 }}>TCGPLAYER PRICE</Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 900, 
                  fontFamily: '"Orbitron", sans-serif',
                  color: getStatHighlight(
                    getCardPrice(card, 'tcg'),
                    getCardPrice(slotIdx === 0 ? card2 : card1, 'tcg'),
                    'price'
                  ).color,
                  textShadow: getStatHighlight(
                    getCardPrice(card, 'tcg'),
                    getCardPrice(slotIdx === 0 ? card2 : card1, 'tcg'),
                    'price'
                  ).shadow
                }}
              >
                ${getCardPrice(card, 'tcg').toFixed(2)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#5a6273', fontWeight: 700 }}>CARDMARKET PRICE</Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 900, 
                  fontFamily: '"Orbitron", sans-serif',
                  color: getStatHighlight(
                    getCardPrice(card, 'cm'),
                    getCardPrice(slotIdx === 0 ? card2 : card1, 'cm'),
                    'price'
                  ).color,
                  textShadow: getStatHighlight(
                    getCardPrice(card, 'cm'),
                    getCardPrice(slotIdx === 0 ? card2 : card1, 'cm'),
                    'price'
                  ).shadow
                }}
              >
                €{getCardPrice(card, 'cm').toFixed(2)}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: '#1f2229' }} />

            {/* Desc */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: '#5a6273', fontWeight: 700, display: 'block', mb: 0.5, letterSpacing: '0.5px' }}>
                EFFECT / DESCRIPTION
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#9ba4b5', 
                  display: 'block', 
                  maxHeight: '120px', 
                  overflowY: 'auto', 
                  lineHeight: 1.4,
                  pr: 0.5,
                  textAlign: 'justify',
                  fontFamily: '"Outfit", sans-serif',
                  '&::-webkit-scrollbar': { width: '4px' },
                  '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                  '&::-webkit-scrollbar-thumb': { bgcolor: '#1f2229' }
                }}
              >
                {card.desc}
              </Typography>
            </Box>
          </Box>
        </Paper>
      );
    }

    return (
      <Paper sx={{ 
        p: 4, 
        bgcolor: '#0c0d10', 
        border: '1.5px dashed #1f2229', 
        borderRadius: 0,
        backgroundImage: 'none',
        height: '100%',
        minHeight: '450px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3
      }}>
        <Box sx={{ p: 2, border: '1.5px solid #1f2229', color: '#5a6273', bgcolor: 'rgba(255,254,0,0.01)' }}>
          <Star size={32} style={{ opacity: 0.4 }} />
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#ffffff', letterSpacing: '1px', fontFamily: '"Orbitron", sans-serif', mb: 0.5 }}>
            SLOT EMPTY
          </Typography>
          <Typography variant="caption" sx={{ color: '#5a6273', display: 'block', maxWidth: '250px' }}>
            Search database below or add a card via the Explorer tab to comparative verify.
          </Typography>
        </Box>

        {/* Local Search Input inside Comparator */}
        <Box sx={{ width: '100%', maxWidth: '280px', position: 'relative' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="SEARCH CARD..."
            value={searchQueries[slotIdx]}
            onChange={(e) => handleSearchChange(slotIdx, e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={15} color="#ffea00" />
                  </InputAdornment>
                ),
              },
              htmlInput: {
                style: { color: '#ffffff', fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem' }
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#050506',
                borderRadius: 0,
                '& fieldset': { borderColor: '#1f2229' },
                '&:hover fieldset': { borderColor: '#4d5360' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' }
              }
            }}
          />

          {/* Autocomplete Dropdown */}
          {searchResults[slotIdx].length > 0 && (
            <Box sx={{
              position: 'absolute',
              top: '105%',
              left: 0,
              right: 0,
              bgcolor: '#0c0d10',
              border: '1.5px solid #1f2229',
              zIndex: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.8)'
            }}>
              {searchResults[slotIdx].map((c) => (
                <Box
                  key={c.id}
                  onClick={() => handleSelectCard(slotIdx, c)}
                  onMouseEnter={() => playHover()}
                  sx={{
                    p: 1.2,
                    cursor: 'pointer',
                    borderBottom: '1px solid #15181e',
                    '&:hover': { bgcolor: '#1a1d24', color: 'primary.main' },
                    transition: 'all 0.15s'
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>
                    {c.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#5a6273', fontSize: '0.65rem' }}>
                    {c.type.replace(' Monster', '').toUpperCase()}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Paper>
    );
  };

  return (
    <Box sx={{ py: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Title Header */}
      <Paper sx={{ 
        p: 3, 
        bgcolor: '#0c0d10', 
        border: '1.5px solid #1f2229', 
        borderRadius: 0,
        backgroundImage: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ArrowRightLeft size={22} className="text-yellow-400" style={{ color: '#ffea00', filter: 'drop-shadow(0 0 4px #ffea00)' }} />
          <Box>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900, letterSpacing: '1px', display: 'block' }}>
              NEURAL COMPARISON PANEL
            </Typography>
            <Typography variant="caption" sx={{ color: '#5a6273', display: 'block' }}>
              Select two cards to compare attribute, ATK/DEF, and market value metrics.
            </Typography>
          </Box>
        </Box>

        {comparisonCards.length > 0 && (
          <Button 
            variant="outlined" 
            color="error" 
            onClick={() => { playClick(); onClear(); }}
            startIcon={<Trash2 size={16} />}
            sx={{ border: '1.5px solid', borderRadius: 0, py: 1 }}
          >
            CLEAR TRAYS
          </Button>
        )}
      </Paper>

      {/* Main Grid */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          {renderSlot(0, card1)}
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          {renderSlot(1, card2)}
        </Grid>
      </Grid>
    </Box>
  );
};
