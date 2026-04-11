FROM stormgod/oscb_flask

# Install pandoc for R markdown
# RUN PANDOC_PKG=pandoc-3.1.1-1-amd64.deb && \
#     cd /tmp && \
#     wget https://github.com/jgm/pandoc/releases/download/3.1.1/${PANDOC_PKG} && \
#     dpkg -i ${PANDOC_PKG} && \
#     rm /tmp/${PANDOC_PKG}

WORKDIR /usr/src/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Set the FLASK_APP environment variable
ENV FLASK_APP=main.py

# Expose port 5003 for the Flask application to listen on
EXPOSE 5003

CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0","--port=5003"]
