// Development
// export const NODE_API_URL = `http://${process.env.REACT_APP_HOST_URL}:3001/node`;
// export const NODE_DATA_URL = `http://${process.env.REACT_APP_HOST_URL}:3001/zarr`;
// export const CELERY_BACKEND_API = `http://${process.env.REACT_APP_HOST_URL}:5005/api`;
// // export const FLASK_BACKEND_API = `http://${process.env.REACT_APP_HOST_URL}:5003`;
// export const WEB_SOCKET_URL = `ws://${process.env.REACT_APP_HOST_URL}:5005/wsapi`;
// export const UPPY_API_URL = `http://${process.env.REACT_APP_HOST_URL}:3020`;
// export const DIRECTUS_URL = `http://${process.env.REACT_APP_HOST_URL}:8055`;

// Production
export const NODE_API_URL = `https://${process.env.REACT_APP_HOST_URL}/node`;
export const NODE_DATA_URL = `https://${process.env.REACT_APP_HOST_URL}/zarr`;
export const CELERY_BACKEND_API = `https://${process.env.REACT_APP_HOST_URL}/api`;
export const FLASK_BACKEND_API = `https://${process.env.REACT_APP_HOST_URL}:5003`;
export const WEB_SOCKET_URL = `wss://${process.env.REACT_APP_HOST_URL}/wsapi`;
export const UPPY_API_URL = `https://${process.env.REACT_APP_HOST_URL}`;
export const DIRECTUS_URL = `https://${process.env.REACT_APP_HOST_URL}`;

// Storage
export const PUBLIC_DATASETS = "/usr/src/app/storage/publicDatasets/";
export const STORAGE = "/usr/src/app/storage";
// Github
export const owner = process.env.REACT_APP_OWNER;
export const repo = process.env.REACT_APP_REPO;

export const defaultValues = {
  min_genes: 200,
  max_genes: 50000, // No limit
  min_cells: 2,
  target_sum: 1e4,
  n_top_genes: 3000,
  n_neighbors: 15,
  n_pcs: 20, // None
  resolution: 0.5,
  n_hvg: 50,
  regress_cell_cycle: false,
  skip_3d: false,
  skip_tsne: false,
  use_default: true,
  doublet_rate: 0.08
};
export const defaultQcParams = {
  assay: "RNA",
  min_genes: 200,
  max_genes: 50000,
  min_cells: 2,
  target_sum: 10000,
  n_top_genes: 3000,
  n_neighbors: 15,
  n_pcs: 20,
  resolution: 0.5,
  n_hvg: 50,
  doublet_rate: 0.08,
  regress_cell_cycle: false,
  skip_3d: false,
  skip_tsne: false
};

export const defaultNormalizationParams = {
  assay: "RNA",
  n_neighbors: 15,
  n_pcs: 20,
  resolution: 0.5,
};

export const defaultReductionParams = {
  assay: "RNA",
  n_neighbors: 15,
  n_pcs: 20,
  resolution: 0.5,
};
