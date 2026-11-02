import React, { useMemo, useState } from "react";
import LeftNav from "../../../components/LeftNavigation/leftNav";
import ToolsDetailsComponent from "../../../components/MyData/Tools/toolsDetailsComponent";
import RightRail from "../../../components/RightNavigation/rightRail";
import useUserAuthCheck from "../../../components/common_components/userAuthCheckComponent";
import "./toolsPageOverview.css";

// The category and method descriptions originate from the Tools Overview HTML.
const TOOL_CATEGORIES = [
  {
    "id": 1,
    "name": "Quality Control",
    "summary": "Screen cells and characterize data quality before downstream analysis.",
    "icon": "shield",
    "tone": "blue",
    "count": 4
  },
  {
    "id": 2,
    "name": "Imputation",
    "summary": "Reduce expression noise and recover estimated signal for exploratory analyses.",
    "icon": "sparkles",
    "tone": "indigo",
    "count": 2
  },
  {
    "id": 3,
    "name": "Normalization",
    "summary": "Transform expression values and account for library size or other technical effects.",
    "icon": "adjust",
    "tone": "cyan",
    "count": 11
  },
  {
    "id": 4,
    "name": "Integration",
    "summary": "Combine samples, batches, or studies into a coordinated representation.",
    "icon": "layers",
    "tone": "teal",
    "count": 4
  },
  {
    "id": 5,
    "name": "Annotation",
    "summary": "Transfer reference knowledge to predicted cell identities.",
    "icon": "tag",
    "tone": "violet",
    "count": 3
  },
  {
    "id": 6,
    "name": "Formatting",
    "summary": "Prepare compatible data structures and exchange formats.",
    "icon": "repeat",
    "tone": "slate",
    "count": 1
  },
  {
    "id": 7,
    "name": "Visualization",
    "summary": "Explore cellular structure through dimensionality reduction.",
    "icon": "scatter",
    "tone": "orange",
    "count": 2
  }
];
const TOOL_METHODS = [
  {
    "id": 1,
    "category": 1,
    "name": "Bioconductor",
    "summary": "R ecosystem for quality assessment and processing of single-cell assays.",
    "use": "Use when analysis is organized around Bioconductor workflows.",
    "output": "Quality metrics and filtered assays",
    "note": "A software ecosystem, not one single QC algorithm."
  },
  {
    "id": 2,
    "category": 1,
    "name": "Scanpy",
    "summary": "Python tools for computing QC metrics, filtering cells, and preparing expression matrices.",
    "use": "Use when processing AnnData in a Python-centric analysis.",
    "output": "QC summaries and filtered AnnData",
    "note": "QC thresholds should reflect the dataset and assay."
  },
  {
    "id": 3,
    "category": 1,
    "name": "Seurat",
    "summary": "R-based single-cell QC and preprocessing utilities.",
    "use": "Use when managing single-cell objects in a Seurat workflow.",
    "output": "QC visualizations and filtered objects",
    "note": "The same name also appears under Integration; the tasks are distinct."
  },
  {
    "id": 4,
    "category": 1,
    "name": "Dropkick",
    "summary": "Data-driven cell calling and identification of likely empty droplets.",
    "use": "Use for droplet-based data when cell-calling decisions need review.",
    "output": "Cell-quality classifications",
    "note": "Cell calling is one part of quality control."
  },
  {
    "id": 5,
    "category": 2,
    "name": "MAGIC",
    "summary": "Diffusion-based smoothing to estimate denoised gene-expression patterns.",
    "use": "Explore relationships obscured by sparse count measurements.",
    "output": "Smoothed expression estimates",
    "note": "Smoothing may alter variability and apparent gene relationships."
  },
  {
    "id": 6,
    "category": 2,
    "name": "SAVER",
    "summary": "Statistical recovery of gene expression from sparse single-cell measurements.",
    "use": "Explore denoised expression with uncertainty-aware estimation.",
    "output": "Recovered expression estimates",
    "note": "Recovered expression is modeled, not directly measured."
  },
  {
    "id": 7,
    "category": 3,
    "name": "LogCPM",
    "summary": "Library-size scaling to counts per million followed by log transformation.",
    "use": "Compare expression on a log-transformed CPM scale.",
    "output": "Log-transformed CPM values",
    "note": "The pseudocount convention matters for reproducibility."
  },
  {
    "id": 8,
    "category": 3,
    "name": "LogCP10K",
    "summary": "Scale counts per 10,000 and then log-transform.",
    "use": "Use a familiar library-size normalized representation.",
    "output": "Log-transformed counts per 10K",
    "note": "Check the logarithm and pseudocount conventions."
  },
  {
    "id": 9,
    "category": 3,
    "name": "sctransform",
    "summary": "Model-based normalization with variance stabilization for UMI counts.",
    "use": "Normalize UMI-based assays and reduce technical depth effects.",
    "output": "Variance-stabilized expression",
    "note": "Model settings should be reported with results."
  },
  {
    "id": 10,
    "category": 3,
    "name": "DEseq2",
    "summary": "Count-based size-factor normalization originating in bulk RNA-seq analysis.",
    "use": "Evaluate size-factor scaling for suitable count matrices.",
    "output": "Normalized count values",
    "note": "Assess suitability for sparse single-cell data."
  },
  {
    "id": 11,
    "category": 3,
    "name": "scran",
    "summary": "Deconvolution-based size-factor estimation for single-cell counts.",
    "use": "Estimate library size factors from heterogeneous cell populations.",
    "output": "Cell-specific size factors",
    "note": "Pooling and clustering choices can affect estimates."
  },
  {
    "id": 12,
    "category": 3,
    "name": "TMM",
    "summary": "Trimmed Mean of M-values scaling for composition differences.",
    "use": "Examine library composition normalization approaches.",
    "output": "Scaling factors",
    "note": "Primarily developed for bulk RNA-seq; assess assay fit."
  },
  {
    "id": 13,
    "category": 3,
    "name": "RLE",
    "summary": "Relative log expression–based scaling of count profiles.",
    "use": "Compare expression distributions through a reference-based scale.",
    "output": "Normalized expression values",
    "note": "Assumptions about broad expression stability matter."
  },
  {
    "id": 14,
    "category": 3,
    "name": "UpperQuartile",
    "summary": "Upper-quartile scaling to reduce library-size and composition effects.",
    "use": "Use a robust distribution-based scaling baseline.",
    "output": "Rescaled expression",
    "note": "Sensitivity depends on the count distribution."
  },
  {
    "id": 15,
    "category": 3,
    "name": "TPM",
    "summary": "Transcript-per-million abundance adjusted for feature length.",
    "use": "Represent expression when transcript lengths are available.",
    "output": "Length-adjusted expression abundance",
    "note": "Not a default replacement for UMI count normalization."
  },
  {
    "id": 16,
    "category": 3,
    "name": "FPKM",
    "summary": "Fragments per kilobase per million mapped fragments.",
    "use": "Represent length-adjusted expression for applicable assays.",
    "output": "FPKM abundance values",
    "note": "Not generally equivalent to UMI count normalization."
  },
  {
    "id": 17,
    "category": 3,
    "name": "PEARSON_RESIDUALS",
    "summary": "Variance-stabilizing transformation based on Pearson residuals.",
    "use": "Inspect expression patterns under a count-based noise model.",
    "output": "Residual-based transformed values",
    "note": "Interpret results in relation to the assumed count model."
  },
  {
    "id": 18,
    "category": 4,
    "name": "Seurat",
    "summary": "Anchor-based strategies for aligning related single-cell datasets.",
    "use": "Integrate expression profiles from multiple samples or studies.",
    "output": "Integrated representation",
    "note": "Review preservation of biological differences."
  },
  {
    "id": 19,
    "category": 4,
    "name": "Harmony",
    "summary": "Batch-effect correction in a lower-dimensional embedding.",
    "use": "Align batches after dimensionality reduction.",
    "output": "Corrected embeddings",
    "note": "Harmony commonly modifies embeddings rather than raw counts."
  },
  {
    "id": 20,
    "category": 4,
    "name": "Liger",
    "summary": "Integrative non-negative matrix factorization of related datasets.",
    "use": "Analyze shared and dataset-specific factors across studies.",
    "output": "Joint factor representation",
    "note": "Inspect harmonization and retained dataset-specific structure."
  },
  {
    "id": 21,
    "category": 4,
    "name": "scVI",
    "summary": "Probabilistic latent-variable modeling for single-cell count data.",
    "use": "Learn a shared latent space with modeled technical effects.",
    "output": "Latent representations",
    "note": "Training and model setup influence the resulting embedding."
  },
  {
    "id": 22,
    "category": 5,
    "name": "CellTypist",
    "summary": "Automated cell-identity prediction using trained reference classifiers.",
    "use": "Annotate cells against an appropriate reference model.",
    "output": "Predicted cell-type labels",
    "note": "Predictions depend strongly on reference coverage."
  },
  {
    "id": 23,
    "category": 5,
    "name": "scANVI",
    "summary": "Semi-supervised deep generative modeling for label transfer.",
    "use": "Transfer labels while modeling variation among cells and datasets.",
    "output": "Predicted labels and latent representation",
    "note": "Review uncertain assignments and reference dependence."
  },
  {
    "id": 24,
    "category": 5,
    "name": "SingleR",
    "summary": "Reference-based annotation through expression-profile comparison.",
    "use": "Assign identities using labeled reference expression data.",
    "output": "Reference-matched cell labels",
    "note": "Reference choice and label granularity affect interpretation."
  },
  {
    "id": 25,
    "category": 6,
    "name": "Convert",
    "summary": "Conversion between supported analysis data representations.",
    "use": "Prepare inputs for another tool or interchange workflow.",
    "output": "Converted dataset or file",
    "note": "Supported formats depend on the configured environment."
  },
  {
    "id": 26,
    "category": 7,
    "name": "UMAP",
    "summary": "Nonlinear dimensionality reduction for displaying cellular neighborhoods.",
    "use": "Explore continuous structures and clusters in 2D.",
    "output": "Two-dimensional coordinates",
    "note": "Distances and cluster shapes depend on settings."
  },
  {
    "id": 27,
    "category": 7,
    "name": "t-SNE",
    "summary": "Nonlinear embedding emphasizing local similarities among cells.",
    "use": "Visualize neighborhood organization and population separation.",
    "output": "Two-dimensional coordinates",
    "note": "Global distances are not directly interpretable."
  }
];

