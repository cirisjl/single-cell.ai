const isDevelopment = process.env.NODE_ENV === "development";
const host = process.env.REACT_APP_HOST_URL;

export const NODE_API_URL = isDevelopment
  ? `http://${host}:3001/node`
  : `https://${host}/node`;

export const NODE_DATA_URL = isDevelopment
  ? `http://${host}:3001/zarr`
  : `https://${host}/zarr`;

export const CELERY_BACKEND_API = isDevelopment
  ? `http://${host}:5005/api`
  : `https://${host}/api`;

export const FLASK_BACKEND_API = isDevelopment
  ? `http://${host}:5003`
  : `https://${host}:5003`; 

export const WEB_SOCKET_URL = isDevelopment
  ? `ws://${host}:5005/wsapi`
  : `wss://${host}/wsapi`;

export const UPPY_API_URL = isDevelopment
  ? `http://${host}:3020`
  : `https://${host}`;

export const DIRECTUS_URL = isDevelopment
  ? `http://${host}:8055`
  : `https://${host}`;

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
