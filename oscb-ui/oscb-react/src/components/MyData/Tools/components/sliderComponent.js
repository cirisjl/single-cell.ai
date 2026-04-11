import React from 'react';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';

const RangeSlider = ({ title, value, onChange,options }) => {
  // const handleChange = (event, newValue) => {
  //   onChange(newValue);
  // };

  const handleDragChange = (event, newValue) => {
    onChange(newValue); 
  };

  return (
    <div>
      <Box sx={{ m: 2 }}>
        <Slider
          value={value}
          // onChange={handleChange}
          onChangeCommitted={handleDragChange} 
          valueLabelDisplay="auto"
          min={options.min}
          max={options.max}
          step={options.step}
          marks={options.marks}
        />
      </Box>
    </div>
  );
};

export default RangeSlider;
