FROM node:22-alpine

WORKDIR /app

# Install dependencies first for accurate Docker caching
COPY package*.json ./
RUN npm install --production

# Copy application source
COPY . .

# Expose backend API port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
