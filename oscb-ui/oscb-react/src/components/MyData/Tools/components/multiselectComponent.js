import React from 'react';
import Select from 'react-select';

const MultiSelectComponent = ({ options, value, onChange }) => {
    console.log(options); // Check the structure here

  const selectOptions = options.enumOptions.map(({ value, label }) => ({
    label: label || value, // Use the label if provided, otherwise fall back to the value
    value: value
  }));

  const handleChange = selectedOptions => {
    const newValue = selectedOptions ? selectedOptions.map(option => option.value) : [];
    onChange(newValue);
  };

  // Determine the current value for the react-select component
  const currentValue = selectOptions.filter(option => value.includes(option.value));

  return (
    <Select
      isMulti
      isClearable={true}
      onChange={handleChange}
      options={selectOptions}
      value={currentValue}
      placeholder="Select Methods"
      isSearchable={true}
    />
  );
};

export default MultiSelectComponent;
