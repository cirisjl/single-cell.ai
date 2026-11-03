import { useEffect, useRef, useState } from 'react';
import './getStarted.css';

// Content uses native JSX; no Markdown renderer or remote content loader.
const WORKFLOWS = {
  analysis: [
    ['◈','Discover','Find datasets','Browse public datasets or upload supported files with project metadata.'],
    ['✧','Preprocess','Quality control','Filter low-quality observations, normalize, and prepare inputs.'],
    ['⬡','Integrate','Harmonize batches','Apply integration methods when study design requires it.'],
    ['♧','Annotate','Identify cells','Compare cell-type predictions and review biological markers.'],
    ['✦','Explore','Interpret results','Investigate embeddings and expression; validate before sharing.'],
  ],
  benchmark: [
    ['◈','Select','Curated inputs','Choose benchmark datasets with traceable preprocessing.'],
    ['⌘','Implement','Methods','Integrate tools or build new analysis methods.'],
    ['▤','Execute','Run jobs','Apply methods using reproducible execution environments.'],
    ['▥','Evaluate','Task metrics','Measure appropriate metrics and compare methods fairly.'],
    ['↻','Improve','Iterate','Refine parameters or methods and rerun comparisons.'],
  ],
};

const EXAMPLE_CODE = 'from oscb.data import DataLoader\n\nadata = DataLoader("CL-m-FACS_Bladder-1268-Tabula-2018", data_folder="./datasets/")';

function FlowSection() {
  const [mode,setMode] = useState('analysis');
  const [current,setCurrent] = useState(0);
  const [playing,setPlaying] = useState(false);
  // Respect the user's OS reduced-motion preference on initial mount.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      setPlaying(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);
  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) {
        setCurrent(value => (value+1)%WORKFLOWS[mode].length);
      }
    },2200);
    return () => window.clearInterval(id);
  },[playing,mode]);
  const steps=WORKFLOWS[mode];
  const selected=steps[current];
  const setWorkflow=(next)=>{setMode(next);setCurrent(0)};
  return (
    <div className="motion-panel">
      <div className="motion-toolbar">
        <div className="segment" role="tablist" aria-label="Choose workflow animation">
          <button type="button" id="sc-tab-analysis" role="tab" aria-controls="sc-flow-nodes" aria-selected={mode==='analysis'}
            onClick={()=>setWorkflow('analysis')}>Biological analysis</button>
          <button type="button" id="sc-tab-benchmark" role="tab" aria-controls="sc-flow-nodes" aria-selected={mode==='benchmark'}
            onClick={()=>setWorkflow('benchmark')}>Method benchmarking</button>
        </div>
        <button className="pause-btn" type="button" aria-pressed={!playing} onClick={()=>setPlaying(v=>!v)}>
          {playing ? 'Ⅱ Pause animation' : '▶ Play animation'}
        </button>
      </div>
      <div className="flow-nodes" id="sc-flow-nodes" aria-live="off">
        {steps.map(([icon,label,short,description],i)=>(
          <button type="button" key={label} className={'flow-node'+(current===i?' active':'')}
            aria-label={label+': '+description} aria-current={current===i?'step':undefined} onClick={()=>setCurrent(i)}>
            <span className="flow-icon" aria-hidden="true">{icon}</span><strong>{label}</strong><small>{short}</small>
          </button>
        ))}
      </div>
      <div className="motion-detail" aria-live="polite" aria-atomic="true">
        <strong>{selected[2]}</strong><span>{selected[3]}</span>
      </div>
      <p className="tiny-note">Conceptual illustration only; the animation does not represent actual computational output or measured benchmark performance.</p>
    </div>
  );
}

