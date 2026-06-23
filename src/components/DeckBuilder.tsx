import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid, Paper, Select, MenuItem, FormControl, InputLabel, TextField, IconButton, CircularProgress } from '@mui/material';
import { Plus, Trash2, Download, ArrowUp, ArrowDown, Briefcase } from 'lucide-react';
import type { YgoCardData } from '../types';
import { playClick, playFavorite } from '../utils/sound';
import { CardDetailsModal } from './CardDetailsModal';

interface Deck {
  id: number;
  name: string;
}

interface DeckCard extends YgoCardData {
  quantity: number;
}

export const DeckBuilder: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<number | ''>('');
  const [deckCards, setDeckCards] = useState<DeckCard[]>([]);
  const [newDeckName, setNewDeckName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModalCard, setSelectedModalCard] = useState<YgoCardData | null>(null);

  const fetchDecks = async () => {
    try {
      const res = await fetch('/api/decks');
      const json = await res.json();
      const list = json.data || [];
      setDecks(list);
      if (list.length > 0 && !selectedDeckId) {
        setSelectedDeckId(list[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch decks:', e);
    }
  };

  const fetchDeckCards = async (deckId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/decks/${deckId}/cards`);
      const json = await res.json();
      setDeckCards(json.data || []);
    } catch (e) {
      console.error('Failed to fetch deck cards:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  useEffect(() => {
    if (selectedDeckId) {
      fetchDeckCards(selectedDeckId);
    } else {
      setDeckCards([]);
    }
  }, [selectedDeckId]);

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    playClick();

    try {
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeckName }),
      });
      const data = await res.json();
      if (data.id) {
        setDecks(prev => [...prev, data]);
        setSelectedDeckId(data.id);
        setNewDeckName('');
      }
    } catch (e) {
      console.error('Failed to create deck:', e);
    }
  };

  const handleDeleteDeck = async () => {
    if (!selectedDeckId) return;
    if (!window.confirm('Are you sure you want to delete this deck?')) return;
    playClick();

    try {
      const res = await fetch(`/api/decks/${selectedDeckId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const remaining = decks.filter(d => d.id !== selectedDeckId);
        setDecks(remaining);
        setSelectedDeckId(remaining.length > 0 ? remaining[0].id : '');
      }
    } catch (e) {
      console.error('Failed to delete deck:', e);
    }
  };

  const updateCardQty = async (cardId: number, currentQty: number, change: number) => {
    if (!selectedDeckId) return;
    const newQty = currentQty + change;
    if (newQty < 0 || newQty > 3) return;
    
    playClick();

    try {
      const res = await fetch(`/api/decks/${selectedDeckId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, quantity: newQty }),
      });
      if (res.ok) {
        if (newQty === 0) {
          setDeckCards(prev => prev.filter(c => c.id !== cardId));
        } else {
          setDeckCards(prev => prev.map(c => c.id === cardId ? { ...c, quantity: newQty } : c));
        }
      }
    } catch (e) {
      console.error('Failed to update card quantity:', e);
    }
  };

  const handleExportYDK = async () => {
    if (!selectedDeckId) return;
    playClick();

    try {
      const res = await fetch(`/api/decks/${selectedDeckId}/export`);
      const json = await res.json();
      if (json.ydk) {
        const blob = new Blob([json.ydk], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${json.deckName || 'deck'}.ydk`;
        link.click();
        URL.revokeObjectURL(url);
        playFavorite(true);
      }
    } catch (e) {
      console.error('Failed to export deck:', e);
    }
  };

  // Classify Cards
  const isExtraCard = (card: YgoCardData) => {
    return (
      card.type.includes('Synchro') ||
      card.type.includes('XYZ') ||
      card.type.includes('Fusion') ||
      card.type.includes('Link')
    );
  };

  const mainDeck = deckCards.filter(c => !isExtraCard(c));
  const extraDeck = deckCards.filter(c => isExtraCard(c));

  const totalMain = mainDeck.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalExtra = extraDeck.reduce((acc, curr) => acc + curr.quantity, 0);

  const mainDeckValid = totalMain >= 40 && totalMain <= 60;
  const extraDeckValid = totalExtra <= 15;

  return (
    <Box sx={{ py: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Registry Panel */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, bgcolor: '#0c0d10', border: '1.5px solid #1f2229', borderRadius: 0, backgroundImage: 'none' }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, display: 'block', mb: 2, letterSpacing: '1px' }}>
              DECK REGISTRY SELECTOR
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl fullWidth size="small">
                <InputLabel id="deck-select-label" sx={{ color: '#5a6273' }}>ACTIVE DECK</InputLabel>
                <Select
                  labelId="deck-select-label"
                  value={selectedDeckId}
                  label="ACTIVE DECK"
                  onChange={(e) => { playClick(); setSelectedDeckId(e.target.value as number); }}
                  sx={{
                    borderRadius: 0,
                    bgcolor: '#050506',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1f2229' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4d5360' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
                  }}
                >
                  {decks.map((deck) => (
                    <MenuItem key={deck.id} value={deck.id} sx={{ fontFamily: '"Outfit", sans-serif' }}>
                      {deck.name.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button 
                variant="outlined" 
                color="error" 
                disabled={!selectedDeckId}
                onClick={handleDeleteDeck}
                sx={{ border: '1.5px solid', borderColor: '#ff5555', borderRadius: 0, color: '#ff5555', '&:hover': { bgcolor: 'rgba(255,85,85,0.05)', borderColor: '#ff3333' } }}
              >
                <Trash2 size={18} />
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, bgcolor: '#0c0d10', border: '1.5px solid #1f2229', borderRadius: 0, backgroundImage: 'none' }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, display: 'block', mb: 2, letterSpacing: '1px' }}>
              CREATE NEW DECK REGISTRY
            </Typography>
            <Box component="form" onSubmit={handleCreateDeck} sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="ENTER DECK NAME..."
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                slotProps={{
                  htmlInput: {
                    style: { color: '#ffffff', fontWeight: 600, letterSpacing: '0.5px', fontFamily: '"Outfit", sans-serif', fontSize: '0.85rem' }
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#050506',
                    '& fieldset': { borderColor: '#1f2229' },
                    '&:hover fieldset': { borderColor: '#4d5360' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                  }
                }}
              />
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                sx={{ borderRadius: 0, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Plus size={16} />
                <span>CREATE</span>
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Builder Grid */}
      {selectedDeckId ? (
        <Paper sx={{ 
          p: 3, 
          bgcolor: '#0c0d10', 
          border: '1.5px solid #1f2229', 
          borderRadius: 0, 
          backgroundImage: 'none',
          minHeight: '300px',
          position: 'relative'
        }}>
          {/* Deck Stats Bar */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            gap: 2,
            borderBottom: '1px solid #1f2229', 
            pb: 2, 
            mb: 3 
          }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: '"Orbitron", sans-serif' }}>
                MAIN DECK: <span style={{ color: mainDeckValid ? '#a6e3a1' : '#ffea00' }}>{totalMain}/60</span>
                <span style={{ fontSize: '0.7rem', color: '#5a6273', marginLeft: '6px' }}>(40 MIN)</span>
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: '"Orbitron", sans-serif' }}>
                EXTRA DECK: <span style={{ color: extraDeckValid ? '#a6e3a1' : '#ff5555' }}>{totalExtra}/15</span>
                <span style={{ fontSize: '0.7rem', color: '#5a6273', marginLeft: '6px' }}>(15 MAX)</span>
              </Typography>
            </Box>
            
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleExportYDK} 
              disabled={deckCards.length === 0}
              startIcon={<Download size={16} />}
              sx={{ py: 1 }}
            >
              DOWNLOAD YDK FILE
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <Grid container spacing={4}>
              {/* Main Deck cards (Left Column) */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ borderRight: { md: '1px solid #1f2229' }, pr: { md: 2 } }}>
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, display: 'block', mb: 2, letterSpacing: '1.5px', fontFamily: '"Orbitron", sans-serif' }}>
                  MAIN DECK COMPONENTS // {totalMain} CARDS
                </Typography>
                
                {mainDeck.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed #1f2229', color: '#5a6273' }}>
                    <Briefcase size={28} style={{ marginBottom: 8, opacity: 0.3 }} />
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, letterSpacing: '1px' }}>MAIN DECK EMPTY</Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem' }}>ADD CARDS FROM EXPLORER PAGE DETAILS</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {mainDeck.map((card) => (
                      <Box key={card.id} sx={{ 
                        p: 1.5, 
                        bgcolor: '#050506', 
                        border: '1.5px solid #1f2229', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        transition: 'border-color 0.2s',
                        '&:hover': { borderColor: 'primary.main' }
                      }}>
                        <Box sx={{ cursor: 'pointer' }} onClick={() => { playClick(); setSelectedModalCard(card); }}>
                          <Typography variant="body2" sx={{ fontWeight: 850, fontFamily: '"Outfit", sans-serif', color: '#ffffff' }}>
                            {card.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#5a6273', fontWeight: 700 }}>
                            {card.type.replace(' Monster', '').toUpperCase()}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <IconButton size="small" onClick={() => updateCardQty(card.id, card.quantity, -1)} sx={{ color: '#ff5555' }}>
                            <ArrowDown size={14} />
                          </IconButton>
                          <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', width: '12px', textAlign: 'center', fontFamily: '"Orbitron", sans-serif' }}>
                            {card.quantity}
                          </Typography>
                          <IconButton size="small" onClick={() => updateCardQty(card.id, card.quantity, 1)} sx={{ color: '#a6e3a1' }} disabled={card.quantity >= 3}>
                            <ArrowUp size={14} />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Grid>

              {/* Extra Deck cards (Right Column) */}
              <Grid size={{ xs: 12, md: 6 }} sx={{ pl: { md: 2 } }}>
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, display: 'block', mb: 2, letterSpacing: '1.5px', fontFamily: '"Orbitron", sans-serif' }}>
                  EXTRA DECK COMPONENTS // {totalExtra} CARDS
                </Typography>

                {extraDeck.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed #1f2229', color: '#5a6273' }}>
                    <Briefcase size={28} style={{ marginBottom: 8, opacity: 0.3 }} />
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, letterSpacing: '1px' }}>EXTRA DECK EMPTY</Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem' }}>ADD EXTRA DECK MONSTERS FROM EXPLORER PAGE DETAILS</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {extraDeck.map((card) => (
                      <Box key={card.id} sx={{ 
                        p: 1.5, 
                        bgcolor: '#050506', 
                        border: '1.5px solid #1f2229', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        transition: 'border-color 0.2s',
                        '&:hover': { borderColor: 'primary.main' }
                      }}>
                        <Box sx={{ cursor: 'pointer' }} onClick={() => { playClick(); setSelectedModalCard(card); }}>
                          <Typography variant="body2" sx={{ fontWeight: 850, fontFamily: '"Outfit", sans-serif', color: '#ffffff' }}>
                            {card.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#5a6273', fontWeight: 700 }}>
                            {card.type.replace(' Monster', '').toUpperCase()}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <IconButton size="small" onClick={() => updateCardQty(card.id, card.quantity, -1)} sx={{ color: '#ff5555' }}>
                            <ArrowDown size={14} />
                          </IconButton>
                          <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', width: '12px', textAlign: 'center', fontFamily: '"Orbitron", sans-serif' }}>
                            {card.quantity}
                          </Typography>
                          <IconButton size="small" onClick={() => updateCardQty(card.id, card.quantity, 1)} sx={{ color: '#a6e3a1' }} disabled={card.quantity >= 3}>
                            <ArrowUp size={14} />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Grid>
            </Grid>
          )}
        </Paper>
      ) : (
        <Paper sx={{ p: 6, bgcolor: '#0c0d10', border: '1.5px solid #1f2229', borderRadius: 0, textAlign: 'center', color: '#5a6273', backgroundImage: 'none' }}>
          <Typography variant="body1" sx={{ fontWeight: 800, fontFamily: '"Orbitron", sans-serif' }}>
            NO ACTIVE DECK DETECTED.
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Please create a new deck or select an existing one to initialize the terminal grid builder.
          </Typography>
        </Paper>
      )}

      {/* Details Dialog */}
      <CardDetailsModal card={selectedModalCard} onClose={() => setSelectedModalCard(null)} />
    </Box>
  );
};
