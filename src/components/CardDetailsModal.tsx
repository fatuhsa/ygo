import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, Typography, Box, Grid, Chip, Skeleton, useMediaQuery, useTheme, Slide, Paper, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { X, Shield, Swords, Star, Share2, Plus, Minus } from 'lucide-react';
import type { YgoCardData } from '../types';
import { playFavorite } from '../utils/sound';

interface CardDetailsModalProps {
  card: YgoCardData | null;
  onClose: () => void;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Helper component for stat blocks
const StatBlock = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
  <Paper sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 1.5, 
    p: 1.5, 
    border: '1.5px solid #1f2229', 
    bgcolor: '#0c0d10',
    borderRadius: 0,
    flex: 1,
    minWidth: '100px',
    transition: 'all 0.2s',
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: '4px',
      height: '4px',
      backgroundColor: '#ffea00',
    },
    '&:hover': {
      borderColor: 'primary.main',
      boxShadow: '0 0 10px rgba(255, 234, 0, 0.1)',
    }
  }}>
    <Box sx={{ color: 'primary.main', display: 'flex', filter: 'drop-shadow(0 0 2px #ffea00)' }}>{icon}</Box>
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1, mb: 0.5, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px', fontSize: '0.65rem' }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 900, lineHeight: 1, fontFamily: '"Orbitron", sans-serif', color: '#ffffff' }}>
        {value}
      </Typography>
    </Box>
  </Paper>
);

