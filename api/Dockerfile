# FROM u15ec104/oscb:celery-backend-base
# FROM stormgod/oscb-api
# FROM stormgod/oscb-seurat:5.02
# FROM stormgod/oscb-seurat:4.4.1
# FROM stormgod/oscb-seurat-cuda117:4.4.1
# FROM stormgod/oscb-seurat-cuda117-singler:4.4.1
# FROM stormgod/oscb-cuda128-r45
# FROM stormgod/oscb-cuda128-r45:seurat440
# FROM stormgod/oscb-cuda126-r45-seurat440:1.1
FROM stormgod/oscb-cuda126-r45-seurat440:1.2.3
# FROM stormgod/oscb-cuda126-r45-seurat440:0.9

# RUN apt-get update && apt-get install -yq --no-install-recommends libglpk-dev libmagick++-dev

# Install python packages
# RUN pip install --upgrade --no-cache \
#     dash~=2.9.1 pymongo dash-bootstrap-components dash_bootstrap_templates python-multipart numpyro==0.12.1 rarfile loguru wsproto attrdict
    # louvain plotly psutil nvidia-ml-py pymde
    # gputil

# Downgrade SeuratObject
# RUN R --no-echo --no-restore --no-save -e 'remotes::install_version("SeuratObject", "4.1.4", repos = c("https://satijalab.r-universe.dev", getOption("repos")))'
# RUN R --no-echo --no-restore --no-save -e 'remotes::install_version("Seurat", "4.4.0", repos = c("https://satijalab.r-universe.dev", getOption("repos")))'
# RUN R --no-echo --no-restore --no-save -e "install.packages('SeuratObject')"
# RUN R --no-echo --no-restore --no-save -e "install.packages('igraph')"
# RUN R --no-echo --no-restore --no-save -e "install.packages("irlba", type="source", force=TRUE)"
# RUN R --no-echo --no-restore --no-save -e "install.packages('magick')"
# RUN Rscript -e 'BiocManager::install("singleCellTK")'

# Install DoubletFinder
# RUN R --no-echo --no-restore --no-save -e "remotes::install_github('chris-mcginnis-ucsf/DoubletFinder')"

# RUN pip install --upgrade --no-cache json-numpy

# RUN mkdir /app
# RUN pip install --upgrade --no-cache celery_once
# RUN R --no-echo --no-restore --no-save -e "install.packages('redux')"
# RUN R --no-echo --no-restore --no-save -e 'remotes::install_version("matrixStats", version="1.1.0")'
# RUN pip install --upgrade --no-cache boltons scib zss grakel
# pegasus pegasusio

# RUN R --no-echo --no-restore --no-save -e "install.packages('redux')"

# RUN pip install --upgrade --no-cache doubletdetection matplotlib-venn harmonypy celltypist

# RUN pip install vitessce[all]

WORKDIR /app
COPY api/ .

# # Copy the entrypoint script into the container
# COPY entrypoint.sh /usr/local/bin/entrypoint.sh

# # Make sure it's executable inside the container
# RUN chmod +x /usr/local/bin/entrypoint.sh

# # Set the entrypoint
# ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# CMD ["bash"]
EXPOSE 5005
EXPOSE 5555

CMD ["python3", "main.py"]