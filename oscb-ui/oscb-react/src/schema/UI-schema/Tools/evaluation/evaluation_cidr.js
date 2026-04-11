export const uiSchema = (dynamicOptions) => ({

    "parameters": {
      "classNames": "category",
        "output_format": {
          "classNames": "sub-category",
          "ui:widget": "select",
          "ui:placeholder": "Select file format"
        },
        "methods": {
          "classNames": "sub-category",
          // "ui:widget": "select",
          "ui:placeholder": "Select a method",
          'ui:widget': () => (
            <div className='common-row-wrap'>
              <select>
                <option value="CIDR">CIDR</option>
              </select>
        </div>
          ),
        },
        "default_assay": {
          "classNames": "sub-category",
          'ui:widget': () => (
            <div className='common-row-wrap'>
              <span data-v-22825496="" class="ui-form-title-message warning"> * Optional </span>
              <input type='text' />
        </div>
          ),
        },
        "layer": {
          "classNames": "sub-category",
          "ui:widget": "SelectComponent",
          'ui:options': {
          clearable: true ,
          placeholder: "Select the Layer",
          creatable: false,
          searchable: true,
          opts: dynamicOptions.layers 
        }
        },
        "path_of_scrublet_calls": {
          "classNames": "sub-category"
        },
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
        "idtype": {
          "classNames": "sub-category"
        },
        "genes": {
          "classNames": "sub-category",
        },
        "ncores": {
          "classNames": "sub-category",
          "ui:widget": "range",
        },
        "show_umap": {
          "classNames": "sub-category",
          "ui:widget": "toggle"
        },
        "show_error": {
          "classNames": "sub-category",
          "ui:widget": "toggle"
        }
    }
});
  