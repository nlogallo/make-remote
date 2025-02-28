# Make Remote

## Overview

This project allows you to remotely compile code through a client-server model. The client uploads the project files to the server, triggers the compilation process with specified `make` arguments, and retrieves the compiled output. The server executes the compilation and sends the result back to the client for extraction.

### Executables

- `make-remote`: The client executable that sends the project files to the server, triggers the compilation, and downloads the output.
- `make-remote-server`: The server executable that receives the client requests, compiles the code, and sends the result back to the client.

## Prerequisites

- Node.js
- npm
- make (on server)

## Installation

Clone this repository and install the required dependencies:

```bash
git clone https://github.com/yourusername/make-remote.git
cd make-remote
make install-dep
make all
```

### Global Linking for `make-remote`

You can link the client and server executables globally by running:

```bash
make link
```

Once linked, you can run the client and server from any directory in your terminal.

## Usage

### Starting the Server

To start the server, run:

```bash
make-remote-server
```

The server will listen for incoming requests on port 3000 and compile code accordingly.

### Using the Client

To run the client, use:

```bash
make-remote -s <server_url> -o <output_folder> -m "<make_args>" <project_directory>
```

Where:
- `<server_url>`: The URL of the server (default: `http://localhost:3000`).
- `<output_folder>`: The folder where the compiled output will be saved.
- `<make_args>`: The `make` arguments (e.g., `SOC=gd32vf103 BOARD=gd32vf103c_longan_nano all`).
- `<project_directory>`: The directory containing the project files, including the Makefile.

## License

MIT License.
