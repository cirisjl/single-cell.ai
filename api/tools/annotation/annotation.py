import os
import re
import gzip
import pickle
import pandas as pd
from pyensembl import EnsemblRelease


species_dict = {'human': 'Homo_sapiens.GRCh38.110.chr.pkl', 'mouse': 'Homo_sapiens.GRCh38.110.pkl'}


def ensembl_to_symbol(ensembl_ids, species):
    symbol_ids = []
    data = EnsemblRelease(77, species=species)
    # if species == 'mouse':
    #     data = EnsemblRelease(77, species='mouse')
    # elif species == 'human':
    #     data = EnsemblRelease(77, species='human')
    # else:
    #     raise Exception("ensembl_to_symbol() only work for human and mouse.")

    for ensembl_id in ensembl_ids:
        try:
            gene_name = data.gene_name_of_gene_id(ensembl_id)
            symbol_ids.append(gene_name)
        except ValueError:
            symbol_ids.append(ensembl_id) # Handle cases where ID is not found

    return symbol_ids


def is_ensembl(gene):
    ensembl_regexp = '(ENS(|MUS|RNO)G\d{11})|(Y[A-P][LR]\d{3}[CW](-[A-G])?)'
    return bool(re.match(ensembl_regexp, gene))


def is_entrez_id(gene):
    entrez_regexp = '[0-9]+|[A-Z]{1,2}_[0-9]+|[A-Z]{1,2}_[A-Z]{1,4}[0-9]+'
    return bool(re.match(entrez_regexp, gene))


def get_ens_dict(file_path):
    with gzip.open(file_path, 'rb') as f:
        gtf = []
        for line in f:
            gtf.append(line.decode())

    gtf = [x for x in gtf if not x.startswith('#')]
    gtf = [x for x in gtf if 'gene_id "' in x and 'gene_name "' in x]
    if len(gtf) == 0:
        print('you need to change gene_id " and gene_name " formats')
    
    gtf = list(map(lambda x: (x.split('gene_id "')[1].split('"')[0], x.split('gene_name "')[1].split('"')[0]), gtf))
    gtf = dict(set(gtf))
    return gtf


def save_dict(dict, output):
    f_save = open(output, 'wb')
    pickle.dump(dict, f_save)
    f_save.close()


def load_dict(species):
    f_read = open(species_dict[species], 'rb')
    dict = pickle.load(f_read)
    f_read.close()
    return dict


def gtf_to_pkl(file_path, species):
    gtf_dict = get_ens_dict(file_path)
    output = os.path.splitext(file_path)[0] + 'pkl'
    save_dict(gtf_dict, output)
    species_dict[species] = output
    return output