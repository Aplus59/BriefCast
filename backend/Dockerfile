FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod ./
# COPY go.sum ./
RUN go mod download

COPY . .
RUN go mod tidy
RUN go build -o /app/api-server ./cmd/api

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/api-server .

EXPOSE 8080
CMD ["./api-server"]
