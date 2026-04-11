from rpy2.robjects.packages import importr
from .constants import USER_STORAGE_PATH, DATASETS_API
import rpy2.robjects as ro
import dash
from dash import html, dcc, ctx
from rpy2.robjects import pandas2ri
import scanpy as sc
from dash.dependencies import Input, Output, State
from dash import dash_table
import pandas as pd
import numpy as np
import traceback
from dash.exceptions import PreventUpdate
import requests
import logging
import pymongo
import dash_bootstrap_components as dbc
from dash_bootstrap_templates import load_figure_template
from urllib.parse import parse_qs
import os

from tools.formating.formating import load_anndata, load_invalid_adata, read_text
from .utils.util import is_valid_query_param, create_dataframe

# pandas2ri.activate()
import os

# Get the directory of the current file
current_file_dir = os.path.dirname(os.path.abspath(__file__))

# Define the path to the R script file relative to the current file's directory
r_source_path = os.path.join(current_file_dir, '..', 'tools', 'formating', 'formating.R')

# Load the R script file
with open(r_source_path, 'r') as r_source_file:
    r_source = r_source_file.read()

# Evaluate the R script in the R environment
ro.r(r_source)

# Access the loaded R functions
load_expression_matrix = ro.globalenv['LoadExpressionMatrix']
load_seurat = ro.globalenv['LoadSeurat']
detect_delim = ro.globalenv['DetectDelim']
# load_metadata = ro.globalenv['LoadMetadata']

load_figure_template('LUX')

mongo_url = os.getenv("MONGO_URL", "mongodb://oscbdb:65530")

# Connect to MongoDB using the URL
client = pymongo.MongoClient(mongo_url)

# Access your database and collection
db = client["oscb"]
metadata_collection = db["metadata_of_datasets"]

# Initialize the Flask application
app = dash.Dash(__name__, requests_pathname_prefix='/dashboard/',  external_stylesheets=[dbc.themes.LUX])
dash.register_page(__name__)

# Initialize the variables
datasets = []
datasetMap = {}
default_title = None
annData = None

def getannData():
    return annData

def setAnnData(adata):
    global annData 
    annData = adata

# Function to parse h5ad files and extract metadata from all groups
def parse_h5ad(adata, file_path):
    # adata = sc.read_h5ad(file_path)
    metadata = {
        "file_name": os.path.basename(file_path),
        "file_type": "h5ad",
        "layers_keys": list(adata.layers.keys()),
        "obs_keys": list(adata.obs.keys()),
        "obsm_keys": list(adata.obsm.keys()),
        "obsp_keys": list(adata.obsp.keys()),
        "uns_keys": list(adata.uns.keys()),
        "var_keys": list(adata.var.keys()),
        "varm_keys": list(adata.varm.keys()),
        "varp_keys": list(adata.varp.keys()),
        # Store the complete obs and var data as dictionaries
        # "obs_data": dict(adata.obs.to_dict(orient="list")),
        # "var_data": dict(adata.var.to_dict(orient="list")),
        # Add more metadata fields as needed
    }
    metadata_collection.insert_one(metadata)

SIDEBAR_STYLE = {
    "position": "fixed",
    "top": 0,
    "left": 0,
    "bottom": 0,
    "width": "24rem",
    "padding": "2rem 1rem",
    "background-color": "#f8f9fa",
}


sidebar = html.Div(
    [
        html.H2("Filters"),
        html.Hr(),
        html.P(
            "Select a dataset", className="lead"
        ),
        dbc.Nav(
            [
            dcc.Dropdown(
                id="dataset-dropdown",
                options=[{"label": dataset, "value": dataset} for dataset in datasets],
                placeholder="Select a dataset",
                value=None,
                style={"margin-bottom": "20px"}
            ),
            ],
            vertical=True,
            pills=True,
        ),
    ],
    style=SIDEBAR_STYLE,
)

