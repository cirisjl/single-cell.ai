import React, { useCallback, useRef, useState } from 'react';
import LeftNavComponent from '../../../components/MyData/Workflows/components/leftnavComponent';
import { WorkflowsComponent } from '../../../components/MyData/Workflows/workflowsComponent';
import RightRail from '../../../components/RightNavigation/rightRail';
import useUserAuthCheck from '../../../components/common_components/userAuthCheckComponent';
import './workflowsPageOverview.css';

/** Content and method names are adapted from the existing Workflows HTML overview. */
const OVERVIEW_WORKFLOWS = {
  clustering: {
    name:'Clustering', kicker:'01 / Clustering', title:'Discover cell populations', badge:'Unsupervised analysis',
    description:'Apply QC, normalize expression, optionally impute missing signal, and construct a cell-neighborhood graph for clustering and visualization.',
    stages:['Quality Control','Normalization','Clustering','Visualization'],
    foot:'One QC method at a time; multiple normalization methods can be compared.',
    asideTitle:'Clustering workflow', asideDesc:'Select a dataset, configure QC and normalization, and inspect how cells organize into clusters.',
    tags:['Scanpy','Seurat','LogCPM','sctransform','Optional imputation'],
    note:'Normalization and optional imputation precede neighborhood and cluster analysis.'
  },
  integration: {
    name:'Integration', kicker:'02 / Integration', title:'Connect datasets across batches', badge:'Batch-effect correction',
    description:'Perform QC and integrate multiple datasets or batches to reduce technical differences while preserving biological structure.',
    stages:['Quality Control','Batch Metadata','Integration','Visualize & Review'],
    foot:'Integration supports multiple datasets; inspect both batch mixing and biological preservation.',
    asideTitle:'Integration workflow', asideDesc:'Choose the batch key and compare integration approaches on relevant samples or datasets.',
    tags:['Seurat','Harmony','LIGER','scVI'],
    note:'Pseudo-replicates from pooled data are not independent biological replicates.'
  },
  annotation: {
    name:'Annotation', kicker:'03 / Annotation', title:'Interpret cell identities', badge:'Reference-aware analysis',
    description:'Perform QC and integration, apply one or more annotation tools, and review predicted cell identities against biological references and marker genes.',
    stages:['Quality Control','Integration','Annotation','Review Labels'],
    foot:'Multiple annotation methods may be selected; independent validation remains important.',
    asideTitle:'Annotation workflow', asideDesc:'Choose a compatible reference and the label field, then compare cell-type predictions and assess uncertainty.',
    tags:['CellTypist','scANVI','SingleR','Reference labels'],
    note:'scANVI requires a suitable labeled reference dataset in this workflow.'
  }
};

