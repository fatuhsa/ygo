import React, { useState, useEffect } from 'react';
import { Drawer, Box, Typography, TextField, Autocomplete, IconButton, Checkbox, FormControlLabel, Button } from '@mui/material';
import { X } from 'lucide-react';
import type { FilterState } from '../types';

interface FilterSidebarProps {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
}

const attributes = ['DARK', 'EARTH', 'FIRE', 'LIGHT', 'WATER', 'WIND', 'DIVINE'];
const levels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const cardTypes = [
  'Effect Monster', 'Normal Monster', 'Flip Effect Monster', 
  'Fusion Monster', 'Synchro Monster', 'XYZ Monster', 'Link Monster',
  'Spell Card', 'Trap Card'
];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ open, onClose, filters, onFilterChange }) => {
  const [archetypes, setArchetypes] = useState<string[]>([]);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  useEffect(() => {
    if (open) setLocalFilters(filters);
  }, [open, filters]);

  useEffect(() => {
    fetch('https://db.ygoprodeck.com/api/v7/archetypes.php')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setArchetypes(data.map((a: any) => a.archetype_name));
        }
      })
      .catch(err => console.error('Failed to fetch archetypes', err));
  }, []);

  const handleApply = () => {
    onFilterChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const emptyFilters = { archetype: null, type: null, attribute: null, level: null };
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
    onClose();
  };

  const neonCheckboxSx = {
    color: '#555',
    '&.Mui-checked': {
      color: 'primary.main',
      filter: 'drop-shadow(0 0 4px #ffea00)',
    }
  };

  return (
    <Drawer 
      anchor="left" 
      open={open} 
      onClose={onClose} 
      slotProps={{ 
        paper: { 
          sx: { 
            width: { xs: '100%', sm: 350 }, 
            bgcolor: '#0a0a0a', 
            borderRight: '1px solid #333',
            display: 'flex',
            flexDirection: 'column'
          } 
        } 
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', bgcolor: '#111' }}>
        <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: 2 }}>FILTERS</Typography>
        <IconButton onClick={onClose} sx={{ color: 'primary.main' }}><X size={28} /></IconButton>
      </Box>
      
      <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Archetype Section */}
        <Box>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 'bold' }}>Archetype</Typography>
          <Autocomplete
            options={archetypes}
            value={localFilters.archetype}
            onChange={(_, newValue) => setLocalFilters({ ...localFilters, archetype: newValue })}
            renderInput={(params) => (
              <TextField 
                {...params} 
                variant="outlined" 
                size="small" 
                placeholder="Search archetype..." 
                sx={{ mt: 1, '& .MuiOutlinedInput-root': { bgcolor: '#111' } }} 
              />
            )}
          />
        </Box>

        {/* Card Type Section (2 cols) */}
        <Box>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 'bold' }}>Card Type</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
            {cardTypes.map((type) => (
              <FormControlLabel 
                key={type} 
                control={
                  <Checkbox 
                    size="small" 
                    checked={localFilters.type === type} 
                    onChange={() => setLocalFilters({ ...localFilters, type: localFilters.type === type ? null : type })} 
                    sx={neonCheckboxSx} 
                  />
                } 
                label={<Typography variant="body2">{type}</Typography>} 
                sx={{ width: '50%', m: 0 }} 
              />
            ))}
          </Box>
        </Box>

        {/* Attribute Section (2 cols) */}
        <Box>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 'bold' }}>Attribute</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
            {attributes.map((attr) => (
              <FormControlLabel 
                key={attr} 
                control={
                  <Checkbox 
                    size="small" 
                    checked={localFilters.attribute === attr} 
                    onChange={() => setLocalFilters({ ...localFilters, attribute: localFilters.attribute === attr ? null : attr })} 
                    sx={neonCheckboxSx} 
                  />
                } 
                label={<Typography variant="body2">{attr}</Typography>} 
                sx={{ width: '50%', m: 0 }} 
              />
            ))}
          </Box>
        </Box>

        {/* Level Section (4 cols) */}
        <Box>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 'bold' }}>Level / Rank</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
            {levels.map((lvl) => (
              <FormControlLabel 
                key={lvl} 
                control={
                  <Checkbox 
                    size="small" 
                    checked={localFilters.level === lvl} 
                    onChange={() => setLocalFilters({ ...localFilters, level: localFilters.level === lvl ? null : lvl })} 
                    sx={neonCheckboxSx} 
                  />
                } 
                label={<Typography variant="body2">{lvl}</Typography>} 
                sx={{ width: '25%', m: 0 }} 
              />
            ))}
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid #333', bgcolor: '#111', display: 'flex', gap: 2 }}>
        <Button 
          variant="outlined" 
          fullWidth 
          onClick={handleReset} 
          sx={{ color: '#a0a0a0', borderColor: '#555', '&:hover': { borderColor: '#777', bgcolor: 'rgba(255,255,255,0.05)' } }}
        >
          Reset
        </Button>
        <Button 
          variant="contained" 
          fullWidth 
          onClick={handleApply} 
          sx={{ 
            boxShadow: '0 0 10px #ffea0044',
            '&:hover': {
              boxShadow: '0 0 20px #ffea0066',
            }
          }}
        >
          Apply
        </Button>
      </Box>
    </Drawer>
  );
};