def layout(authToken=None, username= None, title=None, **other_unknown_query_strings):
    return  html.Div (children = [
                dbc.Row([
                    dbc.Col(),

                    dbc.Col(html.H1('Dataset Exploration Dashboard'),width = 9, style = {'margin-left':'7px','margin-top':'17px', 'padding-left': '3rem'})
                    ]),
                dbc.Row(
                    [dbc.Col(sidebar),
                    dbc.Col(html.Div(
        className="main-container",
        children=[
            dcc.Input(id='authToken-container', type='hidden', value=authToken),
            dcc.Location(id='url', refresh=False),  # Add the Location component
            dcc.Input(id='username-container', type='hidden',value=username),
            dcc.Input(id='title-container', type='hidden',  value=title),
            html.Div(
                [
                    html.P("Would you like to replace invalid values with NaN?"),
                    dcc.RadioItems(
                        id="replace-nan-radio",
                        options=[
                            {"label": "Yes", "value": "yes"},
                            {"label": "No", "value": "no"},
                        ],
                        value="yes",
                    ),
                    html.Button(
                        "Continue",
                        id="continue-button",
                        className="continue-button",
                        n_clicks=0,
                        style={"margin-top": "10px"}
                    ),

                ],
                id="element-to-hide",
                style={'display': 'none', 'background-color': '#f8f9fa','border': '1px solid transparent', 'border-radius': '4px', 'padding': '20px'}  # Hide the container div initially
            ),
            dcc.Loading(id="loading", type="circle", children=[
                html.Div(id="file-info"),
                html.Div(id="dataset-content"),
                html.Div(id="updated-dataset-container"),
                html.Div(id="rowsncolumns-container"),
            ]),

            html.Div(
                className="input-container",
                children=[
                    html.Button(
                        "Edit Dataset",
                        id="edit-button",
                        className="edit-button"
                    ),
                    html.Div(id="edit-status", className="edit-status"),
                ],
                id="edit-button-container",
                style={"display": "none"},
            ),
            dcc.Store(id='adata-storage'),
            dcc.Store(id='updated-adata-storage'),
        ]
    ), width = 9)
                    ])
                ]
            )

# Callback to update layout based on query parameters
@app.callback(
    Output('authToken-container', 'value'),
    Output('username-container', 'value'),
    Output('title-container', 'value'),
    Input('url', 'search')
)
def update_layout(search):
    # Parse query parameters from the URL
    query_parameters = parse_qs(search)

    print(query_parameters)
    # Extract individual query parameters
    authToken = query_parameters.get('?authToken', [''])[0]
    username = query_parameters.get('username', [''])[0]
    title = query_parameters.get('title', [''])[0]

    return authToken, username, title

app.layout = layout


def get_dataset_options(authToken, username, title):
    params = {'authToken': authToken}
    # Initialize the variables
    datasets.clear()
    datasetMap.clear()

    # Make the API call and fetch the dataset options from your API
    response = requests.get(DATASETS_API, params=params)

    if response.status_code == 200:
        # Loop through the datasets in the JSON response
        for dataset_id, dataset_info in response.json().items():
            title = dataset_info['title']
            datasets.append(title)

            # Check if there are multiple files for the dataset
            if len(dataset_info['files']) > 1:
                # Get the parent directory of the first file (assuming all files are in the same parent directory)
                path = os.path.dirname(dataset_info['files'][0]['file_loc'])
            else:
                # Use the file location as the path
                path = dataset_info['files'][0]['file_loc']

            user_directory = USER_STORAGE_PATH + "/" + username
            datasetMap[title] = user_directory + path
        return [{'label': option, 'value': option} for option in datasets]
        
    # else:
    #     # Handle the case when the API call fails
    #     return []



@app.callback(
    Output('dataset-dropdown', 'options'),
    Output('dataset-dropdown', 'value'),
    Input('authToken-container', 'value'),
    State('username-container', 'value'), 
    State('title-container', 'value'), 
)
def update_dataset_dropdown(authToken, username, title):
    if authToken is not None:
        dataset_options = get_dataset_options(authToken, username, title)
        updated_default_value = title if title in datasets else None
        return dataset_options, updated_default_value
    else:
        # For other pages, no need to update the dropdown
        return dash.no_update


