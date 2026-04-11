from setuptools import setup, find_packages


with open("README.md", "r") as f:
    description = f.read()

setup(
    name="oscb",
    version="0.1.1",
    description='OSCB aims to provide automated end-to-end single-cell analyses ML pipelines to simplify and standardize the process of single-cell data formatting, quality control, loading, model development, and model evaluation. ',
    author="Lei Jiang",
    author_email="leijiang@missouri.edu",
    url='https://github.com/cirisjl/Machine-learning-development-environment-for-single-cell-sequencing-data-analyses',
    packages=find_packages(),
    install_requires=['leidenalg>=0.8.10', 'matplotlib>=3.5.1', 'networkx>=2.6.3', 'numpy>=1.26.4', 'pandas>=1.3.5', 'python_igraph>=0.9.9', 'python_louvain>=0.16',
                      'scanpy', 'muon', 'mudata', 'tqdm', 'requests', 'scib', 'zss', 'grakel', 'scikit_learn>=1.0.2', 'scipy>=1.7.3',  
                      'umap_learn>=0.5.2'],
    python_requires=">=3.6, <=3.12",
    keywords=['single-cell', 'benchmarks'],
    license='MIT',
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    long_description=description,
    long_description_content_type="text/markdown",
)