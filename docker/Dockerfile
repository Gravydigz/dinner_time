# Multi-stage build for Dinner Time application
FROM nginx:alpine

# Metadata
LABEL maintainer="Travis Robertson"
LABEL description="Dinner Time - Recipe Planning and Rating System"
LABEL version="1.0"

# Remove default nginx website
RM /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy frontend application
COPY ../frontend/public /usr/share/nginx/html

# Copy data directory (recipes database)
# Note: In production, consider mounting this as a volume instead
COPY ../data /usr/share/nginx/html/data

# Create uploads directory with proper permissions
RUN mkdir -p /usr/share/nginx/html/data/uploads/images \
    /usr/share/nginx/html/data/uploads/pdfs \
    /usr/share/nginx/html/data/uploads/processed && \
    chown -R nginx:nginx /usr/share/nginx/html/data/uploads

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
