# Stage 1: Build ứng dụng
FROM node:18-alpine AS builder

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép package.json và package-lock.json
COPY my-app/package.json my-app/package-lock.json ./

# Cài đặt dependencies
RUN npm install --production=false

# Sao chép toàn bộ mã nguồn và .env
COPY my-app/ ./
COPY my-app/.env ./

# Build ứng dụng
RUN npm run build

# Stage 2: Phục vụ ứng dụng bằng Nginx
FROM nginx:alpine

# Sao chép các file build từ stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Cấu hình Nginx để hỗ trợ react-router
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Mở port 80
EXPOSE 80

# Khởi động Nginx
CMD ["nginx", "-g", "daemon off;"]