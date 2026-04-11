import { NODE_API_URL, NODE_DATA_URL } from '../constants/declarations'
import axios from 'axios';
import LZString from 'lz-string';
import pako from 'pako'; // Import pako, a zlib-compatible library for browsers
import { 
  Vitessce
 } from 'vitessce';
import "./vitessce.css";


// Function to compress data
export function compressData(data) {
    // Convert data to JSON string
    const jsonString = JSON.stringify(data);
    // Compress and encode in Base64 format
    const compressedString = LZString.compressToBase64(jsonString);
    return compressedString;
}

// Function to decompress data
export function decompressData(compressedString) {
    // Decode and decompress the Base64 string
    const jsonString = LZString.decompressFromBase64(compressedString);
    // Parse JSON string to get original data
    return JSON.parse(jsonString);
}

// Get the value of a cookie with a given name
export function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(`${name}=`)) {
        return cookie.substring(`${name}=`.length, cookie.length);
      }
    }
    return '';
  }
  
  // Set a cookie with a given name, value, and expiration time (in days)
  export function setCookie(name, value, expiration) {
    const date = new Date();
    date.setTime(date.getTime() + (expiration * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  }


  export function isUserAuth(jwtToken) {
    return new Promise((resolve, reject) => {
      if (jwtToken) {
        fetch(NODE_API_URL + "/protected", {
          method: 'GET',
          credentials: 'include', // send cookies with the request
          headers: { 'Authorization': `Bearer ${jwtToken}`},
        }) 
        .then((response) => response.json())
        .then((data) => {
          if(data.authData !== null) {
              if (data.authData.username !== null && data.authData.username !== undefined) {
                // console.log("Heeloo from isUserAuth ::: " + data.authData.isAdmin);
                resolve({isAuth: true, username: data.authData.username, isAdmin: data.authData.isAdmin});
              } else {
                resolve({isAuth: false, username: null, isAdmin: false});
              }
          }
        })
        .catch((error) => {
          console.error(error);
          // reject(error);
          resolve({isAuth: false, username: null, isAdmin: false});
        });
      }
    });
  }


export async function fetchUserProjectsList(username) {
   try {
    const response = await fetch(`${NODE_API_URL}/projects/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, adminPage: false }), 
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    return await response.json(); // Array of projects
  } catch (error) {
    console.error("Error fetching admin projects:", error);
    return [];
  }
}


// Delete a cookie with a given name
export function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/`;
  return true;
}


export async function getStorageDetails(jwtToken) {
  try {
    const response = await fetch(`${NODE_API_URL}/getStorageDetails?authToken=${jwtToken}`);

    if (response.status === 403) {
      throw new Error('Please log in first');
    }

    const data = await response.json();

    return {
      usedStorage: data.used,
      totalStorage: data.allowed
    };
  } catch (error) {
    if (error.message === 'Please log in first') {
      window.alert('Please log in first');
    } else {
      console.error(error);
    }

    return {
      usedStorage: 0,
      totalStorage: 0
    };
  }
}


export function createUniqueFolderName(title) {
  // Sanitize the title by removing spaces and special characters
  const sanitizedTitle = title
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-zA-Z0-9-]/g, '') // Remove special characters and non-alphanumeric characters

  // Generate a unique identifier (timestamp)
  const timestamp = Date.now();

  // Combine the sanitized title and timestamp to create a unique folder name
  const folderName = `${sanitizedTitle}_${timestamp}`;

  return folderName;
}

export function moveFilesToNewDirectory(newDirectoryPath, isBenchmarks=false) {
  axios
    .post(`${NODE_API_URL}/move-files`, { newDirectoryPath, isBenchmarks, jwtToken:getCookie('jwtToken')})
    .then((response) => {
      console.log('Files moved successfully');
    })
    .catch((error) => {
      // Handle errors if the API call fails.
      console.error('Error moving files', error);
      throw error; // Re-throw the error so it can be caught in the calling code
    });
}


// Data transformation function
export function prepareTableData(cellMetadataObs) {
  const identifiers = new Set();
  Object.values(cellMetadataObs).forEach(values => {
    Object.keys(values).forEach(key => identifiers.add(key));
  });

  // Convert the Set of identifiers into an array and map over it to create rows
  const rows = Array.from(identifiers).map(identifier => {
    const row = { identifier }; // Start each row with the identifier
    Object.entries(cellMetadataObs).forEach(([category, values]) => {
      row[category] = values[identifier] || 'N/A'; // Use 'N/A' for missing values
    });
    return row;
  });

  // Limit the number of rows to 5
  return rows.slice(0, 5);
};

export async function copyFilesToPrivateStorage(selectedFiles, userId){
  try {
    const response = await axios.post(`${NODE_API_URL}/copyFiles`, {
      selectedFiles,
      userId,
    });

    // Check if the server responded with a non-200 status code
    if (response.data.status !== 200) {
      console.error('Server error:', response.data.message);
      return { success: false, message: response.data.message };
    }

    console.log('Success:', response.data.message);
    return { success: true, message: response.data.message };

} catch (error) {
    // Handle error depending on if it's an Axios error or a different error
    let errorMessage = error.response ? error.response.data.message : error.message;
    return { success: false, message: errorMessage };  }
};


export function downloadFile(fileUrl) {
  const apiUrl = `${NODE_API_URL}/download`;
  const pwd = "jobResults";

  if (fileUrl) {
    const filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);

    fetch(`${apiUrl}?fileUrl=${fileUrl}&authToken=${getCookie("jwtToken")}&pwd=${pwd}`)
      .then(response => {
        return response.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        // Remove the link from the DOM
        // document.body.removeChild(link);
      })
      .catch(error => {
        console.error('Error downloading file:', error);
      });
  }
};

export function getFileNameFromURL(fileUrl){
  if (fileUrl) {
    return fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
  } else{
    return '';
  }
};

export function plotUmapObs(obs, umap, clustering_plot_type = "leiden", selected_cell_intersection = [], annotation = null, n_dim = 3, plotName = 'umap') {
  // Parse JSON if umap is passed as a string
  if (typeof umap === "string") {
    umap = JSON.parse(umap);
  }

  // obs = gunzipDict(obs);

  // Check if obs is an object and has the required properties

  if (!Array.isArray(umap) || !Array.isArray(umap[0])) {
    throw new Error("umap must be a 2D array");
  }

  if (![2, 3].includes(n_dim)) {
    throw new Error("n_dim must be either 2 or 3");
  }

  let cluster_id_exists = Object.keys(obs).includes(clustering_plot_type);

  if (!cluster_id_exists) {
    const possibleClusters = ['cell_type', 'cell_ontology_class', 'CellType', 'label', "labels", 'celltype', "cluster.ids", "leiden", "louvain", "seurat_clusters"];
    for (const cluster_id of possibleClusters) {
      if (Object.keys(obs).includes(cluster_id)) {
        clustering_plot_type = cluster_id;
        cluster_id_exists = true;
        break;
      }
    }
  }

  if (!cluster_id_exists) {
    alert(`${clustering_plot_type} does not exist in ${Object.keys(obs)}`);
  }

  let traces = [];

// Get unique ontology classes (these act like cluster labels)
  const uniqueClusters = [...new Set(obs[clustering_plot_type])].sort();

// Loop over each unique cluster
uniqueClusters.forEach((val, i) => {
    // Get the indices of cells belonging to this cluster
    const clusterIndices = obs[clustering_plot_type]
        .map((cluster, index) => (cluster === val ? index : -1))
        .filter(index => index !== -1);

        const b = clusterIndices.map(index => [...umap[index]]); 

      const x = b.map(row => row[0]); // Extract x-values
      const y = b.map(row => row[1]); // Extract y-values
      const z = n_dim === 3 ? b.map(row => row[2]) : null; // Extract z-values if 3D
  
      // Determine selected points
    let selectedpoints = [];
    if (!selected_cell_intersection || selected_cell_intersection.length === 0) {
      selectedpoints = [...Array(clusterIndices.length).keys()];
    } else {
      selectedpoints = selected_cell_intersection
        .map(cell => obs.indexOf(cell))
        .filter(index => index !== -1);
    }

     // Handle annotations like Python function
     let text = [];
     if (annotation && Object.keys(obs).includes(annotation)) {
       text = clusterIndices.map(index => String(obs[annotation][index]));
     } else {
       text = clusterIndices.map(index => `Cell ID: ${obs.index[index]}`);
     }

     // Create a Plotly scatter trace (2D or 3D)
    const trace = {
      type: n_dim === 3 ? "scatter3d" : "scattergl",
      x: x,
      y: y,
      ...(n_dim === 3 && { z: z }),
      text: text,
      mode: "markers",
      marker: {
        size: n_dim === 3 ? point_size_3d : point_size_2d,
        line: { width: n_dim === 3 ? point_line_width_3d : point_line_width_2d, color: "grey" },
        color: discrete_colors_3[i % discrete_colors_3.length]
      },
      unselected: { marker: { opacity: min_opacity } },
      selected: { marker: { opacity: max_opacity } },
      selectedpoints: selectedpoints,
      name: `${val}`
    };

    traces.push(trace);
  });

  const layout = {
    xaxis: plotName === 'umap' ? { title: "UMAP 1" } : { title: "t-SNE 1" },
    yaxis: plotName === 'umap' ? { title: "UMAP 2" } : { title: "t-SNE 2" },
    ...(n_dim === 3 ? { zaxis: plotName === 'umap' ? { title: "UMAP 3" } : { title: "t-SNE 3" } } : {}),
    margin,
    hovermode: "closest",
    transition: { duration: 250 },
    autosize: true,
    width: 4 * scale,
    height: 3 * scale,
  };

  return JSON.stringify({ data: traces, layout });
}

// Keep this function to unzip the compressed data (from python)
export const gunzipDict = (gzippedBase64) => {
  try {
    // Decode Base64 string to binary string
    const binaryString = atob(gzippedBase64);

    // Convert binary string to Uint8Array
    const uint8Array = new Uint8Array([...binaryString].map(char => char.charCodeAt(0)));

    // Decompress the gzipped data
    const decompressedData = pako.ungzip(uint8Array, { to: "string" });
    let cleanedDecompressedData = decompressedData.replace(/NaN/g, 'null');

    // Parse JSON string to JavaScript object
    return JSON.parse(cleanedDecompressedData);
  } catch (error) {
    console.error("Error decompressing data:", error);
    return null;
  }
};

// Scale of plot sizes
// All plot geometry is expressed as multiples
// of these parameters
const scale = 250;

// Margins on plots
const margin = { r: 50, l: 50, t: 50, b: 50 };

// Point sizes
const point_line_width_2d = 0.5;
const point_line_width_3d = 0.5;
const point_size_2d = 7;
const point_size_3d = 2.5;

// Min and max opacity of points in scatter plots
const min_opacity = 0.15;
const max_opacity = 1;


// Colors from multiple Plotly qualitative color scales combined (D3, Set3, T10, Plotly, Alphabet)
const discrete_colors_3 = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", 
  "#e377c2", "#7f7f7f", "#bcbd22", "#17becf", "#8dd3c7", "#ffffb3", 
  "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", 
  "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f", "#ffff99", "#c4e1ff", 
  "#eb8d2b", "#d7d7d7", "#ff94b5", "#a6a6a6", "#c5b0b0", "#8d9b9e"
];


