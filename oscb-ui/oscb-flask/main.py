from rpy2.robjects.packages import importr
from constants import USER_STORAGE_PATH, DATASETS_API
import rpy2.robjects as ro
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_htmlmin import HTMLMIN
from rpy2.robjects import pandas2ri
import scanpy as sc

# pandas2ri.activate()
import os


# Initialize the Flask application
flask_app = Flask(__name__)
flask_app.config['MINIFY_HTML'] = True
htmlmin = HTMLMIN(flask_app)
CORS(flask_app)

@flask_app.route('/')
def base():
    return "hello"

@flask_app.route('/preview/dataset', methods=['POST'])
def previewDatasets():
    utils = importr('utils')
    # Load an R package
    dplyr = importr('dplyr')

    req_data = request.get_json()

    # Extracting the required fields from the request body
    path = req_data['path']
    files = req_data['files']
    username = req_data['username']

    # Extract the filenames
    filenames = [os.path.basename(file['file_loc']) for file in files]
    file_paths = [file['file_loc'] for file in files]

    # create user directory to read the file contents
    user_directory = USER_STORAGE_PATH + "/" + username

    # Check the existence of the files
    for file_path in file_paths:
        if not os.path.exists(user_directory + file_path):
            error_message = f"File {file_path} does not exist."
            response = jsonify(error=error_message)
            response.status_code = 404  # Not Found status code
            return response

    # All files exist, proceed with reading the contents
    molecules_filename = "molecules.txt"
    annotations_filename = "annotation.txt"

    # create parent directory to read the file contents
    parent_directory = USER_STORAGE_PATH + "/" + username + "/" + path

    if molecules_filename in filenames:
        molecules_path = file_paths[filenames.index(molecules_filename)]
        absolute_molecules_path = user_directory + molecules_path
        molecules_file_path = ro.StrVector([absolute_molecules_path])
        ro.globalenv["molecules_file_path"] = molecules_file_path
    else:
        error_message = "molecules.txt file is missing. We need both annotation.txt and molecules.txt files for QC Single Cell Experiment. Please provide the files to preview"
        response = jsonify(error=error_message)
        response.status_code = 400  # Bad Request status code
        return response

    if annotations_filename in filenames:
        annotations_path = file_paths[filenames.index(annotations_filename)]
        absolute_annotation_path = user_directory + annotations_path
        annotation_file_path = ro.StrVector([absolute_annotation_path])
        ro.globalenv["annotation_file_path"] = annotation_file_path
    else:
        error_message = "annotation.txt file is missing. We need both annotation.txt and molecules.txt files for QC Single Cell Experiment. Please provide the files to preview"
        response = jsonify(error=error_message)
        response.status_code = 400  # Bad Request status code
        return response

    # Load the CSV file into an R dataframe
    ro.r('''
        library(scater)
        library(SingleCellExperiment)
        library(AnnotationDbi)
        library(org.Hs.eg.db)
        library(EnsDb.Hsapiens.v86)
     ''')
    ro.r(f'''
    molecules <- read.delim(molecules_file_path, sep = "\t", row.names = 1, stringsAsFactors = FALSE)
    ''')
    ro.r(
        f'annotation <- read.delim(annotation_file_path, sep = "\t", stringsAsFactors = T)')
    r_molecules_df = ro.globalenv['molecules']
    r_annotations_df = ro.globalenv['annotation']

    pandas_molecules_df = ro.conversion.rpy2py(r_molecules_df)
    pandas_annotation_df = ro.conversion.rpy2py(r_annotations_df)

    # Select the first 10 rows and 5 columns of the dataframes
    pandas_molecules_df = pandas_molecules_df.iloc[:6, :3]
    pandas_annotation_df = pandas_annotation_df.iloc[:6, :]

    # print(pandas_molecules_df.head(5))
    # print(pandas_annotation_df.head(5))

    ro.r(f'''
            sce <- SingleCellExperiment(assays=list(counts= as.matrix(molecules)), colData=annotation)
            # altExp(sce,"ERCC") <- sce[grep("^ERCC-",rownames(sce)), ]
            sce <- sce[grep("^ERCC-",rownames(sce),invert = T), ]
            gene_names <- mapIds(org.Hs.eg.db, keys=rownames(sce), keytype="ENSEMBL", columns="SYMBOL",column="SYMBOL")

            rowData(sce)$SYMBOL <- gene_names
            table_geneNames <- table(is.na(gene_names))

            sce <- sce[! is.na(rowData(sce)$SYMBOL),] # Remove all genes for which no symbols were found
            temp1 <- grep("^MT-",rowData(sce)$SYMBOL,value = T) # Check if we can find mitochondrial proteins in the newly annotated symbols
            temp2 <- grep("^RP[LS]",rowData(sce)$SYMBOL,value = T)
            temp3 <- grep("ATP8",rowData(sce)$SYMBOL,value = T) # Quick search for mitochondrial protein ATP8, which is also called MT-ATP8
            temp4 <- columns(org.Hs.eg.db)

            ensdb_genes <- genes(EnsDb.Hsapiens.v86)
            MT_names <- ensdb_genes[seqnames(ensdb_genes) == "MT"]$gene_id
            is_mito <- rownames(sce) %in% MT_names
            temp5 <- table(is_mito)
    ''')

    # r_sce_df = ro.globalenv['sce']
    r_table_geneNames = ro.globalenv['table_geneNames']
    r_grep_not_mt = ro.globalenv['temp1']
    r_grep_not_rpls = ro.globalenv['temp2']
    r_grep_atp8 = ro.globalenv['temp3']
    r_columns = ro.globalenv['temp4']
    r_is_mitro = ro.globalenv['temp5']

    return render_template('previewDatasets.html', pandas_annotation_df=pandas_annotation_df,
                           pandas_molecules_df=pandas_molecules_df, r_table_geneNames=r_table_geneNames,
                           r_grep_not_mt=r_grep_not_mt, r_grep_not_rpls=r_grep_not_rpls, r_grep_atp8=r_grep_atp8,
                           r_columns=r_columns, r_is_mitro=r_is_mitro,
                           absolute_annotation_path=absolute_annotation_path,
                           absolute_molecules_path=absolute_molecules_path)


if __name__ == "__main__":
    flask_app.run()
