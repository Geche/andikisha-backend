#!/bin/bash

# Generate TypeScript/JavaScript from proto files
PROTO_DIR=./proto
OUT_DIR=./libs/grpc/src/generated

mkdir -p $OUT_DIR

# Install protoc plugin if not already installed
npm install -g grpc-tools

# Generate for each proto file
for proto_file in $PROTO_DIR/*.proto; do
  echo "Generating: $proto_file"

  grpc_tools_node_protoc \
    --js_out=import_style=commonjs,binary:$OUT_DIR \
    --grpc_out=grpc_js:$OUT_DIR \
    --plugin=protoc-gen-grpc=$(which grpc_tools_node_protoc_plugin) \
    -I $PROTO_DIR \
    $proto_file

  grpc_tools_node_protoc \
    --plugin=protoc-gen-ts=$(which protoc-gen-ts) \
    --ts_out=grpc_js:$OUT_DIR \
    -I $PROTO_DIR \
    $proto_file
done

echo "Proto generation complete!"