const PIPELINE = [
  { id: 1, label: "Quality Control", sub: "Inspect and filter" },
  { id: 3, label: "Normalization", sub: "Scale expression" },
  { id: 4, label: "Integration", sub: "Align datasets" },
  { id: 5, label: "Annotation", sub: "Assign cell types" },
  { id: 7, label: "Visualization", sub: "Explore structure" },
];

const ToolIcon = ({ name, size = 23 }) => {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  switch (name) {
    case "shield": return <svg {...common}><path d="M12 2 20 6v5c0 5.3-3.3 9-8 11-4.7-2-8-5.7-8-11V6l8-4Z"/><path d="m9 12 2 2 4-4"/></svg>;
    case "sparkles": return <svg {...common}><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 17 .7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17ZM4 1v4M2 3h4"/></svg>;
    case "adjust": return <svg {...common}><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="white"/><circle cx="16" cy="17" r="3" fill="white"/></svg>;
    case "layers": return <svg {...common}><path d="m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"/></svg>;
    case "tag": return <svg {...common}><path d="M20 13 12.7 20.3a2.3 2.3 0 0 1-3.2 0L3.7 14.5A2.3 2.3 0 0 1 3 12.9V4a1 1 0 0 1 1-1h8.9a2.3 2.3 0 0 1 1.6.7L20 9.2a2.7 2.7 0 0 1 0 3.8Z"/><circle cx="8" cy="8" r="1.5"/></svg>;
    case "repeat": return <svg {...common}><path d="M4 7h13l-3-3m3 3-3 3M20 17H7l3-3m-3 3 3 3"/></svg>;
    case "scatter": return <svg {...common}><path d="M4 3v17h17"/><circle cx="9" cy="15" r="1.6"/><circle cx="14" cy="11" r="1.6"/><circle cx="18" cy="6" r="1.6"/></svg>;
    default: return <svg {...common}><circle cx="12" cy="12" r="8"/></svg>;
  }
};

