export const uiSchema = (dynamicOptions) => ({

    "parameters": {
      "classNames": "category",
        "output_format": {
          "classNames": "sub-category",
          "ui:widget": "SelectComponent",
          'ui:options': {
            clearable: true ,
            placeholder: "Select the Output Format",
            creatable: false,
            searchable: true,
            opts:["AnnData", "SingleCellExperiment", "Seurat", "CSV"] 
          }
        }
    }
  });
