import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import scanpy as sc
import pandas as pd
from scib.preprocessing import get_cell_cycle_genes


server_endpoint = "https://single-cell.ai/api/"


def get_dataset_id(benchmarks_id):
    task = None
    dataset_id = None
    if benchmarks_id.startswith("CL-"):
        dataset_id = benchmarks_id.removeprefix("CL-")
        task = "Clustering"
    elif benchmarks_id.startswith("IM-"):
        dataset_id = benchmarks_id.removeprefix("IM-")
        task = "Imputation"
    elif benchmarks_id.startswith("BI-"):
        dataset_id = benchmarks_id.removeprefix("BI-")
        task = "Batch Integration"
    elif benchmarks_id.startswith("TJ-"):
        dataset_id = benchmarks_id.removeprefix("TJ-")
        task = "Trajectory"
    elif benchmarks_id.startswith("CCC-"):
        dataset_id = benchmarks_id.removeprefix("CCC-")
        task = "Cell-Cell Communication"
    elif benchmarks_id.startswith("MI-"):
        dataset_id = benchmarks_id.removeprefix("MI-")
        task = "Multimodal Data Integration"
    elif benchmarks_id.startswith("CT-"):
        dataset_id = benchmarks_id.removeprefix("CT-")
        task = "Cell Type Annotation"
    else:
        dataset_id = benchmarks_id

    return dataset_id, task


def get_bar_plot_data(benchmark_data, user_results=None):
    labels = benchmark_data[0]['x']
    y_labels = []
    data = []
    y_user = []
    
    # Add Benchmark data
    for i in range(len(benchmark_data)):
        data.append(benchmark_data[i]['y'])
        y_labels.append(benchmark_data[i]['name'])
    
    # Add user results
    if user_results is not None:    
        y_labels.append(user_results['tool'])
        for label in labels:
            y_user.append(user_results[label])
        data.append(y_user)

    return labels, y_labels, data


def plot_bars(task, labels, y_labels, data, tick_step=1, group_gap=0.2, bar_gap=0, rotation=0):
    x = np.arange(len(labels)) * tick_step
    group_num = len(data)
    group_width = tick_step - group_gap
    bar_span = group_width / group_num
    bar_width = bar_span - bar_gap
    for index, y in enumerate(data):
        plt.bar(x + index*bar_span, y, bar_width, label=y_labels[index])
    plt.ylabel('Scores')
    plt.title(f'Benchmarks for {task}')
    ticks = x + (group_width - bar_span) / 2
    plt.xticks(ticks, labels, rotation=rotation)
    plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left', borderaxespad=0.)
    plt.show()


def plot_lines(results):
    x = results['time_points']
    x = [n for n in range(len(x))]
    data = []
    y_labels = []
    labels = ["CPU", "Memory", "GPU", "GPU Memory"]

    for label in labels:
        if sum(results[label]) != 0:
            data.append(results[label])
            y_labels.append(label)
    
    for i in range(len(data)):
        if len(x) == len(data[i]):
            if 'GPU' in y_labels[i]:
                plt.plot(x, data[i], label=y_labels[i], marker='o', linestyle='--') # '--' sets a dashed line style
            else:    
                plt.plot(x, data[i], label=y_labels[i], marker='o') # 'o' adds circular markers

    # Adding labels, title, and legend for clarity
    plt.xlabel('Time Points (s)')
    plt.ylabel('Utilization (%)')
    plt.title('Computing Assessments')
    plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left', borderaxespad=0.) # Displays the labels for each line

    # Displaying the plot
    plt.show()


def has_cell_cyle_genes(adata: sc.AnnData, df: pd.DataFrame, columns: list = None):
    if columns is None:
        columns = ["gene_name", "gene_id"]
    elif isinstance(columns, str):
        columns = [columns]

    n_genes = 0
    for col in columns:
        _genes = [g for g in df[col] if g in adata.var_names]
        if len(_genes) > n_genes:  # pick largest overlapping set
            n_genes = len(_genes)
            genes = _genes

    if n_genes == 0:
        # pick random genes for error message
        rand_genes = np.random.choice(adata.var_names, 10)
        return False
    return True