// Helper to render SVG price trends
const renderSvgChart = (history: any[], key: 'price_tcg' | 'price_cm', stroke: string) => {
  if (history.length < 2) return null;
  
  const width = 300;
  const height = 60;
  const padding = 6;
  
  const values = history.map(h => h[key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  
  const points = history.map((h, index) => {
    const x = padding + (index / (history.length - 1)) * (width - padding * 2);
    const y = height - padding - ((h[key] - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible', marginTop: 8 }}>
      <defs>
        <filter id={`glow-${key}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <line x1={0} y1={height - padding} x2={width} y2={height - padding} stroke="#1f2229" strokeWidth={1} />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        points={points.join(' ')}
        filter={`url(#glow-${key})`}
      />
      {points.map((p, idx) => {
        const [x, y] = p.split(',');
        return (
          <circle
            key={idx}
            cx={x}
            cy={y}
            r={idx === points.length - 1 ? 3 : 1.5}
            fill={stroke}
            stroke="#050506"
            strokeWidth={0.5}
          />
        );
      })}
    </svg>
  );
};

export const CardDetailsModal: React.FC<CardDetailsModalProps> = ({ card, onClose }) => {
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);

  // Decks Integration States
  const [decks, setDecks] = useState<{ id: number; name: string }[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<number | ''>('');
  const [cardQuantity, setCardQuantity] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!card) {
      setLocalUrl(null);
      setIsFavorited(false);
      setPriceHistory([]);
      return;
    }
    
    let isMounted = true;
    
    async function fetchUrl() {
      try {
        const response = await fetch(`/api/cards/${card!.id}/image`);
        if (response.ok) {
          const data = await response.json();
          if (data.url && isMounted) {
            setLocalUrl(data.url);
          }
        }
      } catch (err) {
        console.error('Error fetching image URL:', err);
      }
    }

    async function checkFavorite() {
      try {
        const res = await fetch(`/api/favorites/${card!.id}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setIsFavorited(data.favorited);
        }
      } catch (err) {
        console.error('Error checking favorite:', err);
      }
    }

    async function fetchPriceHistory() {
      try {
        const res = await fetch(`/api/cards/${card!.id}/price-history`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setPriceHistory(data.history || []);
        }
      } catch (err) {
        console.error('Error fetching price history:', err);
      }
    }

    fetchUrl();
    checkFavorite();
    fetchPriceHistory();

    // Fetch Decks
    async function fetchDecks() {
      try {
        const res = await fetch('/api/decks');
        if (res.ok) {
          const json = await res.json();
          const list = json.data || [];
          setDecks(list);
          if (list.length > 0) {
            setSelectedDeckId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load decks in modal:', err);
      }
    }
    fetchDecks();
    
    return () => { isMounted = false; };
  }, [card]);

  // Track quantity when deck selection changes
  useEffect(() => {
    if (!card || !selectedDeckId) {
      setCardQuantity(0);
      return;
    }
    const cardId = card.id;
    let isMounted = true;
    async function fetchQty() {
      try {
        const res = await fetch(`/api/decks/${selectedDeckId}/cards`);
        if (res.ok && isMounted) {
          const json = await res.json();
          const cardsList = json.data || [];
          const found = cardsList.find((c: any) => c.id === cardId);
          setCardQuantity(found ? found.quantity : 0);
        }
      } catch (err) {
        console.error('Failed to fetch card quantity in deck:', err);
      }
    }
    fetchQty();
    return () => { isMounted = false; };
  }, [card, selectedDeckId]);

  const handleUpdateQty = async (change: number) => {
    if (!card || !selectedDeckId) return;
    const newQty = cardQuantity + change;
    if (newQty < 0 || newQty > 3) return;

    playFavorite(newQty > cardQuantity);

    try {
      const res = await fetch(`/api/decks/${selectedDeckId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, quantity: newQty }),
      });
      if (res.ok) {
        setCardQuantity(newQty);
      }
    } catch (err) {
      console.error('Failed to update deck card quantity:', err);
    }
  };

  const toggleFavorite = async () => {
    if (!card) return;
    try {
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsFavorited(data.favorited);
        playFavorite(data.favorited);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  if (!card) return null;

  return (
    <Dialog 
      open={!!card} 
      onClose={onClose} 
      fullScreen={isMobile}
      maxWidth="md" 
      fullWidth 
      slots={{ transition: isMobile ? Transition : undefined }}
      slotProps={{ 
        paper: { 
          sx: { 
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            ...(isMobile && {
              marginTop: '10vh',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              border: 'none',
              borderTop: '2px solid #ffea00' // Neon accent on top
            })
          } 
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 2, 
        pt: isMobile ? 3 : 2,
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        borderBottom: '1px solid #333'
      }}>
        <Box>
          <Typography variant="h5" component="div" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>
            {card.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'primary.main', textTransform: 'uppercase', fontWeight: 700 }}>
            ID: {card.id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: -0.5, mr: -1 }}>
          <IconButton 
            aria-label="favorite" 
            onClick={toggleFavorite} 
            sx={{ 
              color: isFavorited ? 'primary.main' : '#4d5360',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <Star size={22} fill={isFavorited ? '#ffea00' : 'none'} style={{ filter: isFavorited ? 'drop-shadow(0 0 5px #ffea00)' : 'none' }} />
          </IconButton>
          <IconButton aria-label="close" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <X size={28} />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default' }}>
        <Grid container spacing={4}>
          {/* Left Column: Image */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'center',
              p: 2.5,
              bgcolor: '#050506',
              border: '1.5px solid #1f2229',
              position: 'sticky',
              top: 80,
              boxShadow: '0 10px 30px rgba(0,0,0,0.7), inset 0 0 20px rgba(255,234,0,0.02)',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: '0 10px 35px rgba(0,0,0,0.8), 0 0 15px rgba(255,234,0,0.1)',
              }
            }}>
              {localUrl ? (
                <img src={localUrl} alt={card.name} style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }} />
              ) : (
                <Skeleton variant="rectangular" width="100%" height={380} sx={{ bgcolor: 'rgba(255,234,0,0.03)' }} />
              )}
            </Box>
          </Grid>

          {/* Right Column: Details */}
          <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Tags */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={card.type} sx={{ borderRadius: 0, fontWeight: 700, bgcolor: 'primary.main', color: '#000' }} />
              <Chip label={card.race} variant="outlined" sx={{ borderRadius: 0, borderColor: '#555' }} />
              {card.attribute && <Chip label={card.attribute} variant="outlined" sx={{ borderRadius: 0, borderColor: '#555' }} />}
            </Box>
            
            {/* Stats */}
            {(card.atk !== undefined || card.def !== undefined || card.level !== undefined || card.linkval !== undefined) && (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {card.linkval !== undefined ? (
                  <StatBlock icon={<Share2 size={20} />} label="Link Rating" value={`LINK-${card.linkval}`} />
                ) : (
                  card.level !== undefined && <StatBlock icon={<Star size={20} />} label="Level/Rank" value={card.level} />
                )}
                
                {card.atk !== undefined && <StatBlock icon={<Swords size={20} />} label="ATK" value={card.atk} />}
                
                {/* Link monsters don't have DEF */}
                {card.def !== undefined && !card.type.includes('Link') && (
                  <StatBlock icon={<Shield size={20} />} label="DEF" value={card.def} />
                )}
              </Box>
            )}

            {/* Deck Registry Integration */}
            <Box>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, mb: 1, display: 'block', letterSpacing: '1px', fontFamily: '"Orbitron", sans-serif' }}>
                DECK CONSOLE MOUNT
              </Typography>
              <Paper sx={{ 
                p: 2, 
                bgcolor: '#050506', 
                border: '1.5px solid #1f2229', 
                borderRadius: 0,
                backgroundImage: 'none',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2
              }}>
                {decks.length === 0 ? (
                  <Typography variant="caption" sx={{ color: '#5a6273', fontWeight: 700 }}>
                    NO DECKS DETECTED. CREATE A DECK REGISTRY IN THE DECK BUILDER PANEL.
                  </Typography>
                ) : (
                  <>
                    <FormControl size="small" sx={{ minWidth: '180px' }}>
                      <InputLabel id="modal-deck-select-label" sx={{ color: '#5a6273', fontSize: '0.75rem' }}>TARGET DECK</InputLabel>
                      <Select
                        labelId="modal-deck-select-label"
                        value={selectedDeckId}
                        label="TARGET DECK"
                        onChange={(e) => setSelectedDeckId(e.target.value as number)}
                        sx={{
                          borderRadius: 0,
                          bgcolor: '#0c0d10',
                          fontSize: '0.8rem',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1f2229' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4d5360' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
                        }}
                      >
                        {decks.map((deck) => (
                          <MenuItem key={deck.id} value={deck.id} sx={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem' }}>
                            {deck.name.toUpperCase()}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: '#5a6273', fontWeight: 800 }}>
                        QUANTITY IN DECK:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleUpdateQty(-1)} 
                          disabled={cardQuantity <= 0}
                          sx={{ 
                            border: '1px solid #1f2229', 
                            borderRadius: 0, 
                            color: '#ff5555',
                            '&:hover': { bgcolor: 'rgba(255,85,85,0.05)' }
                          }}
                        >
                          <Minus size={14} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 950, fontSize: '0.95rem', minWidth: '12px', textAlign: 'center', fontFamily: '"Orbitron", sans-serif' }}>
                          {cardQuantity}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => handleUpdateQty(1)} 
                          disabled={cardQuantity >= 3}
                          sx={{ 
                            border: '1px solid #1f2229', 
                            borderRadius: 0, 
                            color: '#a6e3a1',
                            '&:hover': { bgcolor: 'rgba(166,227,161,0.05)' }
                          }}
                        >
                          <Plus size={14} />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                )}
              </Paper>
            </Box>

            {/* Link Markers */}
            {card.linkmarkers && card.linkmarkers.length > 0 && (
              <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, display: 'block' }}>
                  Link Markers
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {card.linkmarkers.map((marker) => (
                    <Chip 
                      key={marker} 
                      label={marker} 
                      size="small"
                      sx={{ 
                        borderRadius: 0, 
                        fontWeight: 700, 
                        border: '1px solid #333',
                        bgcolor: '#0a0a0a',
                        color: 'primary.main'
                      }} 
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Description */}
            <Box>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, mb: 1, display: 'block', letterSpacing: '1px', fontFamily: '"Orbitron", sans-serif' }}>
                CARD TEXT / EFFECT
              </Typography>
              <Paper sx={{ 
                p: 2.5, 
                bgcolor: '#050506', 
                border: '1.5px solid #1f2229', 
                borderRadius: 0,
                backgroundImage: 'none',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '6px',
                  height: '6px',
                  backgroundColor: 'primary.main',
                }
              }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: '#e2e8f0', lineHeight: 1.7, fontSize: '0.925rem' }}>
                  {card.desc}
                </Typography>
              </Paper>
            </Box>

            {/* Market Prices */}
            {card.card_prices && card.card_prices.length > 0 && (
              <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, mb: 1, display: 'block', letterSpacing: '1px', fontFamily: '"Orbitron", sans-serif' }}>
                  MARKET TICKER & 7D TREND
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Paper sx={{ 
                      p: 2, 
                      bgcolor: '#050506', 
                      border: '1.5px solid #1f2229', 
                      borderRadius: 0, 
                      display: 'flex', 
                      flexDirection: 'column',
                      backgroundImage: 'none',
                      '&:hover': { borderColor: '#a6e3a1' }
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.5px' }}>TCGPLAYER</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 900, color: '#a6e3a1', fontFamily: '"Orbitron", sans-serif', textShadow: '0 0 5px rgba(166,227,161,0.2)' }}>${card.card_prices[0].tcgplayer_price}</Typography>
                      </Box>
                      {priceHistory.length > 0 && renderSvgChart(priceHistory, 'price_tcg', '#a6e3a1')}
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Paper sx={{ 
                      p: 2, 
                      bgcolor: '#050506', 
                      border: '1.5px solid #1f2229', 
                      borderRadius: 0, 
                      display: 'flex', 
                      flexDirection: 'column',
                      backgroundImage: 'none',
                      '&:hover': { borderColor: '#89b4fa' }
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.5px' }}>CARDMARKET</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 900, color: '#89b4fa', fontFamily: '"Orbitron", sans-serif', textShadow: '0 0 5px rgba(137,180,250,0.2)' }}>€{card.card_prices[0].cardmarket_price}</Typography>
                      </Box>
                      {priceHistory.length > 0 && renderSvgChart(priceHistory, 'price_cm', '#89b4fa')}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
            
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