export default function GetStarted() {
  const [copyStatus, setCopyStatus] = useState('Copy');
  const codeRef = useRef(null);

  useEffect(() => {
    if (copyStatus === 'Copy') return undefined;
    const timeoutId = window.setTimeout(() => setCopyStatus('Copy'), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [copyStatus]);

  // The Clipboard API requires HTTPS or localhost in most browsers. Use the
  // legacy synchronous copy command on HTTP deployments, then allow manual
  // selection if neither API is permitted.
  function copyWithFallback(text) {
    const textarea = document.createElement('textarea');
    const previouslyFocused = document.activeElement;
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.setAttribute('aria-hidden', 'true');
    textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;width:1px;height:1px;';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    let succeeded = false;
    try {
      succeeded = document.execCommand('copy');
    } catch {
      succeeded = false;
    } finally {
      textarea.remove();
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus({ preventScroll: true });
      }
    }
    return succeeded;
  }

  function selectCodeForManualCopy() {
    if (!codeRef.current || typeof window.getSelection !== 'function') return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(codeRef.current);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async function copyExample() {
    // Prefer the asynchronous modern API where it is actually available.
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(EXAMPLE_CODE);
        setCopyStatus('Copied!');
        return;
      } catch {
        // Browser denied clipboard permission; try the fallback below.
      }
    }
    if (copyWithFallback(EXAMPLE_CODE)) {
      setCopyStatus('Copied!');
    } else {
      selectCodeForManualCopy();
      setCopyStatus('Press Ctrl+C');
    }
  }
  return (
    <div className="sc-home">
      <main>
        <section className="sc-section hero" id="overview"><div className="sc-container"><div className="sc-section-heading sc-section-heading--center"><span className="kicker">The platform at a glance</span><h2>One environment. Two complementary ways to research.</h2><p className="lead">Create reproducible biological analyses in the browser, or build and evaluate new methods on a shared data foundation.</p></div>
          <div className="two-cards">
            <article className="persona"><div className="persona-icon" aria-hidden="true">✦</div><h3>Discover biological insight.</h3><p>Find or upload datasets, configure tools without writing code, run QC and integration, annotate cells, and investigate results through interactive figures and marker-based review.</p><a className="link-inline" href="mydata/tools" target="_blank" rel="noopener">Explore analysis workflows →</a></article>
            <article className="persona purple"><div className="persona-icon" aria-hidden="true">⌘</div><h3>Develop better methods.</h3><p>Reuse curated inputs, build custom tools, track processing decisions, and compare analytical approaches through reproducible task-specific benchmarks.</p><a className="link-inline" href="benchmarks" target="_blank" rel="noopener">Explore benchmarking →</a></article>
          </div>
          <div className="feature-bar"><div className="feature-mini"><span className="symbol" aria-hidden="true">◈</span><div><strong>Project-centered data</strong><span>Datasets, metadata, processing history, and sharing.</span></div></div><div className="feature-mini"><span className="symbol" aria-hidden="true">↻</span><div><strong>Traceable workflows</strong><span>Reusable steps, parameters, and asynchronous jobs.</span></div></div><div className="feature-mini"><span className="symbol" aria-hidden="true">⊞</span><div><strong>Extensible methods</strong><span>Integrated R/Python tools, APIs, and custom environments.</span></div></div></div>
        </div></section>
        <div className="stats-wrap"><div className="sc-container"><div className="stats"><div className="stat"><strong>74</strong><span>Public datasets</span></div><div className="stat"><strong>1.61M</strong><span>Estimated cells</span></div><div className="stat"><strong>3</strong><span>Species represented</span></div><div className="stat"><strong>45</strong><span>Recorded anatomy categories</span></div></div></div></div>
        <section className="sc-section" id="architecture"><div className="sc-container">
          <div className="sc-section-heading sc-section-heading--center"><span className="kicker">01 / Platform at a glance</span><h2>A connected environment for the entire research journey.</h2><p className="lead">Explore the four architectural layers of single-cell.ai and the iterative path from prepared data to biological discovery.</p></div>
          <div className="fig-grid fig-grid--side-by-side">
            <figure className="fig-wrap"><a className="fig-image-link" href="/images/get-started/platform-architecture-3d.png" target="_blank" rel="noopener noreferrer" aria-label="Open full-size Platform Overview diagram"><img src="/images/get-started/platform-architecture-3d.png" alt="Three-dimensional layered platform architecture: applications, workflow engine, Single-Cell Data Fabric and computational infrastructure" width="1448" height="1086" srcSet="/images/get-started/platform-architecture-3d.png 1x" decoding="async" loading="lazy" /></a><figcaption><strong>Figure 1 · Platform overview.</strong> Browser applications, a reusable workflow engine, project-centered data resources, and containerized computation operate together to support traceable single-cell analyses.</figcaption></figure>
            <figure className="fig-wrap"><a className="fig-image-link" href="/images/get-started/from-data-to-discovery.png" target="_blank" rel="noopener noreferrer" aria-label="Open full-size From Data to Discovery diagram"><img src="/images/get-started/from-data-to-discovery.png" alt="From Data to Discovery: data preparation, method development, model training, evaluation and benchmarking, and biological discovery, with iterative improvement" width="1448" height="1086" loading="lazy" srcSet="/images/get-started/from-data-to-discovery.png 1x" decoding="async" /></a><figcaption><strong>Figure 2 · From Data to Discovery.</strong> Prepared data supports method development and model training, followed by evaluation and biological interpretation. Findings guide iterative refinement.</figcaption></figure>
          </div></div></section>
        <section className="sc-section wash" id="workflow"><div className="sc-container"><div className="sc-section-heading"><span className="kicker">02 / See the platform in motion</span><h2>One continuous path from data to discovery.</h2><p className="lead">Explore an animated, interactive view of common workflows. Select any step to learn what it does, or switch to the benchmarking cycle.</p></div>
          <FlowSection /></div></section>
        <section className="sc-section" id="start"><div className="sc-container"><div className="sc-section-heading sc-section-heading--center"><span className="kicker">03 / Your first analysis</span><h2>Get started in five steps.</h2><p className="lead">Start with a public dataset or your own data, choose an analysis, and review biological evidence before sharing conclusions.</p></div>
          <div className="steps-grid">
            <article className="step"><span className="step-num">STEP 01</span><h3>Select your dataset</h3><p>Browse public projects or upload compatible data and metadata in My Data.</p></article>
            <article className="step"><span className="step-num">STEP 02</span><h3>Choose a workflow</h3><p>Run an individual tool or combine processing stages through Workflows.</p></article>
            <article className="step"><span className="step-num">STEP 03</span><h3>Configure methods</h3><p>Set QC thresholds, batch keys, clustering options, and reference models.</p></article>
            <article className="step"><span className="step-num">STEP 04</span><h3>Monitor your jobs</h3><p>Track execution status and inspect parameters, logs, and errors.</p></article>
            <article className="step"><span className="step-num">STEP 05</span><h3>Explore and share</h3><p>Review UMAP plots, annotation labels, and markers; reuse project results.</p></article>
          </div>
          <div className="code-panel">
            <div className="code-head">
              <span className="code-dots" aria-hidden="true"><i></i><i></i><i></i></span>
              <span className="code-title">Programmatic data access · OSCB Python example</span>
              <button type="button" className="copy-btn" onClick={copyExample} aria-label="Copy Python example to clipboard">
                {copyStatus}
              </button>
            </div>
            <pre className="sc-code-pre" aria-label="Python code example"><code className="sc-code-text" ref={codeRef}><span className="kw">from</span>{' oscb.data '}<span className="kw">import</span>{' DataLoader\n\nadata = DataLoader('}<span className="string">{`"CL-m-FACS_Bladder-1268-Tabula-2018"`}</span>{', data_folder='}<span className="string">{`"./datasets/"`}</span>{')'}</code></pre>
          </div>
        </div></section>
        <section className="sc-section wash" id="resources"><div className="sc-container"><div className="sc-section-heading sc-section-heading--center"><span className="kicker">Keep exploring</span><h2>Find the guide for your next step.</h2><p className="lead">Move from an introductory tour into the full documentation for your workflow.</p></div>
          <div className="guides">
            <a className="guide" href="doc/?doc=data_management" target="_blank" rel="noopener"><span className="guide-icon">◫</span><strong>Data management ↗</strong><small>Find, upload, organize, and share project data.</small></a>
            <a className="guide" href="doc/?doc=tools" target="_blank" rel="noopener"><span className="guide-icon">⚙</span><strong>Analysis tools ↗</strong><small>Run QC, integration, clustering, and annotation tasks.</small></a>
            <a className="guide" href="doc/?doc=workflows" target="_blank" rel="noopener"><span className="guide-icon">↗</span><strong>Workflows ↗</strong><small>Design and run connected analytical stages.</small></a>
            <a className="guide" href="doc/?doc=benchmarks" target="_blank" rel="noopener"><span className="guide-icon">▥</span><strong>Benchmarks ↗</strong><small>Compare methods and review task-specific metrics.</small></a>
            <a className="guide" href="doc/?doc=data_loader" target="_blank" rel="noopener"><span className="guide-icon">{'{'} {'}'}</span><strong>Python API ↗</strong><small>Load benchmark inputs programmatically with OSCB.</small></a>
            <a className="guide" href="doc/?doc=docker_compose" target="_blank" rel="noopener"><span className="guide-icon">▱</span><strong>Deployment ↗</strong><small>Explore documented container-based installation paths.</small></a>
          </div></div></section>
        <section className="bottomband"><div className="sc-container"><span className="kicker">Your next discovery starts here</span><h2>Make every analysis reproducible.</h2><p className="lead">Keep data, methods, parameters, and results connected—from the first experiment to the next benchmark.</p><a className="sc-cta primary" href="mydata" target="_blank" rel="noopener">Start your analysis ↗</a></div></section>

      </main>
    </div>
  );
}