@app.callback(
    Output("file-info", "children", allow_duplicate=True),
    Output("dataset-content", "children", allow_duplicate=True),
    Output(component_id='element-to-hide', component_property='style'),
    Output("adata-storage", "data", allow_duplicate=True),
    Output(component_id='edit-button-container', component_property='style', allow_duplicate=True),
    Output("rowsncolumns-container", "children", allow_duplicate=True),
    Input("continue-button", "n_clicks"),
    Input("dataset-dropdown", "value"),
    State("replace-nan-radio", "value"),
    prevent_initial_call=True
)
def handle_continue_button(n_clicks, dataset, replace_nan):
    if dataset is not None:
        triggered_id = ctx.triggered_id
        print(triggered_id)
        if triggered_id == 'continue-button':
            if n_clicks > 0:
                if replace_nan == "yes":
                    # Update the dataset by replacing invalid values with NaN
                    file_path = datasetMap[dataset]
                    try:
                        file_name = file_path.split("/")
                        if len(file_name) > 1:
                            fileparts = file_name[len(file_name)-1].split(".")
                            if fileparts:  # Check if fileparts is not empty
                                filename = fileparts[0] + "_user_corrected.h5ad"
                                updated_filename = os.path.join(os.path.dirname(file_path), filename)
                                if os.path.exists(updated_filename):
                                    file_path = updated_filename

                        adata = load_anndata(file_path, replace_invalid=True, isDashboard = True)
                        invalidadata = load_invalid_adata(file_path, replace_nan)
                    except Exception as error:
                        traceback.print_exc()  # Print the traceback to the console
                        error_message = html.Div(
                            "An error occurred: {}".format(str(error)),
                            style={"color": "red", "padding-top": "1rem"}
                        )
                        return None, [error_message], {'display': 'none'}, None, {'display': 'none'}, None
                elif replace_nan == "no":
                    # Update the dataset by replacing invalid values with NaN
                    file_path = datasetMap[dataset]
                    try:
                        adata = read_text(file_path)
                        invalidadata = load_invalid_adata(file_path, replace_nan)
                    except Exception as error:
                        traceback.print_exc()  # Print the traceback to the console
                        error_message = html.Div(
                            "An error occurred: {}".format(str(error)),
                            style={"color": "red", "padding-top": "1rem"}
                        )
                        return None, [error_message], {'display': 'none'}, None, {'display': 'none'}, None
        elif triggered_id == 'dataset-dropdown':
            # Read h5ad file and extract relevant information
            print(dataset)
            file_path = datasetMap[dataset]
            suffix = None
            if not os.path.isdir(file_path):
                suffix = file_path.split(".")[1]
            ro.globalenv["file_path"] = file_path

            try:
                file_name = file_path.split("/")
                if len(file_name) > 1:
                    fileparts = file_name[len(file_name)-1].split(".")
                    if fileparts:  # Check if fileparts is not empty
                        filename = fileparts[0] + "_user_corrected.h5ad"
                        updated_filename = os.path.join(os.path.dirname(file_path), filename)
                        if os.path.exists(updated_filename):
                            file_path = updated_filename

                adata = load_anndata(file_path, isDashboard = True)
                invalidadata = None
            except Exception as error:
                traceback.print_exc()  # Print the traceback to the console
                error_message = html.Div(
                    "An error occurred: {}".format(str(error)),
                    style={"color": "red", "padding-top": "1rem"}
                )
                return None, [error_message], {'display': 'block'}, None, {'display': 'none'}, None

        try:
            dataset_info = f"Dataset Name: {dataset}"
            action_button = None
            if triggered_id == 'continue-button':
                action_button = {'display': 'none'}
                update_button = html.Div(
                    className="input-container",
                    children=[
                        html.Button(
                            "Update Dataset",
                            id="update-button",
                            className="update-button"
                        ),
                        html.Div(id="update-status", className="update-status"),
                        html.A(
                            "Download Dataset",
                            id="download-link",
                            href="",
                            download="updated_dataset.h5ad",
                            target="_blank"
                        )
                    ],
                )
            else:
                action_button = {'display': 'block'}
                update_button = None
            # Extract metadata and subset of gene expression matrix
            metadata = {
                "Number of Cells": adata.n_obs,
                "Number of Genes": adata.n_vars,
                # "Cell Types": adata.obs["cell_type"].unique().tolist(),
                # Add more metadata as needed
            }
            subset_genes = adata.var_names[:10]
            if invalidadata is not None:
                invalid_subset_genes = invalidadata.var_names[:10]  # Select the first 10 genes
                invalid_subset_matrix = invalidadata.X[:10, :]  # Convert to dense matrix
                expression_invalid_table = html.Div(
                    [
                        html.H3("Invalid Subset of Gene Expression Matrix (Table):", style={"margin-top": "20px"}),
                        dash_table.DataTable(
                            id="gene-expression-table",
                            columns=[{"name": "", "id": "Cells"}] + [{"name": gene, "id": gene} for gene in
                                                                     invalid_subset_genes],
                            data=[
                                {"Cells": cell, **{gene: value for gene, value in zip(invalid_subset_genes, row)}}
                                for cell, row in zip(invalidadata.obs_names[:10], invalid_subset_matrix)
                            ],
                            style_table={"overflow": "auto", "padding": "10px",
                                         "textAlign": "center"},
                            style_header={"fontWeight": "bold", "word-break": "break-word"},
                            style_cell={
                                'padding': '10px',
                                'whiteSpace': 'normal',
                                'height': 'auto',
                                'textAlign': 'center',
                                 'minWidth': 95, 
                                # 'maxWidth': 200, 
                                'width': 95 # Center-align the text in the cells
                            },
                            fixed_rows={"headers": True, "data": 0}
                        )
                    ],
                    id="invalid-expression-matrix",
                )

                # Create checkboxes for rows and columns
                row_checkboxes = html.Div(
                    [
                        html.H3("Select Rows to Remove:", style={"margin-top": "20px"}),
                        dcc.Checklist(
                            id="row-checklist",
                            options=[{"label": cell, "value": cell} for cell in invalidadata.obs_names[:10]],
                            value=[],
                            className="checklist"
                        )
                    ],
                    id="row-checkboxes",
                )

                column_checkboxes = html.Div(
                    [
                        html.H3("Select Columns to Remove:", style={"margin-top": "20px"}),
                        dcc.Checklist(
                            id="column-checklist",
                            options=[{"label": gene, "value": gene} for gene in invalid_subset_genes],
                            value=[],
                            className="checklist"
                        )
                    ],
                    id="column-checkboxes",
                )

            else:
                expression_invalid_table = None
                row_checkboxes = None
                column_checkboxes = None

            data_matrix = adata.X
            print(isinstance(data_matrix, np.ndarray))
            if not isinstance(data_matrix, np.ndarray):
                data_matrix = data_matrix.toarray()
                subset_matrix = data_matrix[:10, :]
            else:
                subset_matrix = adata.X[:10, :]

            # Create a component to display the subset of gene expression matrix as a table
            expression_table = dash_table.DataTable(
                id="gene-expression-table",
                columns=[{"name": "", "id": "Cells"}] + [{"name": gene, "id": gene} for gene in subset_genes],
                data=[
                    {"Cells": cell, **{gene: value for gene, value in zip(subset_genes, row)}}
                    for cell, row in zip(adata.obs_names[:10], subset_matrix)
                ],
                style_table={"overflow": "auto", "padding": "10px",
                             "textAlign": "center"},
                style_header={"fontWeight": "bold", "word-break": "break-word"},
                style_cell={
                    'padding': '10px',  # Add padding to the cells
                    'whiteSpace': 'normal',  # Allow wrapping of cell contents
                    'height': 'auto',  # Set cell height to auto to accommodate wrapped contents
                    'textAlign': 'center', 
                     'minWidth': 95, 
                    #  'maxWidth': 200, 
                     'width': 95 # Center-align the text in the cells
                },
                fixed_rows={"headers": True, "data": 0}
            )

            # Get the available layers and assays
            available_layers = list(adata.layers.keys()) if adata.layers is not None else []
            available_assays = list(adata.obs.keys()) if adata.obs is not None else []

            # Create dropdown components for selecting default layers and assays
            default_layer_dropdown = dcc.Dropdown(
                id="default-layer-dropdown",
                options=[{"label": layer, "value": layer} for layer in available_layers],
                value=available_layers[0] if available_layers else None
            )
            default_assay_dropdown = dcc.Dropdown(
                id="default-assay-dropdown",
                options=[{"label": assay, "value": assay} for assay in available_assays],
                value=available_assays[0] if available_assays else None
            )

            # # Serialize and store the adata
            # adata_df = create_dataframe(adata)
            # adata_pickle = adata_df.to_json(date_format='iso', orient='split')
            setAnnData(adata)
            adata_pickle = None

            try:
                parse_h5ad(adata, file_path)
            except Exception as error:
                traceback.print_exc() 

            return dataset_info, [
                # components_component,
                html.H3("Metadata:", style={"margin-top": "20px"}),
                html.Table(
                    [html.Tr([html.Th(key), html.Td(str(value))]) for key, value in metadata.items()],
                    style={"margin-bottom": "20px"}
                ),

                html.H3("Available Layers:"),
                default_layer_dropdown,
                html.H3("Observations (Cell-Level Metadata):"),
                default_assay_dropdown,

                html.H3("Subset of Gene Expression Matrix (HeatMap):", style={"margin-top": "20px"}),
                dcc.Graph(
                    id="gene-expression-heatmap",
                    figure={
                        "data": [
                            {
                                "x": adata.obs_names.tolist(),
                                "y": subset_genes.tolist(),
                                "z": subset_matrix.T.tolist(),
                                "type": "heatmap",
                                "colorscale": "Viridis"
                            }
                        ],
                        "layout": {
                            "xaxis": {"title": "Cells"},
                            "yaxis": {"title": "Genes"},
                            "margin": {"l": 100, "r": 100, "t": 50, "b": 50}
                        }
                    }
                ),

                expression_invalid_table,
                html.H3("Subset of Gene Expression Matrix (Table):", style={"margin-top": "20px"}),
                expression_table,
                row_checkboxes,
                html.Div(id="selected-rows-output"),  # Placeholder for selected rows display
                column_checkboxes,
                html.Div(id="selected-columns-output"),
                update_button
            ], {'display': 'none'}, adata_pickle, action_button, None
        except ValueError as error:
            traceback.print_exc()  # Print the traceback to the console
            error_message = html.Div(
                "An error occurred while processing the dataset: {}".format(str(error)),
                style={"color": "red", "padding-top": "1rem"}
            )
            return error_message, None, {'display': 'none'}, None, {'display': 'none'}, None
    else:
        raise PreventUpdate


