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
    "idtype": {
      "classNames": "sub-category",
      "ui:widget": "SelectComponent",
      'ui:options': {
        clearable: true,
        placeholder: "Select the ID type",
        creatable: false,
        searchable: true,
        opts: ["SYMBOL", "ENSEMBL", "ENTREZID", "REFSEQ"]
      }
    },
    "cluster_label": {
      "classNames": "sub-category",
      "ui:widget": "SelectComponent",
      'ui:options': {
        clearable: true,
        placeholder: "Choose the cluster label for UMAP/t-SNE visualization",
        creatable: false,
        searchable: true,
        opts: dynamicOptions.obs_names
      }
    },
    "n_hvg": {
      "classNames": "sub-category",
      "ui:widget": "RangeSlider",
      'ui:title': 'Number of Highly Variable Genes for Heatmap: ',
      'ui:options': {
        title: 'Number of Highly Variable Genes for Heatmap: ', // Title for the slider
        min: 20,
        max: 500,
        step: 1,
        marks: [
          { value: 50, label: '50*' },
          { value: 100, label: '100' },
          { value: 150, label: '150' },
          { value: 200, label: '200' },
          { value: 250, label: '250' },
          { value: 300, label: '300' },
          { value: 500, label: '500' },
        ]
      }
    },
    "cluster_colname": {
      "classNames": "sub-category",
      "ui:widget": "SelectComponent",
      'ui:options': {
        clearable: true,
        placeholder: "Choose the cluster column for cell type annotation. If not specified, the default Leiden clustering will be used.",
        creatable: false,
        searchable: true,
        opts: dynamicOptions.obs_names
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
    "annotation_params": {
      "classNames": "form-subset sub-category",
      "methods": {
        "classNames": "sub-category",
        "ui:widget": "MultiSelectComponent"
      },
      "assay": {
        "classNames": "sub-category",
        "ui:widget": "ClusterLabelInput"
      },
      "celltypist_model": {
        "classNames": "sub-category",
        "ui:widget": "SelectComponent",
        'ui:options': {
          clearable: true,
          placeholder: "Select the CellTypist Model.",
          creatable: false,
          searchable: true,
          opts: [
            null,
            "Human_Placenta_Decidua.pkl",
            "Adult_Mouse_Gut.pkl",
            "Human_Longitudinal_Hippocampus.pkl",
            "Adult_Human_Skin.pkl",
            "Fetal_Human_AdrenalGlands.pkl",
            "Immune_All_Low.pkl",
            "Human_Developmental_Retina.pkl",
            "Human_Endometrium_Atlas.pkl",
            "COVID19_Immune_Landscape.pkl",
            "Developing_Human_Organs.pkl",
            "Mouse_Postnatal_DentateGyrus.pkl",
            "Developing_Human_Hippocampus.pkl",
            "Mouse_Isocortex_Hippocampus.pkl",
            "Human_AdultAged_Hippocampus.pkl",
            "Adult_Pig_Hippocampus.pkl",
            "Adult_Human_MTG.pkl",
            "Cells_Human_Tonsil.pkl",
            "Healthy_Mouse_Liver.pkl",
            "Human_IPF_Lung.pkl",
            "Cells_Fetal_Lung.pkl",
            "Mouse_Whole_Brain.pkl",
            "Adult_CynomolgusMacaque_Hippocampus.pkl",
            "Human_Embryonic_YolkSac.pkl",
            "Developing_Mouse_Hippocampus.pkl",
            "Cells_Intestinal_Tract.pkl",
            "Fetal_Human_Pituitary.pkl",
            "Adult_Human_Vascular.pkl",
            "Autopsy_COVID19_Lung.pkl",
            "Healthy_COVID19_PBMC.pkl",
            "Healthy_Human_Liver.pkl",
            "COVID19_HumanChallenge_Blood.pkl",
            "Adult_RhesusMacaque_Hippocampus.pkl",
            "Nuclei_Lung_Airway.pkl",
            "Developing_Human_Gonads.pkl",
            "Developing_Human_Brain.pkl",
            "Healthy_Adult_Heart.pkl",
            "Adult_COVID19_PBMC.pkl",
            "Cells_Adult_Breast.pkl",
            "Immune_All_High.pkl",
            "Lethal_COVID19_Lung.pkl",
            "Fetal_Human_Skin.pkl",
            "Adult_Human_PrefrontalCortex.pkl",
            "Human_PF_Lung.pkl",
            "Adult_Mouse_OlfactoryBulb.pkl",
            "Human_Lung_Atlas.pkl",
            "Pan_Fetal_Human.pkl",
            "Cells_Lung_Airway.pkl",
            "Fetal_Human_Retina.pkl",
            "Human_Colorectal_Cancer.pkl",
            "Mouse_Dentate_Gyrus.pkl",
            "Developing_Mouse_Brain.pkl",
            "Adult_Human_PancreaticIslet.pkl",
            "Developing_Human_Thymus.pkl",
            "Fetal_Human_Pancreas.pkl"
          ]
        }
      },
      "SingleR_ref": {
        "classNames": "sub-category",
        "ui:widget": "MultiSelectComponent",
      },
      "user_label": {
        "classNames": "sub-category",
        "ui:widget": "SelectComponent",
        'ui:options': {
          clearable: true,
          placeholder: "Specify the labels",
          creatable: false,
          searchable: true,
          opts: dynamicOptions.obs_names_ref
        }
      },
      "n_neighbors": {
        "classNames": "sub-category",
        "ui:widget": "RangeSlider",
        'ui:title': 'n_neighbors: ',
        'ui:options': {
          title: 'n_neighbors: ', // Title for the slider
          min: 2,
          max: 100,
          step: 1,
          marks: [
            { value: 2, label: '2' },
            { value: 5, label: '5' },
            { value: 10, label: '10' },
            { value: 15, label: '15*' },
            { value: 20, label: '20' },
            { value: 50, label: '50' },
            { value: 100, label: '100' },
          ]
        }
      },
      "n_pcs": {
        "classNames": "sub-category",
        "ui:widget": "RangeSlider",
        'ui:title': 'n_pcs: ',
        'ui:options': {
          title: 'n_pcs: ',
          min: 0,
          max: 200,
          step: 1,
          marks: [
            { value: 0, label: '0' },
            { value: 5, label: '5' },
            { value: 10, label: '10' },
            { value: 20, label: '20*' },
            { value: 40, label: '40' },
            { value: 50, label: '50' },
            { value: 125, label: '125' },
            { value: 200, label: '200' },
          ]
        }
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