function WorkflowsOverview({ onOpenWorkflow }) {
  const [previewWorkflow, setPreviewWorkflow] = useState('clustering');
  const detailRef = useRef(null);
  const current = OVERVIEW_WORKFLOWS[previewWorkflow];
  const choosePreview = useCallback((workflowKey) => {
    if (!OVERVIEW_WORKFLOWS[workflowKey]) return;
    setPreviewWorkflow(workflowKey);
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    detailRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  }, []);
  const openWorkflow = useCallback((workflowKey) => {
    const workflow = OVERVIEW_WORKFLOWS[workflowKey];
    if (workflow) onOpenWorkflow('Workflow', workflow.name);
  }, [onOpenWorkflow]);

  return (
    <div className="workflow-overview">
<main>

<section className="hero" aria-labelledby="wf-overview-page-title">
<div className="wrap hero-grid">
<div>
<div className="eyebrow">Single-cell.ai  /  Analysis workflows</div>
<h1 id="wf-overview-page-title">From single-cell data<br/>to biological insight.</h1>
<p className="lead">Build reproducible analyses with guided workflows for <strong>Clustering</strong>, <strong>Integration</strong>, and <strong>Annotation</strong>. Combine established methods, examine intermediate results, and move from raw datasets to interpretable cell populations.</p>
<div className="hero-cta"><a className="btn btn-primary" href="#wf-overview-explore">Explore workflows <span className="arrow" aria-hidden="true">→</span></a><a className="btn btn-secondary" href="../doc/?doc=workflows">Read workflow documentation <span className="arrow" aria-hidden="true">↗</span></a></div>
<div className="note">Select inputs · Configure stages · Run asynchronously · Review outputs</div>
</div>
<div className="hero-art" aria-label="Illustrative single-cell embedding visualization">
<div className="art-top"><div className="window" aria-hidden="true"><i></i><i></i><i></i></div><span className="art-tag">ILLUSTRATIVE CELL EMBEDDING</span></div>
<img className="umap" src="/images/doc/workflows_embedding.svg" alt="Illustrative cell embedding with separated clusters" />
<div className="figure-bottom"><strong>Explore cellular diversity</strong><div className="legend"><span><i style={{ background: '#1c8dd6' }}></i>Group A</span><span><i style={{ background: '#0fa5a0' }}></i>Group B</span><span><i style={{ background: '#8079cc' }}></i>Group C</span></div></div>
<p className="diagram-foot">Conceptual visualization; not experimental or benchmark results.</p>
</div>
</div>
</section>
<div className="wrap" aria-label="Workflow highlights">
<div className="stats">
<div className="stat"><div className="stat-icon"><svg width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><circle cx="7" cy="7" r="3"></circle><circle cx="17" cy="7" r="3"></circle><circle cx="12" cy="17" r="3"></circle><path d="m9 9 2 5m4-5-2 5"></path></svg></div><div><strong>3</strong><span>Guided workflow types</span></div></div>
<div className="stat"><div className="stat-icon"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14M5 12h14M5 20h14"></path><path d="M8 4v16m8-16v16"></path></svg></div><div><strong>Shared QC</strong><span>Consistent starting point</span></div></div>
<div className="stat"><div className="stat-icon"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="m8 12 3 3 5-6"></path></svg></div><div><strong>Traceable</strong><span>Processes, methods & results</span></div></div>
</div>
</div>
<section id="wf-overview-explore" className="section wrap" aria-labelledby="wf-overview-explore-title">
<div className="section-heading"><div><div className="eyebrow">Choose your workflow</div><h2 id="wf-overview-explore-title">Three paths, one analysis environment</h2><p className="section-sub">Each workflow begins with quality control, then follows a task-specific path. Select a workflow below to inspect its stages and available methods.</p></div><div className="pill"><span aria-hidden="true">●</span> Workflow / Clustering · Integration · Annotation</div></div>
<div className="workflow-grid" role="group" aria-label="Choose a workflow">
<button type="button" className="workflow-card cluster" data-workflow="clustering" aria-pressed={previewWorkflow === 'clustering'} aria-controls="wf-overview-workflow-details" onClick={() => choosePreview('clustering')}><span className="card-top"><span className="card-symbol"><svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="7" r="2"></circle><circle cx="10" cy="12" r="2"></circle><circle cx="7" cy="18" r="2"></circle><circle cx="17" cy="5" r="2"></circle><circle cx="19" cy="12" r="2"></circle><circle cx="16" cy="18" r="2"></circle></svg></span><span className="card-no">01 / EXPLORE</span></span><strong>Clustering</strong><span className="description">Identify cellular populations through normalization, neighborhood construction, and unsupervised clustering.</span><span className="card-action">View workflow <span aria-hidden="true">↗</span></span></button>
<button type="button" className="workflow-card integrate" data-workflow="integration" aria-pressed={previewWorkflow === 'integration'} aria-controls="wf-overview-workflow-details" onClick={() => choosePreview('integration')}><span className="card-top"><span className="card-symbol"><svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7c4-4 6-4 10 0s6 4 8 0M3 17c4-4 6-4 10 0s6 4 8 0"></path><path d="M12 2v20" strokeDasharray="2 3"></path></svg></span><span className="card-no">02 / HARMONIZE</span></span><strong>Integration</strong><span className="description">Address batch effects across samples or datasets while retaining meaningful biological differences.</span><span className="card-action">View workflow <span aria-hidden="true">↗</span></span></button>
<button type="button" className="workflow-card annotate" data-workflow="annotation" aria-pressed={previewWorkflow === 'annotation'} aria-controls="wf-overview-workflow-details" onClick={() => choosePreview('annotation')}><span className="card-top"><span className="card-symbol"><svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h11l7 7-10 10-8-8z"></path><circle cx="8" cy="9" r="1.5"></circle><path d="M10 15l2 2"></path></svg></span><span className="card-no">03 / INTERPRET</span></span><strong>Annotation</strong><span className="description">Assign biologically meaningful cell identities with reference-aware tools and review predicted labels.</span><span className="card-action">View workflow <span aria-hidden="true">↗</span></span></button>
</div>
<div aria-atomic="false" aria-live="polite" className="details" id="wf-overview-workflow-details" ref={detailRef}>
          <div className="detail-main">
            <div className="detail-title-row">
              <div><div className="eyebrow">{current.kicker}</div><h3>{current.title}</h3></div>
              <span className="detail-badge">{current.badge}</span>
            </div>
            <p className="detail-muted">{current.description}</p>
            <ol className="steps-flow" aria-label="Selected workflow stages">
              {current.stages.map((stage,index) => (
                <li className={index===current.stages.length-1 ? "active" : ""} key={stage}>
                  <span className="step-tile">{stage}</span>
                </li>
              ))}
            </ol>
            <div className="detail-foot">
              <svg aria-hidden="true" fill="none" height="17" stroke="#478ea6" strokeWidth="1.7" viewBox="0 0 24 24" width="17"><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/></svg>
              <span>{current.foot}</span>
            </div>
            <button type="button" className="open-workflow" onClick={() => openWorkflow(previewWorkflow)}>Open {current.name} workflow ↗</button>
          </div>
          <aside className="detail-aside">
            <div className="aside-label">Configuration &amp; methods</div>
            <h3 className="aside-title">{current.asideTitle}</h3>
            <p className="aside-desc">{current.asideDesc}</p>
            <div className="aside-label">Example supported methods</div>
            <div className="tag-cloud">{current.tags.map(tag=><span className="tag" key={tag}>{tag}</span>)}</div>
            <div className="aside-note">{current.note}</div>
          </aside>
        </div>
</section>
<section className="overview-band" aria-labelledby="process-title"><div className="wrap"><div className="eyebrow">How it works</div><h2 id="process-title">A connected workflow from input to insight</h2><p className="section-sub">Workflows run as background jobs, with results retained across intermediate processes for inspection and downstream analysis.</p><div className="journey">
<div className="journey-step"><span className="number">01</span><h3>Select data</h3><p>Choose an uploaded dataset, processed result, or suitable reference.</p></div>
<div className="journey-step"><span className="number">02</span><h3>Configure stages</h3><p>Set quality-control thresholds and task-specific methods.</p></div>
<div className="journey-step"><span className="number">03</span><h3>Submit & monitor</h3><p>Run asynchronously and follow job progress in My Jobs.</p></div>
<div className="journey-step"><span className="number">04</span><h3>Review & reuse</h3><p>Inspect outputs, embeddings, labels, and intermediate results.</p></div>
</div></div></section>
<section className="wrap bottom" aria-label="Getting started and resources"><div className="bottom-grid">
<div className="info-panel"><div className="eyebrow">Before you start</div><h3>Prepare a reliable analysis</h3><p>Confirm that the chosen workflow is appropriate for your experimental design and available metadata.</p><ul className="checklist"><li>Upload your data and verify species and gene identifiers.</li><li>Check raw counts and the available processing stages.</li><li>For integration, choose a valid sample or batch column.</li><li>For annotation, use a compatible labeled reference when needed.</li></ul></div>
<div className="info-panel"><div className="eyebrow">Documentation</div><h3>Continue with detailed guidance</h3><p>Use the existing single-cell.ai documentation for step-by-step setup, execution, and review.</p><div className="resource-links"><a href="../doc/?doc=workflows">Full workflows guide <span aria-hidden="true">↗</span></a><a href="../doc/?doc=data_management">Data management <span aria-hidden="true">↗</span></a><a href="../doc/?doc=job_management">Job management <span aria-hidden="true">↗</span></a><a href="../doc/?doc=workflows_annotation">Mouse bone marrow annotation tutorial <span aria-hidden="true">↗</span></a></div></div>
</div></section>
</main>
    </div>
  );
}

export default function WorkflowsPageComponent() {
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [uniqueFilter, setUniqueFilter] = useState('');

  const handleFilterSelection = (category, filter) => {
    setUniqueFilter(category + '_' + filter);
    setSelectedWorkflow(filter);
  };

  useUserAuthCheck();

  return (
    <div className="page-container">
      <div className="left-nav">
        <LeftNavComponent
          selectedWorkflow={selectedWorkflow}
          setSelectedWorkflow={setSelectedWorkflow}
          handleFilterSelection={handleFilterSelection}
        />
      </div>
      {selectedWorkflow ? (
        <div className="filter-details-tools main-content">
          <WorkflowsComponent selectedWorkflow={selectedWorkflow} uniqueFilter={uniqueFilter} />
        </div>
      ) : (
        <div className="filter-details-tools main-content workflow-overview-host">
          <WorkflowsOverview onOpenWorkflow={handleFilterSelection} />
        </div>
      )}
      <div className="right-rail"><RightRail /></div>
    </div>
  );
}
