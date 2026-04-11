import React, { useState, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';

const createOption = (label) => ({
  label,
  value: label.toLowerCase().replace(/\W/g, ''),
});

function MyCreatableSelect({ fieldName, options, onSelectChange }) {

  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState(null);

  console.log("Options list");
  console.log(options);
  const filteredOptions = options[fieldName] || [];

  console.log("Filtered Options");
  console.log(filteredOptions);

  // Initialize the options 
  const [filteredOptionsState, setFilteredOptionsState] = useState(
    filteredOptions.map((option) => createOption(option))
  );

  const handleChange = (inputValue) => {
    setValue(inputValue);
    onSelectChange(fieldName, inputValue); // Call the callback function to update form state
  }

  const handleCreateOption = (inputValue) => {
    setIsLoading(true);

    setTimeout(() => {
      const newOption = createOption(inputValue);
      setIsLoading(false);
      setFilteredOptionsState((prev) => [...prev, newOption]);
      setValue(newOption);
    }, 1000);
    onSelectChange(fieldName, inputValue); // Call the callback function to update form state
  };

  return (
    <CreatableSelect
      isClearable
      isDisabled={isLoading}
      isSearchable
      onChange={handleChange}
      // onChange={(newValue) => setValue(newValue)}
      onCreateOption={handleCreateOption}
      options={filteredOptionsState}
      value={value}
    />
  );
}

export default MyCreatableSelect;
