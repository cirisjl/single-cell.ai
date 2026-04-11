import React, { useState } from 'react';

const ClusterLabelInput = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState(value);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleBlur = () => {
    onChange(inputValue);
  };

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      onBlur={handleBlur}
      placeholder="Enter here..."
    />
  );
};

export default ClusterLabelInput;