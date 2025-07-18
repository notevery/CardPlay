# OperatorHub.io Clone

This is a clone of the [OperatorHub.io](https://operatorhub.io/) website, which is a registry for Kubernetes Operators.

## Features

- Browse and search for Kubernetes Operators
- Filter operators by category
- Sort operators alphabetically
- View operators in grid or list layout
- Responsive design that works on all devices

## Tech Stack

- React + TypeScript
- Tailwind CSS for styling
- Vite for build tooling

## Getting Started

### Prerequisites

- Node.js 16+ or Bun 1.0+

### Installation

1. Clone the repository
2. Install dependencies:

## API Configuration

The application is configured to connect to a backend API. By default, it will use a local API server at `http://localhost:3000/api`. You can configure a different API URL in two ways:

### Using Environment Variables

Create a `.env` file in the root of the project with the following content:


### mock
npm install -g json-server
# OR
bun install -g json-server

json-server --watch db.json --routes routes.json --port 3000 --middlewares ./cors-middleware.js
