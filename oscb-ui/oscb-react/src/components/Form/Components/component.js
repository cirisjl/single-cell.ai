import React from 'react';
import Select from 'react-select';

const CreatableSelect = ({ schema, id, onChange, value }) => {
  const handleChange = (selectedOption) => {
    onChange(id, selectedOption.value); // This assumes you are using react-json-schema-form
  };

  const options = schema.enum.map((item) => ({
    value: item,
    label: item,
  }));

  const selectedOption = options.find((option) => option.value === value);

  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={handleChange}
      isClearable
      isSearchable
      isMulti={schema.type === 'array'}
      isCreatable
    />
  );
};

export default CreatableSelect;
