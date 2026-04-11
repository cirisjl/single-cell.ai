FROM node:18

WORKDIR /usr/src/app

COPY oscb-ui/oscb-node/package*.json ./

RUN npm install

COPY oscb-ui/oscb-node/ .

RUN mkdir uploads
RUN chmod +x deploy.sh
RUN chmod +x deploy_companion.sh

# Copy the entrypoint script into the container
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

# Make sure it's executable inside the container
RUN chmod +x /usr/local/bin/entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

EXPOSE 3001
EXPOSE 3020

CMD ["sh", "-c", "./deploy.sh & ./deploy_companion.sh"]
