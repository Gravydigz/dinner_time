# Node.js server for Dinner Time application
# Build out of root directory dinner_time
# docker build -t gravydigz/dinner-time:2602.01.1 -t gravydigz/dinner-time:latest -f ./docker/Dockerfile .

# Source
FROM node:18-alpine

# Metadata
LABEL maintainer="Travis Robertson"
LABEL description="Dinner Time - Recipe Planning and Rating System"
LABEL version="2602.01.1"

# Create app directory
WORKDIR /app

# Copy server package files
COPY ./server/package*.json ./server/

# Install dependencies
WORKDIR /app/server
RUN npm install --production

# Copy application files
WORKDIR /app
COPY ./server ./server
COPY ./frontend ./frontend
COPY ./data ./tmp

# Create uploads directory with proper permissions
RUN mkdir -p /app/data/uploads/images \
    /app/data/uploads/pdfs \
    /app/data/uploads/processed && \
    chmod -R 755 /app/data

# Copy the entrypoint script into the image and make it executable
COPY ./docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port 3000
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Set the entrypoint to your script
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Start the server
WORKDIR /app/server
CMD ["node", "server.js"]