@app.callback(
    Output("selected-rows-output", "children"),
    Input("row-checklist", "value"),
    prevent_initial_call=True
)
def update_selected_rows_output(selected_rows):
    if selected_rows:
        return html.P(f"Selected Rows: {', '.join(selected_rows)}")
    else:
        return html.P("No rows selected.")


@app.callback(
    Output("selected-columns-output", "children"),
    Input("column-checklist", "value"),
    prevent_initial_call=True
)
def update_selected_columns_output(selected_columns):
    if selected_columns:
        return html.P(f"Selected Columns: {', '.join(selected_columns)}")
    else:
        return html.P("No columns selected.")


@app.callback(
    Output("update-status", "children"),
    Output("download-link", "href"),
    Output("updated-adata-storage", "data"),
    Input("update-button", "n_clicks"),
    State("row-checklist", "value"),
    State("column-checklist", "value"),
    State("dataset-dropdown", "value"),
    State("adata-storage", "data"),
    prevent_initial_call=True
)
def update_and_download_dataset(n_clicks, selected_rows, selected_columns, dataset, adata_pickle):
    if n_clicks is not None and n_clicks > 0:
        # adata_df = pd.read_json(adata_pickle, orient='split')
        print("before update and download")
        # Convert adata_df to AnnData object
        # adata = sc.AnnData(adata_df)

        adata = getannData()
        print(adata)
        print(adata.X)
        matrix_type = adata.X.dtype

        print("Matrix type:", matrix_type)

        print("after update and download")

        # Parse the selected rows and columns from the input strings
        selected_rows = selected_rows if selected_rows else []
        selected_columns = selected_columns if selected_columns else []
        print("after update and download1")

        # Filter row names and column names
        if selected_rows and selected_columns:
            adata = adata[~adata.obs_names.isin(selected_rows), ~adata.var_names.isin(selected_columns)]
        elif selected_rows:
            adata = adata[~adata.obs_names.isin(selected_rows), :]
        elif selected_columns:
            print("after update and download2")
            adata = adata[:, ~adata.var_names.isin(selected_columns)]
        else:
            # If no rows or columns selected, return an error message
            error_message = html.Div(
                "Please select at least one row or column.",
                style={"color": "red", "padding-top": "1rem"}
            )
            return error_message, "", ""

        file_path = datasetMap[dataset]
        file_name = file_path.split("/")
        fileparts = file_name[len(file_name)-1].split(".")
        filename = fileparts[0] + "_user_corrected.h5ad"
       
        # Generate a new file name for the filtered dataset
        filtered_file_name = os.path.join(os.path.dirname(file_path), filename)

        print(adata.X)
        print("after update and download3")
        adata.X = adata.X.astype(float)

        matrix_type = adata.X.dtype

        print("Matrix type:", matrix_type)
        

        adata.write_h5ad(filtered_file_name, compression='gzip')
        print("after update and download4")

        # Generate the download link for the filtered dataset file
        download_link = f"/download/{filtered_file_name}"

        # Display the update status
        update_status = html.Span("Dataset updated and file created successfully!", className="success-message")
        print(update_status)
        # Serialize and store the adata
        # adata_df = create_dataframe(adata)
        # adata_pickle = adata_df.to_json(date_format='iso', orient='split')

        setAnnData(adata)
        adata_pickle = None

        return update_status, download_link, adata_pickle

    return "", "", ""


