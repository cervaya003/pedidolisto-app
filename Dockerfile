# 1) Compilar. La URL del API se fija en el build: docker build --build-arg VITE_API_URL=https://api.tudominio.com/api/v1 .
FROM node:26-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@12.16.1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build

# 2) Servir archivos estáticos
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
