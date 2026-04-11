import React from 'react';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

const SwitchComponent = ({ value, onChange }) => {
  const handleSwitchChange = (event) => {
    onChange(event.target.checked);
  };

  return (
    <Box sx={{ m: 2 }}>
      <FormControlLabel
        control={<Switch checked={value} onChange={handleSwitchChange} />}
        // label={`Regress Cell Cycle: ${value ? 'Yes' : 'No'}`}
      />
    </Box>
  );
};

export default SwitchComponent;
