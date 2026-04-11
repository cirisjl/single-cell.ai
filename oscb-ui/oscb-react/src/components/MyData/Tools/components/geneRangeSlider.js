import React from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';

// Custom widget component
const GeneRangeSlider = ({value, onChange}) => {
    const handleChange = (event, newValue) => {
    onChange(newValue); // newValue will be an array [min, max]
  };

  // // This function is optional, only necessary if you want to handle the commit of the change
  // const handleDragChange = (event, newValue) => {
  //   onChange(newValue); // newValue will be an array [min, max]
  // };

  // Ensure we have a default value
  const defaultValue = value || [200, 50000];

  return (
    <Box sx={{ m: 2 }}>
      <Slider
        value={defaultValue}
        onChange={handleChange}
        // onChangeCommitted={handleDragChange} // Use onChangeCommitted for smoother drag behavior
        valueLabelDisplay="auto"
        min={0}
        max={50000}
        step={25}
        marks={[
          { value: 200, label: '200*' },
          { value: 2000, label: '2000' },
          { value: 5000, label: '5000' },
          { value: 10000, label: '10000' },
          { value: 15000, label: '15000' },
          { value: 20000, label: '20000' },
          { value: 30000, label: '30000' },
          { value: 40000, label: '40000' },
          { value: 50000, label: '50000*' },
        ]}
      />
    </Box>
  );
};


export default GeneRangeSlider;
