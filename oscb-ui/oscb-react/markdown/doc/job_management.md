# Job Management

<hr/>

## My Jobs

We implemented an asynchronous job management system. After submitting a job, it is queued and executed in the backend.

You can monitor status, view results, or delete jobs on the **“My Jobs”** page.

The top **5 jobs** are displayed in the **right sidebar**.

<div align="center">
<img src="/images/doc/my_jobs.png" width="80%">
</div>

> [!TIP]  
> Click the **column headers** to apply **filters** or **sort** the table. 

<hr/>

## Job Details

The “Job Details” page provides dataset information, job execution details, live logs, task results, interactive plots, and error reporting tools.

We provide 2D/3D UMAP and t-SNE plots.

The system automatically captures error information and lets users choose whether to report it, since many errors are data-related rather than code-related. Reported errors are sent to GitHub Issues for tracking.

<div align="center">
<img src="/images/doc/job_details.png" width="80%">
</div>

<hr/>

## Workflow Details

A workflow consists of multiple jobs, and its results include outputs from each process. Click a process to expand and view detailed results.

<div align="center">
<img src="/images/doc/workflow_details.png" width="80%">
</div>