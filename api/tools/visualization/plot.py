# import dash
# import dash_core_components as dcc
# import dash_html_components as html
# import plotly.graph_objs as go

# import matplotlib.pyplot as plt
# import seaborn as sns

import json 
import pandas as pd
import numpy as np
from anndata import AnnData
from scipy.sparse import csr_matrix
from tools.visualization.plotConstants import *


def plot_UMAP_obs(obs, umap, layer=None, clustering_plot_type="leiden", selected_cell_intersection=None, annotation=None, n_dim=2, plot_name='UMAP'): # clustering_plot_type: 'cluster.ids', 'leiden', 'louvain', 'seurat_clusters'
    cluster_id_exists = True

    # Validate if the clustering id exists. If not, find a default one.
    if clustering_plot_type not in obs.keys():
        cluster_id_exists = False
        for cluster_id in ['cell_type', 'cell_ontology_class', 'CellType', 'celltype', 'label', 'labels', "cluster.ids", "leiden", layer+'_leiden', "louvain", layer+'_louvain', "seurat_clusters"]:
            if cluster_id in obs.keys():
                clustering_plot_type = cluster_id
                cluster_id_exists = True
                break
                
    if not cluster_id_exists:
        clustering_plot_type = obs.keys()[0]
        # raise ValueError(f"{clustering_plot_type} does not exist in {obs.keys()}.")

    # Validate that there is a 3D projection available if that was requested
    coords = pd.DataFrame(umap, index=obs.index)
    
    traces = []
    for i, val in enumerate(sorted(obs[clustering_plot_type].unique())):
        a = obs[obs[clustering_plot_type] == val]
        b = coords[obs[clustering_plot_type] == val]
        s = []
        if (selected_cell_intersection in [None, [], ""]):
            s = list(range(len(a.index)))
        else:
            for c in selected_cell_intersection:
                if (c in a.index):
                    s.append(a.index.get_loc(c))
        text = None
        if annotation is not None and annotation in obs.keys():
            text = [str(cell) for cell in a[annotation].astype(str)]
        else:
            text = ["Cell ID: " + str(cell_id) for cell_id in a.index.astype(str)]
        if (n_dim == 2):
            traces.append({
                "type": "scattergl",
                "x": b[0].tolist(),
                "y": b[1].tolist(),
                "text": text,
                "selectedpoints": s,
                "mode":'markers',
                "marker": {
                    'size': point_size_2d,
                    'line': {'width': point_line_width_2d, 'color': 'grey'},
                    "color": discrete_colors_3[i % len(discrete_colors_3)]
                },
                "unselected": {
                    "marker": {"opacity": min_opacity}
                },
                "selected": {
                    "marker": {"opacity": max_opacity}
                },
                "name": f"{val}"
            })
        elif (n_dim == 3):
            traces.append({
                "type": "scatter3d",
                "x": b[0].tolist(),
                "y": b[1].tolist(),
                "z": b[2].tolist(),
                "text": text,
                "selectedpoints": s,
                "mode":'markers',
                "marker": {
                    'size': point_size_3d,
                    'line': {'width': point_line_width_3d, 'color': 'grey'},
                    "color": discrete_colors_3[i % len(discrete_colors_3)]
                },
                "name": f"Cluster {val}"
            })
    if (n_dim == 2):
        if plot_name == 'UMAP':
            xaxis = {"title": "UMAP 1"}
            yaxis = {"title": "UMAP 2"}
        else:
            xaxis = {"title": "t-SNE 1"}
            yaxis = {"title": "t-SNE 2"}

        return json.dumps({
            'data': traces,
            'layout': dict(
                xaxis=xaxis,
                yaxis=yaxis,
                margin=margin,
                # legend={'x': 0, 'y': 1},
                hovermode='closest',
                transition = {'duration': 250},
                autosize=True,
                width=4*scale,
                height=3*scale
            )
        })
    elif (n_dim == 3):
        if plot_name == 'UMAP':
            xaxis = {"title": "UMAP 1"}
            yaxis = {"title": "UMAP 2"}
            zaxis = {"title": "UMAP 3"}
        else:
            xaxis = {"title": "t-SNE 1"}
            yaxis = {"title": "t-SNE 2"}
            zaxis = {"title": "t-SNE 3"}
        return json.dumps({
            'data': traces,
            'layout': dict(
                xaxis=xaxis,
                yaxis=yaxis,
                zaxis=zaxis,
                margin=margin,
                # legend={'x': 0, 'y': 1},
                hovermode='closest',
                transition = {'duration': 250},
                autosize=True,
                width=4*scale,
                height=3*scale
            )
        })


