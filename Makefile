# Project settings
PROJECT_DIR := $(shell pwd)
SRC_DIR := src
BIN_DIR := bin
MAKE_ARGS :=

# Default target: Build both server and client executables
all: make-remote-server make-remote

# Build the server executable (make-remote-server)
server: $(SRC_DIR)/server.js
	@echo "Creating executable for the server script..."
	@mkdir -p $(BIN_DIR)
	@cp $(SRC_DIR)/server.js $(BIN_DIR)/make-remote-server
	@chmod +x $(BIN_DIR)/make-remote-server
	@echo "'make-remote-server' executable created in $(BIN_DIR)"

# Build the client executable (make-remote)
client: $(SRC_DIR)/client.js
	@echo "Creating executable for the client script..."
	@mkdir -p $(BIN_DIR)
	@cp $(SRC_DIR)/client.js $(BIN_DIR)/make-remote
	@chmod +x $(BIN_DIR)/make-remote
	@echo "'make-remote' executable created in $(BIN_DIR)"

# Clean the output and binary folders
clean:
	@echo "Cleaning output and binary files..."
	@rm -rf $(BIN_DIR)/*
	@echo "Cleaned up"

# Install Node.js dependencies
install-dep:
	@echo "Installing Node.js dependencies..."
	@npm install
	@echo "Dependencies installed."

# Link the project globally (useful for testing the 'make-remote' command)
link:
	@npm link
	@echo "Linked the project globally."

.PHONY: all clean install-dep link
