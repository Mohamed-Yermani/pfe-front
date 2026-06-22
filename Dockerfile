# Stage 1: Build Angular
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Stage 2: NGINX
FROM nginx:stable-alpine

# ✅ Copier les fichiers Angular dans NGINX
COPY --from=builder /app/dist/front-end/browser /usr/share/nginx/html

# ✅ Supprimer la config par défaut et ajouter la tienne
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ✅ Permissions
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]