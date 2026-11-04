
# Use Node.js 22 Alpine
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the application source
COPY . .

# Expose the application port
EXPOSE 8100

# Start Angular development server
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "8100"]