def plot_UMAP(adata, layer=None, clustering_plot_type="leiden", selected_cell_intersection=None, annotation=None, n_dim=2): # clustering_plot_type: 'cluster.ids', 'leiden', 'louvain', 'seurat_clusters'
    print("[DEBUG] generating new UMAP plot")
    
    obs = adata.obs
    obsm = adata.obsm
    umap = None
    if layer is None: layer = 'X'

    # Validate that there is a 3D projection available if that was requested
    if ((layer+"_umap_3D" in obsm.keys()) and (n_dim == 3)):
        umap = obsm[layer+"_umap_3D"]
        print("Ploting 3D UMAP...")
    else:
        n_dim = 2
        umap = obsm[layer+"_umap"]
        print("Ploting 2D UMAP...")

    results = plot_UMAP_obs(obs=obs, umap=umap, clustering_plot_type=clustering_plot_type, selected_cell_intersection=selected_cell_intersection, annotation=annotation, n_dim=n_dim)
    return results


def plot_violin(obs, features=['n_counts', 'n_genes', 'pct_counts_mt', 'pct_counts_rb'], show_points=False):
    traces = []
    
    x_pos  = 1

    # n_traces = len(features)
    
    for i in features:
        if not i in obs.columns:
            print("[DEBUG] feature " + str(i) + " not in obs columns; skipping")
            continue
        if (show_points == False):
            traces.append({
                "type": "violin",
                "y": obs[i].tolist(), 
                # "text": ["Cell ID: " + str(cell_id) for cell_id in obs.index.astype(str)],
                "opacity": 0.7,
                "box": {
                    "visible": True
                },
                "meanline": {
                    "visible": True
                },
                "points": "none",
                "name": str(i)
            })
            x_pos += 1
        
        elif (show_points == "all"):
            #kernel = gaussian_kde(adata.obs_vector(i))
            jittered_x = x_pos + 0.1 * np.random.standard_normal(len(obs[i]))

            traces.append({
                "type": "violin",
                "x": jittered_x.tolist(),
                "y": obs[i].tolist(), 
                # "text": ["Cell ID: " + str(cell_id) for cell_id in obs.index.astype(str)],
                "mode": "markers",
                "opacity": 0.7,
                "marker": {
                    'size': point_size_2d
                },
                "name": str(i)
            })
            x_pos += 1

    if (traces in [[], None, ""]):
        print("[DEBUG] no traces added to violin plot")

    return json.dumps({
        'data': traces,
        'layout': dict(
            # xaxis={"title": "Selected metadata features"},
            # yaxis={"title": "value"},
            margin=margin,
            # legend={'x': 0, 'y': 1},
            hovermode='closest',
            transition = {'duration': 100},
            autosize=True,
            width=4*scale,
            height=3*scale
        )
    })


def plot_scatter(obs, feature1 = "n_counts", feature2 = "n_genes"):
    traces = []

    if feature1 in obs.columns and feature2 in obs.columns:
        traces.append({
                "type": "scatter",
                "x": obs[feature1].tolist(), 
                "y": obs[feature2].tolist(), 
                # "text": ["Cell ID: " + str(cell_id) for cell_id in obs.index.astype(str)],
                "mode":'markers',
                "marker": {
                    'size': point_size_2d,
                    'line': {'width': point_line_width_2d, 'color': 'grey'}
                }
            })  
    else:
        print("[DEBUG] " + feature1 + " or " + feature2 + " is not in adata.obs.columns")

    return json.dumps({
        'data': traces,
        'layout': dict(
            xaxis={"title": feature1},
            yaxis={"title": feature2},
            margin=margin,
            # legend={'x': 0, 'y': 1},
            hovermode='closest',
            transition = {'duration': 100},
            autosize=True,
            width=4*scale,
            height=3*scale
        )
    })


