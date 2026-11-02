# Documentation

**Explore the single-cell.ai ecosystem—from deployment and data analysis to reproducible benchmarking, Python development, and API integration.**

single-cell.ai brings dataset management, analysis tools, automated workflows, benchmark resources, and programmatic interfaces into a unified research environment. This documentation is organized by the work you want to accomplish, whether you are exploring single-cell data in the browser, developing computational methods, or operating your own deployment.

## Find your starting point

| Your goal | Start here | Next step |
| --- | --- | --- |
| Install and operate single-cell.ai | [Docker Compose](doc/?doc=docker_compose) | [Kubernetes](doc/?doc=kubernetes) or [Helm](doc/?doc=helm) |
| Upload and analyze single-cell datasets | [Data Management](doc/?doc=data_management) | [Tools](doc/?doc=tools) and [Workflows](doc/?doc=workflows) |
| Monitor results and troubleshoot runs | [Job Management](doc/?doc=job_management) | [Sample Report](doc/?doc=sample_report) |
| Create or explore benchmark evaluations | [Create New Benchmarks](doc/?doc=create_new_benchmarks) | [Benchmarks](doc/?doc=benchmarks) |
| Evaluate methods from Python | [Installation](doc/?doc=installation) | [Data Loader](doc/?doc=data_loader) and [Evaluators](doc/?doc=evaluators) |
| Integrate the platform into other applications | [FastAPI Endpoints](doc/?doc=fastapi_endpoints) | [Python Packages](#python-packages) |
| Learn with guided examples | [Annotation Workflow](doc/?doc=annotation_workflow) | [Identify outliers](doc/?doc=identify_outliers) and [Refine Annotation](doc/?doc=refine_annotation) |

---

## Deployment

Deploy single-cell.ai in a local or server-based environment, or operate its services on Kubernetes. These guides cover configuration, infrastructure, service orchestration, and operational validation.

| Guide | What you will learn |
| --- | --- |
| **[Docker Compose](doc/?doc=docker_compose)** | Set up the application services, configure environment variables and storage, operate CPU/GPU workers, and troubleshoot a Compose-based installation. |
| **[Kubernetes](doc/?doc=kubernetes)** | Translate the platform services into Kubernetes resources, prepare configuration and Secrets, and deploy and maintain workloads using manifests and Kustomize. |
| **[Helm](doc/?doc=helm)** | Configure, validate, install, and operate the platform using parameterized Helm charts, Kubernetes storage, and release management. |

**Suggested path:** Start with Docker Compose to understand the service architecture. Use the Kubernetes or Helm documentation when you need a cluster-based deployment.

## Analyses

Discover, prepare, and analyze single-cell datasets through the web interface. Individual tools support focused tasks, while workflows combine operations into multi-step analysis pipelines. Jobs run asynchronously so you can monitor their progress and review outputs later.

| Guide | What you will learn |
| --- | --- |
| **[Data Management](doc/?doc=data_management)** | Upload datasets, manage projects and collaborators, control dataset visibility, and inspect metadata and processing history. |
| **[Tools](doc/?doc=tools)** | Select datasets, configure and run individual analysis tasks such as quality control, integration, annotation, and visualization. |
| **[Workflows](doc/?doc=workflows)** | Build and execute combinations of analytical tasks, including clustering, integration, and annotation workflows. |
| **[Job Management](doc/?doc=job_management)** | Track submitted jobs, inspect execution details, review results, and investigate failed analyses. |
| **[Sample Report](doc/?doc=sample_report)** | See a worked comparison of cell-type annotations following different integration methods, including agreement measures, figures, and interpretation limitations. |

**Typical analysis:** [Manage a dataset](doc/?doc=data_management) → [Run a tool](doc/?doc=tools) or [workflow](doc/?doc=workflows) → [Monitor the job](doc/?doc=job_management) → Review and interpret the outputs.

## Benchmarks

Explore public benchmarking datasets, define evaluation tasks, and compare analytical methods under documented configurations. Benchmark results should be interpreted in the context of each task's metrics, input data, and preprocessing choices.

| Guide | What you will learn |
| --- | --- |
| **[Create New Benchmarks](doc/?doc=create_new_benchmarks)** | Upload and describe datasets, perform quality control, configure benchmark tasks, run evaluations, and inspect the resulting metrics. |
| **[Benchmarks](doc/?doc=benchmarks)** | Browse benchmark datasets, review dataset coverage, inspect benchmark details, compare methods, and understand reported performance and resource measurements. |

**Suggested path:** Browse the existing benchmark collection before creating new tasks; use comparable inputs and task definitions when interpreting method differences.

## Python Packages

Use the **Open Single-Cell Benchmarks (OSCB)** Python package to work with benchmark datasets and evaluations programmatically. These guides cover package installation, dataset loading, evaluation, and optional resource monitoring.

| Guide | What you will learn |
| --- | --- |
| **[Installation](doc/?doc=installation)** | Install OSCB and identify the next Python package entry points. |
| **[Data Loader](doc/?doc=data_loader)** | Load a dataset or benchmark-associated dataset with `oscb.data.DataLoader` and inspect the returned object. |
| **[Evaluators](doc/?doc=evaluators)** | Run task-specific evaluation functions, inspect results, and use monitoring or JSON-export utilities where applicable. |

For example, the package installation guide uses:

```bash
python -m pip install oscb
```

## API

Connect external clients, scripts, and applications to single-cell.ai using its HTTP API. The API documentation introduces endpoint structure, request validation, authentication assumptions, and asynchronous job submission.

| Guide | What you will learn |
| --- | --- |
| **[FastAPI Endpoints](doc/?doc=fastapi_endpoints)** | Configure an API base URL, submit analysis requests, handle asynchronous responses, and explore endpoint examples with `curl`, Python, or a client application. |

**Suggested path:** Begin with a quality-control request, then use the returned job information to track execution and retrieve results as documented for the endpoint.

## Tutorials

Learn through guided examples that connect platform features to real single-cell analysis tasks. The tutorials use mouse bone-marrow data to demonstrate practical workflows and interpretation techniques.

| Tutorial | What you will learn |
| --- | --- |
| **[Annotation Workflow](doc/?doc=annotation_workflow)** | Select query and reference datasets, configure quality control and integration, perform cell-type annotation, and inspect analysis outputs. |
| **[Identify outliers](doc/?doc=identify_outliers)** | Use quality-control metrics and visualization to identify and examine candidate outlier cell populations. |
| **[Refine Annotation](doc/?doc=refine_annotation)** | Inspect UMAP and t-SNE embeddings, examine expression and cell composition, and refine cell-type assignments using the visualization tool. |

**Suggested path:** Follow the Annotation Workflow first. The outlier-identification and annotation-refinement tutorials then show how to investigate and improve analytical results.

---

## From your first dataset to reproducible results

A practical end-to-end learning sequence is:

1. **Organize data.** Upload an input dataset and review its metadata in [Data Management](doc/?doc=data_management).
2. **Choose an approach.** Configure an individual [Tool](doc/?doc=tools) or a multi-step [Workflow](doc/?doc=workflows).
3. **Run and inspect.** Submit the analysis and follow progress through [Job Management](doc/?doc=job_management).
4. **Interpret results.** Explore figures and outputs; use the [Sample Report](doc/?doc=sample_report) for an example of comparative interpretation.
5. **Evaluate and extend.** Explore [Benchmarks](doc/?doc=benchmarks), work with the [OSCB Python package](doc/?doc=installation), or integrate through the [FastAPI endpoints](doc/?doc=fastapi_endpoints).

> **Reproducibility tip:** When comparing methods or sharing results, record dataset identifiers, preprocessing decisions, tool versions, analysis parameters, and benchmark metric definitions. Treat automated labels and benchmark scores as evidence to interpret rather than independent biological validation.

---

*Browse the sections above to find the guide that matches your task. Each link opens the corresponding document in the single-cell.ai documentation browser.*
