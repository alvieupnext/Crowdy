#!/bin/bash

# Building Docker images as per the specified directories and tags

# Build the Docker image in the root folder
echo "Building Docker image in the root folder..."
docker build -t crowdy .

# Build the Docker image in the image-predict folder
echo "Building Docker image in the image-predict folder..."
cd image-predict || exit
docker build -t image-predict .
cd ..

# Build the Docker image in the privacy-protection folder
echo "Building Docker image in the privacy-protection folder..."
cd privacy-protection || exit
docker build -t privacy-protection .
cd ..
