# Parse arguments
import argparse
from qc import qc
# import handout

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Main program for Quality Control')
    parser.add_argument('-d', '--dataset', type=str, required=True, 
                        help="ID or Name of the dataset (str, required)")
    parser.add_argument('-i', '--input', type=str, required=True, 
                        help="Path of the input file (str, required)")
    parser.add_argument('-o', '--output', type=str, required=True,
                        help="Path of the output file (str, required)")
    parser.add_argument('-f', '--format', type=str, default='AnnData', choices = ['Seurat', 'AnnData'], 
                        help="Format of the output file (str, default 'AnnData/') ")
    parser.add_argument('-m', '--methods', type=str, default=None, nargs='+', choices = ['Scanpy', 'Dropkick', 'Bioconductor', 'Seurat'], 
                        help='''You may pass several methods without quotation marks separated by space. (str, default 'None') 
                        Scanpy
                        Dropkick
                        Bioconductor
                        Seurat  
                        ''')
    parser.add_argument('-s', '--scrublet', type='./scrublet_calls.tsv', default=None, 
                        help="Path of scrublet calls. (str, default None)")


    args = parser.parse_args()

    qc(dataset=args.dataset, input=args.input, output=args.output, methods=args.methods, path_of_scrublet_calls='./scrublet_calls.tsv', show_error=True)