@app.callback(
    Output("file-info", "children"),
    Output("dataset-content", "children"),
    Output("adata-storage", "data", allow_duplicate=True),
    Output(component_id='edit-button-container', component_property='style'),
    Output("rowsncolumns-container", "children", allow_duplicate=True),
    Input("update-status", "children"),
    State("dataset-dropdown", "value"),
    State("updated-adata-storage", "data"),
    prevent_initial_call=True
)
def update_dataset_content(update_status, dataset, updatedData):
    if update_status is not None and update_status != "":

        adata = getannData()

        try:
            dataset_info = f"Dataset Name: {dataset}"

            # Extract metadata and subset of gene expression matrix
            metadata = {
                "Number of Cells": adata.n_obs,
                "Number of Genes": adata.n_vars,
            }
            subset_genes = adata.var_names[:10]
            print("before the error")
            data_matrix = adata.X
            print(isinstance(data_matrix, np.ndarray))
            if not isinstance(data_matrix, np.ndarray):
                data_matrix = data_matrix.toarray()
                subset_matrix = data_matrix[:10, :]
            else:
                subset_matrix = adata.X[:10, :]

            print("After the error")
            # Create a component to display the subset of gene expression matrix as a table
            expression_table = dash_table.DataTable(
                id="gene-expression-table",
                columns=[{"name": "", "id": "Cells"}] + [{"name": gene, "id": gene} for gene in subset_genes],
                data=[
                    {"Cells": cell, **{gene: value for gene, value in zip(subset_genes, row)}}
                    for cell, row in zip(adata.obs_names[:10], subset_matrix)
                ],
                style_table={"overflow": "auto", "padding": "10px",
                             "textAlign": "center"},
                style_header={"fontWeight": "bold", "word-break": "break-word"},
                style_cell={
                    'padding': '10px',  # Add padding to the cells
                    'whiteSpace': 'normal',  # Allow wrapping of cell contents
                    'height': 'auto',  # Set cell height to auto to accommodate wrapped contents
                    'textAlign': 'center',  # Center-align the text in the cells
                     'minWidth': 95, 
                    #  'maxWidth': 200, 
                     'width': 95 # Center-align the text in the cells
                },
                fixed_rows={"headers": True, "data": 0}
            )

            # Get the available layers and assays
            available_layers = list(adata.layers.keys()) if adata.layers is not None else []
            available_assays = list(adata.obs.keys()) if adata.obs is not None else []

            # Create dropdown components for selecting default layers and assays
            default_layer_dropdown = dcc.Dropdown(
                id="default-layer-dropdown",
                options=[{"label": layer, "value": layer} for layer in available_layers],
                value=available_layers[0] if available_layers else None
            )
            default_assay_dropdown = dcc.Dropdown(
                id="default-assay-dropdown",
                options=[{"label": assay, "value": assay} for assay in available_assays],
                value=available_assays[0] if available_assays else None
            )

            setAnnData(adata)

            adata_pickle = None

            return dataset_info, [
                html.H3("Metadata:", style={"margin-top": "20px"}),
                html.Table(
                    [html.Tr([html.Th(key), html.Td(str(value))]) for key, value in metadata.items()],
                    style={"margin-bottom": "20px"}
                ),

                html.H3("Available Layers:"),
                default_layer_dropdown,
                html.H3("Observations (Cell-Level Metadata):"),
                default_assay_dropdown,

                html.H3("Subset of Gene Expression Matrix (HeatMap):", style={"margin-top": "20px"}),
                dcc.Graph(
                    id="gene-expression-heatmap",
                    figure={
                        "data": [
                            {
                                "x": adata.obs_names.tolist(),
                                "y": subset_genes.tolist(),
                                "z": subset_matrix.T.tolist(),
                                "type": "heatmap",
                                "colorscale": "Viridis"
                            }
                        ],
                        "layout": {
                            "xaxis": {"title": "Cells"},
                            "yaxis": {"title": "Genes"},
                            "margin": {"l": 100, "r": 100, "t": 50, "b": 50}
                        }
                    }
                ),

                html.H3("Subset of Gene Expression Matrix (Table):", style={"margin-top": "20px"}),
                expression_table
            ], adata_pickle, {"display": "block"}, None
        except ValueError as error:
            traceback.print_exc()  # Print the traceback to the console
            error_message = html.Div(
                "An error occurred while processing the dataset: {}".format(str(error)),
                style={"color": "red", "padding-top": "1rem"}
            )
            return error_message, None, None, {"display": "none"}, None
    raise PreventUpdate