def highest_expr_genes(adata, n_top=30):
    import scanpy as sc
    from scipy.sparse import issparse

    if type(adata.X) != np.ndarray:
        adata.X = adata.X.todense()
    # compute the percentage of each gene per cell
    norm_dict = sc.pp.normalize_total(adata, target_sum=100, inplace=False)

    # identify the genes with the highest mean
    if issparse(norm_dict["X"]):
        mean_percent = norm_dict["X"].mean(axis=0).A1
        top_idx = np.argsort(mean_percent)[::-1][:n_top]
        counts_top_genes = norm_dict["X"][:, top_idx].A
    else:
        mean_percent = norm_dict["X"].mean(axis=0)
        top_idx = np.argsort(mean_percent)[::-1][:n_top]
        counts_top_genes = norm_dict["X"][:, top_idx]
    columns = adata.var_names[top_idx].to_list()

    return counts_top_genes, columns


def plot_highest_expr_genes(counts_top_genes, columns):
    # counts_top_genes = pd.DataFrame(
    #     counts_top_genes, index=adata.obs_names, columns=columns
    # )
    counts_top_genes = pd.DataFrame(
        counts_top_genes, columns=columns
    )

    y = counts_top_genes.columns.tolist()

    traces = []

    for i in reversed(y):
        traces.append({
                "type": "box",
                "x": counts_top_genes[i].tolist(), 
                "y": i, 
                "boxpoints": "Wiskers and Outliers",
                # "jitter": 0.5,
                # "whiskerwidth": 0.2,
                "marker": {
                    "size": 2,
                    "line": {"width": 1, "color": 'grey'}
                },
                "name": str(i)
            })  

    return json.dumps({
        'data': traces,
        'layout': dict(
            title='% of total counts',
            xaxis={
                "autorange": True,
                "showgrid": True,
                "zeroline": True,
                "gridcolor": 'grey',
                "gridwidth": 1,
                "zerolinecolor": 'grey',
                "zerolinewidth": 2
            },
            margin=margin,
            # legend={'x': 0, 'y': 1},
            # hovermode='closest',
            transition = {'duration': 100},
            autosize=True,
            showlegend=False,
            width=4*scale,
            height=3*scale
        )
    })


def plot_table(dataframe, n_top=5):
    traces = []
    cell_values = []
    row_color = []
    cells_align = []
    column_width = []
    table_width = 4*scale
    rowOddColor = "white"
    rowEvenColor = "#e3eaf8"

    if isinstance(dataframe, pd.DataFrame):
        if len(dataframe) > n_top:
            dataframe = dataframe[:n_top]

        n_col = dataframe.shape[1]
        n_row = dataframe.shape[0]
        header_values = ["<b>"+str(header)+"</b>" for header in dataframe.columns.tolist()]
        header_values.insert(0,'')
        cell_values.append(["<b>"+str(idx)+"</b>" for idx in dataframe.index.tolist()])
        cells_align.append("center")
        column_width.append(len(max(cell_values[0]))*8)

        for i in range(0, n_col):
            cell_values.append(dataframe.iloc[:, i].tolist())
            cells_align.append("right")
            column_width.append(len(header_values[i+1])*6)

        for i in range(n_row):
            if (i % 2) == 0:
                row_color.append(rowEvenColor)
            else:
                row_color.append(rowOddColor)
        row_color = [row_color]
        table_width = sum(column_width)

        print(cells_align)
        print(row_color)
        print(column_width)

        traces.append({
                "type": "table",
                "columnwidth": column_width,
                "header": {
                    "values": header_values,
                    "align": "center",
                    "line": {"width": 0},
                    "fill": {"color": ['#2b2d41']},
                    "font": {"color": "white"}
                    },
                "cells": {
                    "values": cell_values,
                    "align": cells_align,
                    "line": {"width":0},
                    "fill": {"color": row_color}
                    # "font": {"family": "Arial", "size": 9, "color": ["black"]}
                    }
            })
    else:
        print("[DEBUG] plot_table only takes Pandas DataFrame, no traces added to table")

    return json.dumps({
        'data': traces,
        'layout': dict(
            margin=margin,
            hovermode='closest',
            transition = {'duration': 100},
            autosize=True,
            showlegend=False,
            width=table_width
            )
        })


