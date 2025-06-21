# Stage 1: Builder - To build the custom k6 binary
FROM golang:1.24-alpine AS builder

WORKDIR /app

# --- ADD THIS LINE ---
# Install git, which is required by xk6 to fetch extension modules.
RUN apk add --no-cache git

# Install xk6, the tool for building k6 with extensions
RUN go install go.k6.io/xk6/cmd/xk6@latest

# Build the k6 binary including the InfluxDB v2 output extension
RUN xk6 build \
    --with github.com/grafana/xk6-output-influxdb

# Stage 2: Final Image - A lightweight image to run our tests
FROM alpine:latest

# Copy the custom-built k6 binary from the builder stage
COPY --from=builder /app/k6 /usr/bin/k6

# Set the working directory for the test scripts
WORKDIR /scripts

# The entrypoint is now our custom k6 binary
ENTRYPOINT ["k6"]