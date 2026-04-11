import os
import subprocess
import sys
from tools.formating.formating import *
from tools.imputation.MAGIC import magic_impute
from config.celery_utils import get_input_path, get_output
from utils.redislogger import *
    

def run_evaluation(job_id, dataset, input, userID, output, methods, layer=None, genes=None, ncores=12, show_error=True):
    if methods is None:
        print("No evaluation method is selected.")
        return None

    #Get the absolute path for the given input
    # input = get_input_path(input, userID)
    #Get the absolute path for the given output
    # output = get_output(output, userID, job_id)

    # methods = [x.upper() for x in methods if isinstance(x,str)]
    output = get_output_path(output, dataset=dataset, method='evaluation', format='SingleCellExperiment')
    # methods = list_py_to_r(methods)
    methods = list_to_string(methods)

    try:
        report_path = get_report_path(dataset, output, "evaluation")

        # Get the absolute path of the current file
        current_file = os.path.abspath(__file__)

        # Construct the relative path to the desired file
        relative_path = os.path.join(os.path.dirname(current_file), 'evaluation', 'evaluation.Rmd')

        # Get the absolute path of the desired file
        rmd_path = os.path.abspath(relative_path)

        s = subprocess.call(["R -e \"rmarkdown::render('" + rmd_path + "', params=list(dataset='" + str(dataset) + "', input='" + input + "', output_folder='" + output +  "', methods='" + methods +  "', show_error='" + str(show_error) + "'), output_file='" + report_path + "')\""], shell = True)
        print(s)
    except Exception as e:
        print("Normalization is failed")
        if show_error: print(e)

    return {'status': 'Success'}