def get_line_style(key):
    style = 'dot'
    if 'CPU' in key:
        style = 'solid'
    elif 'GPU' in key:
        style = 'dashdot'
    return style


def plot_line(x=[], y={}, sysinfo={}):
    x = [n for n in range(len(x))]
    traces = []

    if len(y) > 0:
        for key, value in y.items():
            if sum(value) == 0:
                continue

            line_style = get_line_style(key)

            traces.append({
                "type": "scatter",
                "x": x,
                "y": value,
                "name": key,
                "mode": 'lines+markers',
                "line": {
                    "dash": line_style # 'solid' if 'CPU' in key else 'dot'
                },
                "marker": {
                    'size': point_size_2d
                },
                "connectgaps": True
            })
    else:
        print("[DEBUG] No data is found in y.")

    if not traces:
        print("[DEBUG] no traces added to line plot")

    if len(sysinfo) == 0:
        return {
            'data': [trace for trace in traces],
            'layout': {
                'title': 'Computing Assessments',
                'xaxis': {"title": 'Time points (s)'},
                'yaxis': {"title": 'Utilization (%)'},
                'margin': margin,
                'hovermode': 'closest',
                'transition': {'duration': 100},
                'autosize': True,
                'width': 4 * scale,
                'height': 3 * scale
            }
        }
    else:
        if 'GPU' in sysinfo.keys():
            annotation = f"CPU: {sysinfo['CPU']}<br>RAM: {sysinfo['RAM']}<br>GPU: {sysinfo['GPU']}"
        else:
            annotation = f"CPU: {sysinfo['CPU']}<br>RAM: {sysinfo['RAM']}"
        return {
            'data': [trace for trace in traces],
            'layout': {
                'title': 'Computing Assessments',
                'xaxis': {"title": 'Time points (s)'},
                'yaxis': {"title": 'Utilization (%)'},
                'margin': margin,
                'hovermode': 'closest',
                'transition': {'duration': 100},
                'autosize': True,
                'width': 4 * scale,
                'height': 3 * scale,
                'annotations': [             
                    {
                        'xref': 'paper',
                        'yref': 'paper',
                        # 'x': 0.5,
                        # 'y': -0.03,
                        'xanchor': 'center',
                        'yanchor': 'top',
                        'text': annotation,
                        'showarrow': False,
                        'font': {
                            'family': 'Arial',
                            'size': 12,
                            'color': 'rgb(150,150,150)'
                        }
                    }
                ]
            }
        }


def plot_bar(x=[], y={}, title="Benchmarks"):
    traces = []

    if len(x) > 0 and len(y) > 0:
        for key, value in y.items():
            # Remove method with a sum of 0 score
            if sum(value) == 0:
                continue

            # # Remove metrics with 0 score
            # for i in range(len(value)):
            #     if value[i] == 0:
            #         x.pop(i)
            #         value.pop(i)

            traces.append({
                "type": "bar",
                "x": x,
                "y": value,
                "text": value,
                "textposition": 'auto',
                "name": key,
                "marker": {
                    "opacity": 0.5
                }
            })
    else:
        print("[DEBUG] No data is found in x or y.")

    if not traces:
        print("[DEBUG] no traces added to bar plot")

    return {
        'data': [trace for trace in traces],
        'layout': {
            'title': title,
            'xaxis': {"tickangle": -45 if len(y) > 1 else 0},
            'margin': margin,
            'barmode': 'group',
            'hovermode': 'closest',
            'transition': {'duration': 100},
            'autosize': True,
            'width': 4*scale,
            'height': 3*scale
        }
    }