@app.callback(
    Output("rowsncolumns-container", "children"),
    Output(component_id='edit-button-container', component_property='style', allow_duplicate=True),
    Input("edit-button", "n_clicks"),
    State("adata-storage", "data"),
    prevent_initial_call=True
)
def toggle_edit_update_buttons(n_clicks, data):
    if n_clicks > 0:

        adata = getannData()

        # Create checkboxes for rows and columns
        row_checkboxes = html.Div(
            [
                html.H3("Select Rows to Remove:", style={"margin-top": "20px"}),
                dcc.Checklist(
                    id="row-checklist",
                    options=[{"label": cell, "value": cell} for cell in adata.obs_names[:10]],
                    value=[],
                    className="checklist"
                )
            ],
            id="row-checkboxes",
        )

        column_checkboxes = html.Div(
            [
                html.H3("Select Columns to Remove:", style={"margin-top": "20px"}),
                dcc.Checklist(
                    id="column-checklist",
                    options=[{"label": gene, "value": gene} for gene in adata.var_names[:10]],
                    value=[],
                    className="checklist"
                )
            ],
            id="column-checkboxes",
        )

        update_button = html.Div(
            className="input-container",
            children=[
                html.Button(
                    "Update Dataset",
                    id="update-button",
                    className="update-button"
                ),
                html.Div(id="update-status", className="update-status"),
                html.A(
                    "Download Dataset",
                    id="download-link",
                    href="",
                    download="updated_dataset.h5ad",
                    target="_blank"
                )
            ],
        )
        return [row_checkboxes, column_checkboxes, update_button], {"display": "none"}

    raise PreventUpdate


