export const uiSchema = (dynamicOptions) => ({
  "parameters": {
    "classNames": "category",
    "species": {
      "classNames": "sub-category",
      "ui:widget": "SelectComponent",
      'ui:options': {
        clearable: true,
        creatable: true,
        searchable: true,
        opts: dynamicOptions.species
      }
    },
    "organ_part": {
      "classNames": "sub-category",
      "ui:widget": "SelectComponent",
      'ui:options': {
        clearable: true,
        creatable: true,
        searchable: true,
        opts: dynamicOptions.organ_part
      }
    },
    "do_umap": {
      "classNames": "sub-category",
      "ui:widget": "toggle"
    },
    "do_cluster": {
      "classNames": "sub-category",
      "ui:widget": "toggle"
    },
    "integration_params": {
      "classNames": "form-subset sub-category",
      "methods": {
        "classNames": "sub-category",
        "ui:widget": "MultiSelectComponent",
      },
      "batch_key": {
        "classNames": "sub-category",
        "ui:widget": "SelectComponent",
        'ui:options': {
          clearable: true,
          placeholder: "Please select the Batch Key",
          creatable: false,
          searchable: true,
          opts: dynamicOptions.obs_names
        }
      },
      "pseudo_replicates": {
        "classNames": "sub-category",
        "ui:widget": "RangeSlider",
        'ui:title': 'Pseudo Replicates: ',
        'ui:options': {
          title: 'Pseudo Replicates: ',
          min: 0,
          max: 50,
          step: 1,
          marks: [
            { value: 0, label: '0*' },
            { value: 3, label: '3' },
            { value: 6, label: '6' },
            { value: 10, label: '10' },
            { value: 20, label: '20' },
            { value: 30, label: '30' },
            { value: 50, label: '50' },
          ]
        }
      },
      "default_assay": {
        "classNames": "sub-category",
        "ui:widget": "ClusterLabelInput"
      },
      "npcs": {
        "classNames": "sub-category",
        "ui:widget": "RangeSlider",
        'ui:title': 'n_pcs: ',
        'ui:options': {
          title: 'n_pcs: ',
          min: 0,
          max: 200,
          step: 1,
          marks: [
            { value: 0, label: '0*' },
            { value: 5, label: '5' },
            { value: 10, label: '10' },
            { value: 20, label: '20' },
            { value: 40, label: '40' },
            { value: 50, label: '50' },
            { value: 125, label: '125' },
            { value: 200, label: '200' },
          ]
        }
      },
      "dims": {
        "classNames": "sub-category",
        "ui:widget": "RangeSlider",
        'ui:title': 'n_neighbors: ',
        'ui:options': {
          title: 'n_neighbors: ', // Title for the slider
          min: 0,
          max: 200,
          step: 1,
          marks: [
            { value: 10, label: '10' },
            { value: 20, label: '20' },
            { value: 30, label: '30*' },
            { value: 40, label: '40' },
            { value: 50, label: '50' },
            { value: 100, label: '100' },
            { value: 150, label: '150' },
            { value: 200, label: '200' }
          ]
        },
      },
      "resolution": {
        "classNames": "sub-category",
        "ui:widget": "RangeSlider",
        'ui:title': 'Resolution: ',
        'ui:options': {
          title: 'Resolution: ',
          min: 0,
          max: 5,
          step: 0.05,
          marks: [
            { value: 0.1, label: '0.1' },
            { value: 0.5, label: '0.5*' },
            { value: 1, label: '1' },
            { value: 2.5, label: '2.5' },
            { value: 5, label: '5' },
          ]
        }
      }
    }
  }
});