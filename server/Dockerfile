FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
RUN mkdir -p /app/uploads && chown -R node:node /app

USER node
EXPOSE 4000
CMD ["npm", "start"]