@app.callback(
    Output('output-message', 'children'),
    Output("active-assay", "children"),
    Output('assay-dropdown', 'options'),
    Output('assay-dropdown', 'value'),
    State('assay-dropdown', 'value'),
    Input('default-assay', 'n_clicks'),
    State("dataset-dropdown", "value"),
    State("confirm-checklist", "value"),
    prevent_initial_call=True
)
def update_selected_assay(selected_assay_name, n_clicks, dataset, checklist_value):
    if n_clicks is None:
        raise PreventUpdate


    file_path = datasetMap[dataset]
    file_name = file_path.split("/")
    fileparts = file_name[len(file_name)-1].split(".")
    # Assuming 'seurat_obj' is your Seurat object
    # Update the Seurat object to use the selected assay as the default assay
    file_path = datasetMap[dataset]
    fileName = None
    suffix = None
    if not os.path.isdir(file_path):
        file_name = file_path.split("/")
        fileparts = file_name[len(file_name)-1].split(".")
        suffix = fileparts[1]
        fileName = fileparts[0]
    else:
        fileName = "10X_dataset"
    output = fileName + "_corrected"
    ro.globalenv["output"] = output
    ro.globalenv["file_path"] = file_path
    ro.globalenv["selected_assay"] = selected_assay_name
    if suffix == "rds" or suffix == "h5seurat":
        srat = load_seurat(file_path)
        ro.globalenv["seurat_obj"] = srat

        if "yes" in checklist_value:
            # Rename the assay to "RNA" in the Seurat object or RDS dataset
            ro.r(f'''
                  # Set the selected assay as the active assay
                  print("Default Assay")
                  print(DefaultAssay(object = seurat_obj))
                 names(seurat_obj@assays)[names(seurat_obj@assays) == selected_assay] <- 'RNA'

                # RenameAssay(object = seurat_obj, assay = selected_assay, new.name = 'RNA')
                  DefaultAssay(object = seurat_obj) <- 'RNA'
                  print("Default Assay")
                  print(DefaultAssay(object = seurat_obj))  
                # Get the names of all assays
                assay_names <- names(seurat_obj@assays)

                SaveH5Seurat(seurat_obj, filename = output , overwrite = TRUE, verbose = FALSE)
           ''')
            assay_names = ro.globalenv["assay_names"]
            print("Last")
            print(assay_names)
            update_dropdown = [{'label': assay, 'value': assay} for assay in assay_names]
            print(update_dropdown)
            return f"Default assay set to: RNA", "RNA", update_dropdown, "RNA"
        else:
            # User chose not to rename the assay, keep the original selected assay
            ro.r(f'''
                   # Set the selected assay as the active assay
                   # seurat_obj <- Seurat::SetAssay(object = seurat_obj, assay = selected_assay_name)
                   print("Default Assay")
                   print(DefaultAssay(object = seurat_obj))
                   DefaultAssay(object = seurat_obj) <- selected_assay
                   # Get the names of all assays
                   assay_names <- names(seurat_obj@assays)
                   SaveH5Seurat(seurat_obj, filename = output , overwrite = TRUE, verbose = FALSE)
            ''')
            assay_names = ro.globalenv["assay_names"]
            update_dropdown = [{'label': assay, 'value': assay} for assay in assay_names]

            return f"Default assay set to: {selected_assay_name}", selected_assay_name, update_dropdown, selected_assay_name


@app.callback(
    Output("assay-change-confirmation", "children"),
    Input("assay-dropdown", "value"),
    State("assay-dropdown", "options"),
    prevent_initial_call=True
)
def update_active_assay(selected_assay, available_assays_options):
    # Check if the selected assay is not "RNA" and "RNA" is not present in available assays
    print("outside")
    print(selected_assay)
    if selected_assay != "RNA" and "RNA" not in [option["value"] for option in available_assays_options]:
        print("inside")
        print(selected_assay)
        # Show a confirmation prompt to the user
        return html.Div([
            html.P(f"Do you want to change the assay name '{selected_assay}' to 'RNA'?"),
            dcc.Checklist(id="confirm-checklist",
                          options=[
                              {'label': 'Yes', 'value': 'yes'},
                              {'label': 'No', 'value': 'no'}
                          ],
                          value=[]
                          )
        ])
    else:
        # Set the selected assay as default (without confirmation)
        # Add code here to update the default assay in the Seurat object or RDS dataset
        return None


if __name__ == "__main__":
    app.run_server(debug=True)