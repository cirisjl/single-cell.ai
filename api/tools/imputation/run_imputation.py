# Parse arguments
import argparse
from imputation import impute
# import handout


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Main program for imputation')
    parser.add_argument('-d', '--dataset', type=str, required=True, 
                        help="ID or Name of the dataset (str, required)")
    parser.add_argument('-i', '--input', type=str, required=True, 
                        help="Path of the input file (str, required)")
    parser.add_argument('-o', '--output', type=str, required=True,
                        help="Path of the output file (str, required)")
    parser.add_argument('-f', '--format', type=str, default='AnnData', choices = ['Seurat', 'AnnData'], 
                        help="Format of the output file (str, default 'AnnData/') ")
    parser.add_argument('-l', '--layer', type=str, default=None, 
                        help="AnnData layer for imputation (str, default 'None')")
    parser.add_argument('-m', '--methods', type=str, default=None, nargs='+', choices = ['MAGIC', 'SAVER', 'scGNN'], 
                        help='''Folder for storing all the output. You may pass several methods without quotation marks separated by space. (str, default 'None') 
                        MAGIC
                        SAVER
                        scGNN                   
                        ''')
    parser.add_argument('-g', '--genes', type=str, default=None, nargs='+',
                        help="Genes only for MAGIC and SAVER imputation. You may pass several genes names without quotation marks separated by space. (str, default None)")
    parser.add_argument('-n', '--ncores', type=int, default=10, choices=range(1, 20),
                        help="Number of cores for SAVER (int, default 10) ")
    parser.add_argument('-dv', '--device', type=str, default='cpu', choices=['cpu', 'cuda'],
                        help='''Device for scGNN (str, default 'cpu'') 
                        cpu
                        cuda
                        ''')

    args = parser.parse_args()

    impute(dataset=args.dataset, input=args.input, output=args.output, methods=args.methods, layer=args.layer, genes=args.genes, ncores=args.ncores, show_error=True)
