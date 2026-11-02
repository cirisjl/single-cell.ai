FROM stormgod/oscb-cuda126-r45-seurat440:1.2.3-fix

WORKDIR /app
COPY api/ /app/
COPY scripts/celery-entrypoint.py /usr/local/bin/celery-entrypoint.py

EXPOSE 5005 5555
CMD ["python3", "main.py"]