// Initialize Vitessce with custom view config
export const ShowVitessce = ({processId, description, zarrPath, initialFeatureFilterPath, obsEmbedding, obsSets}) => {
  const zarrUrl = NODE_DATA_URL + zarrPath.replace("/usr/src/app/storage/zarr", "");
  const config = {
    version: "1.0.17",
    name: description,
    description: description,
    datasets: [
      {
        uid: processId,
        name: description,
        files: [
          {
            fileType: "anndata.zarr",
            url: zarrUrl,
            coordinationValues: {
              embeddingType: "UMAP",
            },
            options: {
              obsFeatureMatrix: {
                path: "X",
                initialFeatureFilterPath: initialFeatureFilterPath,
              },
              obsEmbedding: {
                path: obsEmbedding,
              },
              obsSets: obsSets,
            },
          },
        ],
      },
    ],
    initStrategy: "auto",
    coordinationSpace: {
      embeddingType: {
        UMAP: "UMAP",
      },
      featureValueColormapRange: {
        A: [0, 0.35],
      },
    },
    layout: [
      {
        component: "obsSets",
        h: 4, w: 4, x: 4, y: 0,
      },
      {
        component: "obsSetSizes",
        h: 4, w: 4, x: 8, y: 0,
      },
      {
        component: "scatterplot",
        h: 4, w: 4, x: 0, y: 0,
        coordinationScopes: {
          embeddingType: "UMAP",
          featureValueColormapRange: "A",
        },
      },
      {
        component: "heatmap",
        h: 4, w: 8, x: 0, y: 4,
        coordinationScopes: {
          featureValueColormapRange: "A",
        },
        props: {
          transpose: true,
        },
      },
      {
        component: "featureList",
        h: 4, w: 4, x: 8, y: 4,
      },
    ],
  };

  console.log("Vitessce config:", config);

  return (
    <Vitessce
      config={config}
      height={900}
      theme="light"
    />
  );
}