const Arrow = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>;

// This overview is only shown before a left-navigation method is chosen.
// onOpenTool reuses the existing selection handler for normal tool navigation.
function ToolsOverview({ onOpenTool }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [query, setQuery] = useState("");
  const [preferredToolId, setPreferredToolId] = useState(1);

  const filteredMethods = useMemo(() => {
    const term = query.trim().toLowerCase();
    return TOOL_METHODS.filter((tool) => {
      const group = TOOL_CATEGORIES.find((c) => c.id === tool.category);
      return (!activeCategory || tool.category === activeCategory) &&
        (!term || [tool.name, tool.summary, tool.use, tool.output, group?.name || ""].join(" ").toLowerCase().includes(term));
    });
  }, [activeCategory, query]);

  const selectedTool = filteredMethods.find((m) => m.id === preferredToolId) || filteredMethods[0] || null;
  const categoryFor = (id) => TOOL_CATEGORIES.find((c) => c.id === id);
  const chooseCategory = (id, scrollToCatalog = true) => {
    setActiveCategory(id);
    if (scrollToCatalog) {
      // Allow React to update; scroll without relying on global document selectors.
      requestAnimationFrame(() => {
        document.getElementById("tools-overview-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };
  const openSelected = () => {
    if (selectedTool) onOpenTool(categoryFor(selectedTool.category).name.toLowerCase().replace(/ /g, "_"), selectedTool.name.toLowerCase().replace(/ /g, "_"));
  };

  return (
    <div className="sc-tools-overview">
      <section className="sto-hero" aria-labelledby="sto-page-title">
        <div className="sto-hero-copy">
          <div className="sto-eyebrow">single-cell.ai <span>/</span> Analysis toolkit</div>
          <h1 id="sto-page-title">From raw counts to insight.<br /><span>One connected toolkit.</span></h1>
          <p>Explore the tools available across the single-cell analysis lifecycle, from quality control and normalization to integration, annotation, and visualization. Choose the method that fits your dataset, research question, and workflow.</p>
          <div className="sto-hero-actions">
            <button type="button" className="sto-button sto-button-primary" onClick={() => document.getElementById("tools-overview-categories")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Explore categories <Arrow /></button>
            <button type="button" className="sto-button sto-button-outline" onClick={() => chooseCategory(0)}>Browse all methods <Arrow /></button>
          </div>
          <div className="sto-hero-facts"><span>Seven analysis categories</span><span>27 listed methods</span><span>Project-based research</span></div>
        </div>
        <figure className="sto-hero-art">
          <div className="sto-art-heading"><span>Cellular landscape</span><span>ILLUSTRATIVE EMBEDDING</span></div>
          <img src="/images/doc/tools_overview_embedding.svg" alt="Illustrative UMAP scatterplot showing four populations of cells" loading="eager" />
          <figcaption>Conceptual figure, not an experimental result.</figcaption>
        </figure>
      </section>

      <div className="sto-stats" aria-label="Tool catalog summary">
        <div><strong>7</strong><span>Tool categories</span></div>
        <div><strong>27</strong><span>Named methods and utilities</span></div>
        <div><strong>11</strong><span>Normalization approaches</span></div>
      </div>

      <section id="tools-overview-categories" className="sto-section" aria-labelledby="sto-categories-title">
        <div className="sto-section-heading"><div><div className="sto-kicker">EXPLORE BY TASK</div><h2 id="sto-categories-title">Seven complementary tool families</h2><p>Select a category to narrow the catalog. Each addresses a different technical or biological question.</p></div></div>
        <div className="sto-category-grid">
          {TOOL_CATEGORIES.map((c) => (
            <button type="button" key={c.id} className={`sto-category sto-tone-${c.tone}`} aria-pressed={activeCategory === c.id} onClick={() => chooseCategory(c.id)}>
              <span className="sto-category-top"><span className="sto-icon"><ToolIcon name={c.icon} /></span><span className="sto-count">{String(c.count).padStart(2,"0")} tools</span></span>
              <strong>{c.name}</strong><span className="sto-category-desc">{c.summary}</span>
              <span className="sto-category-action">Explore category <Arrow size={15}/></span>
            </button>
          ))}
        </div>
      </section>

      <section className="sto-path" aria-labelledby="sto-path-heading">
        <div className="sto-kicker">ANALYSIS PATHWAY</div>
        <h2 id="sto-path-heading">A flexible path from measurements to meaning</h2>
        <p>These stages illustrate a typical sequence. Projects may skip, reorder, or combine them depending on the experiment.</p>
        <div className="sto-path-stages">
          {PIPELINE.map((step,i) => {
            const c = categoryFor(step.id);
            return <React.Fragment key={step.id}>
              {i > 0 && <span className="sto-stage-arrow" aria-hidden="true"><Arrow /></span>}
              <button type="button" className={`sto-stage sto-tone-${c.tone}`} onClick={() => chooseCategory(step.id)}>
                <span>{String(i+1).padStart(2, "0")} · {step.label.toUpperCase()}</span>
                <span className="sto-stage-symbol"><ToolIcon name={c.icon} size={22}/></span>
                <strong>{step.label}</strong><small>{step.sub}</small>
              </button>
            </React.Fragment>;
          })}
        </div>
      </section>

      <section id="tools-overview-catalog" className="sto-section sto-catalog" aria-labelledby="sto-catalog-heading">
        <div className="sto-section-heading"><div><div className="sto-kicker">METHOD CATALOG</div><h2 id="sto-catalog-heading">Find a method for your next step</h2><p>Search by name, task, or description. Select a method to see its use, expected output, and interpretation notes.</p></div></div>
        <div className="sto-catalog-controls">
          <label className="sto-search"><svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 5 5"/></svg><span className="sto-sr-only">Search tools</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tools, tasks, or descriptions…" type="search" /></label>
          <div className="sto-filter-row" role="group" aria-label="Filter tools by category">
            <button type="button" className="sto-filter" aria-pressed={activeCategory===0} onClick={() => chooseCategory(0,false)}>All methods <span>27</span></button>
            {TOOL_CATEGORIES.map((c) => <button type="button" className="sto-filter" key={c.id} aria-pressed={activeCategory===c.id} onClick={() => chooseCategory(c.id,false)}>{c.name} <span>{c.count}</span></button>)}
          </div>
          <div className="sto-results" role="status">Showing {filteredMethods.length} of 27 methods</div>
        </div>
        <div className="sto-catalog-layout">
          <div className="sto-method-grid">
            {filteredMethods.length ? filteredMethods.map((m) => {
              const c=categoryFor(m.category);
              return <button type="button" key={m.id} className={`sto-method sto-tone-${c.tone}`} aria-pressed={selectedTool?.id===m.id} onClick={() => setPreferredToolId(m.id)}>
                <span className="sto-method-top"><span className="sto-method-icon"><ToolIcon name={c.icon} size={21}/></span><span className="sto-method-index">{String(m.id).padStart(2,"0")}</span></span>
                <strong>{m.name}</strong><span className="sto-method-summary">{m.summary}</span><span className="sto-method-foot">{c.name} <Arrow size={15}/></span>
              </button>;
            }) : <div className="sto-empty">No methods match this search. Try a different keyword or category.</div>}
          </div>
          {selectedTool && (
            <aside className="sto-detail" aria-live="polite" aria-label="Selected tool details">
              <div className="sto-detail-heading"><span className={`sto-detail-icon sto-tone-${categoryFor(selectedTool.category).tone}`}><ToolIcon name={categoryFor(selectedTool.category).icon} size={26}/></span><div><span>{categoryFor(selectedTool.category).name}</span><h3>{selectedTool.name}</h3></div></div>
              <p className="sto-detail-summary">{selectedTool.summary}</p>
              <div className="sto-detail-body"><h4>Where it helps</h4><p>{selectedTool.use}</p><h4>Typical output</h4><p>{selectedTool.output}</p><h4>Interpretation note</h4><p className="sto-note">{selectedTool.note}</p>
              <button type="button" className="sto-open-tool" onClick={openSelected}>Open {selectedTool.name} <Arrow size={18}/></button>
              </div>
            </aside>
          )}
        </div>
      </section>
      <footer className="sto-footer">single-cell.ai Tools Overview · 7 categories · 27 listed methods. See individual tool settings and output documentation for reproducible analysis.</footer>
    </div>
  );
}

export default function ToolsComponentPage() {
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [category, setCategory] = useState(null);

  // Keep the existing selection contract, also used by the left navigation.
  const handleFilterSelection = (selectedCategory, filter) => {
    setSelectedFilter(selectedCategory + "_" + filter);
    setCategory(selectedCategory);
  };

  useUserAuthCheck();

  return (
    <div className="page-container">
      <div className="left-nav border-r left-nav-background">
        <LeftNav handleFilterSelection={handleFilterSelection} />
      </div>

      {selectedFilter ? (
        <div className="filter-details-tools main-content">
          <ToolsDetailsComponent filter={selectedFilter} category={category} />
        </div>
      ) : (
        <div className="filter-details-tools main-content sc-tools-overview-host">
          <ToolsOverview onOpenTool={handleFilterSelection} />
        </div>
      )}

      <div className="right-rail"><RightRail /></div>
    </div>
  );
}
