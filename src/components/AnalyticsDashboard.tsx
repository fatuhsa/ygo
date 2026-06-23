import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import { BarChart3, Database, Swords, Award } from 'lucide-react';
import { playClick } from '../utils/sound';

interface AnalyticsData {
  total: number;
  composition: {
    monsters: number;
    spells: number;
    traps: number;
  };
  attributes: { attribute: string; count: number }[];
  topAtk: {
    id: number;
    name: string;
    type: string;
    atk: number;
    prices: {
      tcgplayer_price?: string;
      cardmarket_price?: string;
    };
  }[];
}

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredSegment, setHoveredSegment] = useState<{ label: string; value: number; color: string } | null>(null);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to fetch analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12, gap: 2 }}>
        <CircularProgress color="primary" />
        <Typography variant="caption" sx={{ color: '#5a6273', fontFamily: '"Orbitron", sans-serif', letterSpacing: '1px' }}>
          COMPUTING DATABASE QUANTUM AGGREGATES...
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Paper sx={{ p: 4, bgcolor: '#0c0d10', border: '1.5px solid #1f2229', borderRadius: 0, textAlign: 'center', color: '#ff5555' }}>
        <Typography variant="body2" sx={{ fontFamily: '"Orbitron", sans-serif' }}>
          ERROR: UNABLE TO ACCESS ANALYTICS DATA PIPELINE.
        </Typography>
      </Paper>
    );
  }

  // --- Donut Chart Calculation ---
  const { monsters, spells, traps } = data.composition;
  const compTotal = monsters + spells + traps;
  const r = 60;
  const circ = 2 * Math.PI * r; // ~377

  const segments = [
    { label: 'MONSTERS', value: monsters, color: '#ffea00', percentage: monsters / compTotal },
    { label: 'SPELLS', value: spells, color: '#a6e3a1', percentage: spells / compTotal },
    { label: 'TRAPS', value: traps, color: '#f5c2e7', percentage: traps / compTotal }
  ];

  let accumulatedPercent = 0;

  // --- Attribute Bars calculation ---
  const maxAttrCount = Math.max(...data.attributes.map(a => a.count), 1);

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
        alignItems: 'center',
        gap: 2,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '2px',
          bgcolor: 'primary.main',
          boxShadow: '0 0 10px #ffea00'
        }
      }}>
        <BarChart3 size={24} style={{ color: '#ffea00', filter: 'drop-shadow(0 0 4px #ffea00)' }} />
        <Box>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900, letterSpacing: '1.5px', display: 'block' }}>
            QUANTUM DATABASE ANALYTICS
          </Typography>
          <Typography variant="caption" sx={{ color: '#5a6273', display: 'block' }}>
            Real-time aggregate data overlays from offline SQLite synchronization node.
          </Typography>
        </Box>
      </Paper>

      {/* Overview Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2.5, bgcolor: '#0c0d10', border: '1.5px solid #1f2229', borderRadius: 0, backgroundImage: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, border: '1px solid #1f2229', color: '#ffea00', bgcolor: 'rgba(255,234,0,0.02)' }}>
              <Database size={20} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#5a6273', fontWeight: 800, display: 'block', letterSpacing: '0.5px' }}>TOTAL CARDS INDEXED</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: '"Orbitron", sans-serif' }}>
                {data.total.toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2.5, bgcolor: '#0c0d10', border: '1.5px solid #1f2229', borderRadius: 0, backgroundImage: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, border: '1px solid #1f2229', color: '#ffea00', bgcolor: 'rgba(255,234,0,0.02)' }}>
              <Award size={20} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#5a6273', fontWeight: 800, display: 'block', letterSpacing: '0.5px' }}>MONSTER CARDS</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: '"Orbitron", sans-serif', color: '#ffea00' }}>
                {monsters.toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2.5, bgcolor: '#0c0d10', border: '1.5px solid #1f2229', borderRadius: 0, backgroundImage: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, border: '1px solid #1f2229', color: '#a6e3a1', bgcolor: 'rgba(166,227,161,0.02)' }}>
              <Award size={20} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#5a6273', fontWeight: 800, display: 'block', letterSpacing: '0.5px' }}>SPELL CARDS</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: '"Orbitron", sans-serif', color: '#a6e3a1' }}>
                {spells.toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2.5, bgcolor: '#0c0d10', border: '1.5px solid #1f2229', borderRadius: 0, backgroundImage: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, border: '1px solid #1f2229', color: '#f5c2e7', bgcolor: 'rgba(245,194,231,0.02)' }}>
              <Award size={20} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#5a6273', fontWeight: 800, display: 'block', letterSpacing: '0.5px' }}>TRAP CARDS</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: '"Orbitron", sans-serif', color: '#f5c2e7' }}>
                {traps.toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* SVG Graphs Row */}
      <Grid container spacing={3}>
        {/* Donut Composition Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, bgcolor: '#0c0d10', border: '1.5px solid #1f2229', borderRadius: 0, backgroundImage: 'none', height: '100%' }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, display: 'block', mb: 3, letterSpacing: '1px' }}>
              CARD TYPE COMPOSITION CIRCLE
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', justifyContent: 'space-around', gap: 4 }}>
              {/* SVG Donut */}
              <Box sx={{ position: 'relative', width: 170, height: 170 }}>
                <svg width="100%" height="100%" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                  {segments.map((seg, idx) => {
                    const strokeOffset = circ - (accumulatedPercent * circ);
                    const strokeDash = seg.percentage * circ;
                    accumulatedPercent += seg.percentage;

                    const isHovered = hoveredSegment?.label === seg.label;

                    return (
                      <circle
                        key={idx}
                        cx="80"
                        cy="80"
                        r={r}
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth={isHovered ? 16 : 12}
                        strokeDasharray={`${strokeDash} ${circ - strokeDash}`}
                        strokeDashoffset={strokeOffset}
                        onMouseEnter={() => {
                          playClick();
                          setHoveredSegment({ label: seg.label, value: seg.value, color: seg.color });
                        }}
                        onMouseLeave={() => setHoveredSegment(null)}
                        style={{
                          transition: 'stroke-width 0.2s, stroke 0.2s',
                          cursor: 'pointer',
                        }}
                      />
                    );
                  })}
                </svg>

                {/* Donut Center text */}
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}>
                  {hoveredSegment ? (
                    <>
                      <Typography variant="caption" sx={{ color: hoveredSegment.color, fontWeight: 900, letterSpacing: '1px' }}>
                        {hoveredSegment.label}
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 900, fontFamily: '"Orbitron", sans-serif', lineHeight: 1.1 }}>
                        {hoveredSegment.value.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5a6273', fontSize: '0.6rem' }}>
                        {((hoveredSegment.value / compTotal) * 100).toFixed(1)}%
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="caption" sx={{ color: '#5a6273', fontWeight: 700, letterSpacing: '0.5px' }}>
                        DATABASE
                      </Typography>
                      <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 800, fontFamily: '"Orbitron", sans-serif' }}>
                        {compTotal.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'primary.main', fontSize: '0.6rem', fontWeight: 700 }}>
                        TOTAL
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>

              {/* Legends */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%', maxWidth: '160px' }}>
                {segments.map((seg, idx) => (
                  <Box 
                    key={idx} 
                    onMouseEnter={() => setHoveredSegment({ label: seg.label, value: seg.value, color: seg.color })}
                    onMouseLeave={() => setHoveredSegment(null)}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      p: 0.8,
                      border: hoveredSegment?.label === seg.label ? `1px solid ${seg.color}` : '1px solid transparent',
                      bgcolor: hoveredSegment?.label === seg.label ? 'rgba(255,255,255,0.02)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, bgcolor: seg.color }} />
                      <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.7rem' }}>{seg.label}</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#5a6273', fontWeight: 700, fontSize: '0.7rem' }}>
                      {((seg.value / compTotal) * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Attribute Distribution SVG Bar Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, bgcolor: '#0c0d10', border: '1.5px solid #1f2229', borderRadius: 0, backgroundImage: 'none', height: '100%' }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, display: 'block', mb: 3, letterSpacing: '1px' }}>
              MONSTER ATTRIBUTES FREQUENCY
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {data.attributes.slice(0, 7).map((attr, idx) => {
                const widthPercent = (attr.count / maxAttrCount) * 100;
                
                return (
                  <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 800, letterSpacing: '0.5px' }}>
                        {attr.attribute.toUpperCase()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5a6273', fontWeight: 700 }}>
                        {attr.count} cards
                      </Typography>
                    </Box>
                    {/* SVG Progress Bar */}
                    <svg width="100%" height="8">
                      <rect width="100%" height="8" fill="#15181e" />
                      <rect 
                        width={`${widthPercent}%`} 
                        height="8" 
                        fill={idx === 0 ? '#ffea00' : '#4d5360'} 
                        style={{
                          transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                          filter: idx === 0 ? 'drop-shadow(0 0 2px #ffea00)' : 'none'
                        }}
                      />
                    </svg>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Highest Attack Leaderboard */}
      <Paper sx={{ p: 3, bgcolor: '#0c0d10', border: '1.5px solid #1f2229', borderRadius: 0, backgroundImage: 'none' }}>
        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, display: 'block', mb: 2, letterSpacing: '1px' }}>
          QUANTUM APEX MONSTERS // HIGHEST ATK METADATA
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {data.topAtk.map((monster, index) => (
            <Box key={monster.id} sx={{
              p: 2,
              bgcolor: '#050506',
              border: '1.5px solid #1f2229',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              transition: 'border-color 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Ranking index Badge */}
                <Box sx={{ 
                  width: 26, 
                  height: 26, 
                  border: '1.5px solid', 
                  borderColor: index === 0 ? 'primary.main' : '#1f2229',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: index === 0 ? 'rgba(255,234,0,0.05)' : 'transparent'
                }}>
                  <Typography sx={{ 
                    fontFamily: '"Orbitron", sans-serif', 
                    fontSize: '0.75rem', 
                    fontWeight: 900,
                    color: index === 0 ? 'primary.main' : '#5a6273'
                  }}>
                    {index + 1}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 850, fontFamily: '"Outfit", sans-serif', color: '#ffffff' }}>
                    {monster.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#5a6273', fontWeight: 700 }}>
                    {monster.type.replace(' Monster', '').toUpperCase()}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {/* Price indicators */}
                <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: '#5a6273', display: 'block', fontSize: '0.6rem' }}>TCG VAL</Typography>
                  <Typography sx={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.8rem', fontWeight: 700, color: '#a6e3a1' }}>
                    {monster.prices.tcgplayer_price ? `$${monster.prices.tcgplayer_price}` : 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Swords size={16} style={{ color: '#ffea00' }} />
                  <Typography sx={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.95rem', fontWeight: 950, color: '#ffea00', textShadow: '0 0 4px rgba(255, 234, 0, 0.3)' }}>
                    {monster.atk}
                  </Typography>
                  <Typography sx={{ color: '#5a6273', fontSize: '0.65rem', fontWeight: 800 }}>ATK</Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};
