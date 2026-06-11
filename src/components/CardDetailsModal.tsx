import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, Typography, Box, Grid, Chip, Skeleton, useMediaQuery, useTheme, Slide, Paper } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { X, Shield, Swords, Star, Share2 } from 'lucide-react';
import type { YgoCardData } from '../types';
import { supabase } from '../supabaseClient';

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
    border: '1px solid #333', 
    bgcolor: '#0a0a0a',
    borderRadius: 0,
    flex: 1,
    minWidth: '100px'
  }}>
    <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1, mb: 0.5, textTransform: 'uppercase', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 900, lineHeight: 1 }}>
        {value}
      </Typography>
    </Box>
  </Paper>
);

export const CardDetailsModal: React.FC<CardDetailsModalProps> = ({ card, onClose }) => {
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!card) {
      setLocalUrl(null);
      return;
    }
    async function fetchUrl() {
      const { data } = await supabase.from('cards').select('local_image_url').eq('id', card!.id).maybeSingle();
      if (data?.local_image_url) setLocalUrl(data.local_image_url);
    }
    fetchUrl();
  }, [card]);

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
        <IconButton aria-label="close" onClick={onClose} sx={{ color: 'text.secondary', mt: -1, mr: -1 }}>
          <X size={28} />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default' }}>
        <Grid container spacing={4}>
          {/* Left Column: Image */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'center',
              p: 2,
              bgcolor: '#111',
              border: '1px solid #333',
              position: 'sticky',
              top: 16
            }}>
              {localUrl ? (
                <img src={localUrl} alt={card.name} style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }} />
              ) : (
                <Skeleton variant="rectangular" width="100%" height={400} />
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
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, display: 'block' }}>
                Card Text
              </Typography>
              <Paper sx={{ p: 2.5, bgcolor: '#111', border: '1px solid #333', borderRadius: 0 }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary', lineHeight: 1.6 }}>
                  {card.desc}
                </Typography>
              </Paper>
            </Box>

            {/* Market Prices */}
            {card.card_prices && card.card_prices.length > 0 && (
              <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, display: 'block' }}>
                  Market Prices
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Paper sx={{ p: 1.5, bgcolor: '#0a0a0a', border: '1px solid #333', borderRadius: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>TCGPlayer</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 900, color: '#a6e3a1' }}>${card.card_prices[0].tcgplayer_price}</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Paper sx={{ p: 1.5, bgcolor: '#0a0a0a', border: '1px solid #333', borderRadius: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Cardmarket</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 900, color: '#89b4fa' }}>€{card.card_prices[0].cardmarket_price}</Typography>
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
