FROM stormgod/oscb-react:0.1.1

WORKDIR /opt/src/app

RUN npm install --no-audit --no-fund \
    framer-motion react-markdown remark-math rehype-katex katex
COPY oscb-ui/oscb-react/ ./
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
EXPOSE 3000
CMD ["npm", "start"]
