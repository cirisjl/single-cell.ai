import LZString from 'lz-string';
import pako from 'pako'; // Import pako, a zlib-compatible library for browsers

// 禁用eslint
console.log("Worker 脚本已加载");

/* eslint-disable no-restricted-globals */
self.onmessage = function (event) {
    const { obs, umap, clustering_plot_type, selected_cell_intersection, annotation, n_dim, plotName } = event.data;
    console.log("event.data", event.data);
    const result = plotUmapObs(obs, umap, clustering_plot_type, selected_cell_intersection, annotation, n_dim, plotName);
    self.postMessage(result);
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

function plotUmapObs(obs, umap, clustering_plot_type = "leiden", selected_cell_intersection = [], annotation = null, n_dim = 3, plotName = 'umap') {
    // Parse JSON if umap is passed as a string
    if (typeof umap === "string") {
        umap = JSON.parse(umap);
    }

    obs = gunzipDict(obs);

    // Check if obs is an object and has the required properties

    if (!Array.isArray(umap) || !Array.isArray(umap[0])) {
        throw new Error("umap must be a 2D array");
    }

    if (![2, 3].includes(n_dim)) {
        throw new Error("n_dim must be either 2 or 3");
    }

    let cluster_id_exists = Object.keys(obs).includes(clustering_plot_type);

    if (!cluster_id_exists) {
        const possibleClusters = ["cluster.ids", "leiden", "louvain", "seurat_clusters"];
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

// Function to compress data
function compressData(data) {
    // Convert data to JSON string
    const jsonString = JSON.stringify(data);
    // Compress and encode in Base64 format
    const compressedString = LZString.compressToBase64(jsonString);
    return compressedString;
}

// Function to decompress data
function decompressData(compressedString) {
    // Decode and decompress the Base64 string
    const jsonString = LZString.decompressFromBase64(compressedString);
    // Parse JSON string to get original data
    return JSON.parse(jsonString);
}

// Keep this function to unzip the compressed data (from python)
const gunzipDict = (gzippedBase64) => {
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