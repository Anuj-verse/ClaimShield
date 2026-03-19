# Build Stage: Compile Vite App
FROM node:22-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve Stage: Nginx Alpine
FROM nginx:alpine

# Copy built CSS/JS assets
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom Nginx configuration (handles SPA routing + API Proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
