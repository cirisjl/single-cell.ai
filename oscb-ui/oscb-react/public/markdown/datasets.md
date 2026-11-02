
Use the OSCB `DataLoader` to download public datasets and benchmark-ready objects from [single-cell.ai](https://single-cell.ai/).

## Install OSCB

```bash
python -m pip install oscb
python -c "import oscb; print(oscb.__version__)"
```

See [Installation](doc/?doc=installation) for upgrade and environment guidance.

## Load by dataset ID or benchmark ID

```python
from oscb.data import DataLoader

# A benchmark ID includes the benchmark task and its evaluation metadata.
adata_benchmark = DataLoader(
    benchmarks_id="CL-m-FACS_Bladder-1268-Tabula-2018",
    data_folder="./datasets/",
)

# A dataset ID downloads the associated dataset without choosing a benchmark task.
adata_dataset = DataLoader(
    benchmarks_id="h-PBMC-11989-Adam-2022",
    data_folder="./datasets/",
)
```

The loader returns an `AnnData` or `MuData` object, depending on the dataset, or `None` if it cannot find a matching public entry. The directory must be writable; downloads may be large.

> **Inspect before analysis:** Do not assume `adata.X` contains raw counts or that normalized values are always stored in `adata.layers`. Check the object's `X`, `layers`, `obs`, `var`, `obsm` and, for `MuData`, `mod` before applying methods that require particular data scales.

```python
if adata_benchmark is not None:
    print(type(adata_benchmark).__name__)
    print(adata_benchmark.shape)
```

## Next steps

- [Data Loader API](doc/?doc=data_loader) — parameters, returns, and example output.
- [Evaluators API](doc/?doc=evaluators) — score your results.
- [Benchmarks](doc/?doc=benchmarks) — browse tasks and datasets.
