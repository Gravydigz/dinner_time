# Node.js server for Dinner Time application
FROM node:18-alpine

# Metadata
LABEL maintainer="Travis Robertson"
LABEL description="Dinner Time - Recipe Planning and Rating System"
LABEL version="2.0"

# Create app directory
WORKDIR /app

# Copy server package files
COPY ../server/package*.json ./server/

# Install dependencies
WORKDIR /app/server
RUN npm install --production

# Copy application files
WORKDIR /app
COPY ../server ./server
COPY ../frontend ./frontend
COPY ../data ./data

# Create uploads directory with proper permissions
RUN mkdir -p /app/data/uploads/images \
    /app/data/uploads/pdfs \
    /app/data/uploads/processed && \
    chmod -R 755 /app/data

# Expose port 3000
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Start the server
WORKDIR /app/server
CMD ["node", "server.js"]
