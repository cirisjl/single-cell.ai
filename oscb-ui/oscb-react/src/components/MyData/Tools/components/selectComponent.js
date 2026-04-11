import React from 'react';
import CreatableSelect from 'react-select';

const SelectComponent = ({ value, onChange, options }) => {
  const selectOptions = options.opts.map(option => ({
    label: option, // Use the string value as both label and value
    value: option
  }));

  const defaultOption = selectOptions[0]?.value === null ? null : selectOptions[0]

  const handleChange = selectedOption => {
    onChange(selectedOption ? selectedOption.value : null);
  };

  return (
    <div>
      <CreatableSelect
        value={selectOptions.find(option => option.value === value) || defaultOption}
        // value={selectOptions[0] === '' ? null : selectOptions[0]}
        // defaultValue={selectOptions[0] === '' ? null : selectOptions[0]}
        onChange={handleChange}
        options={selectOptions}
        isClearable={options.clearable}
        placeholder={options.placeholder}
        isCreatable={options.creatable}
        isSearchable={options.searchable}
      />
    </div>
  );
};

export default SelectComponent;
