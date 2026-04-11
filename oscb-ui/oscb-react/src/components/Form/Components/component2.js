import React from 'react';
import Form from 'react-jsonschema-form';
import CreatableSelect from './component'
const schema = {
  type: 'object',
  properties: {
    mySelectField: {
      type: 'array',
      enum: ['Option 1', 'Option 2', 'Option 3'], // Your select options here
    },
  },
};

const uiSchema = {
  mySelectField: {
    'ui:widget': 'CreatableSelect', // Use your custom CreatableSelect widget
  },
};

const NewApp = () => {
  const onSubmit = ({ formData }) => {
    console.log(formData);
  };

  return (
    <div>
      <h1>JSON Schema Form with CreatableSelect</h1>
      <Form schema={schema} uiSchema={uiSchema} onSubmit={onSubmit} widgets={{ CreatableSelect }} />
    </div>
  );
};

export default NewApp;
