# Install Open Single-Cell Benchmarks (OSCB)

OSCB provides Python data loaders, evaluation metrics, and optional resource monitoring for single-cell benchmark tasks.

## Install

Use a Python environment in which you have permission to install packages:

```bash
python -m pip install oscb
```

Check that the module can be imported and report its installed version:

```bash
python -c "import oscb; print(oscb.__version__)"
```

Upgrade an existing installation when needed:

```bash
python -m pip install --upgrade oscb
```

> **Tip:** Use an isolated environment to avoid conflicts with scientific Python libraries. Some benchmarks may require additional task-specific packages or substantial memory, disk, or GPU resources.

## Continue

- [Load a dataset](doc/?doc=data_loader)
- [Evaluate predictions](doc/?doc=evaluators)
- [Browse benchmark tasks](doc/?doc=benchmarks)
