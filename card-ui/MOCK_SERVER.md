# Mock API Server for Local Development

This guide will help you set up a simple mock API server for local development using the JSON Server package.

## Prerequisites

- Node.js or Bun installed

## Setup

1. Install JSON Server:

```bash
npm install -g json-server
# OR
bun install -g json-server
```

2. Create a `db.json` file in the root of your project:

```bash
cat > db.json << EOF
{
  "operators": [
    {
      "id": "elastic-cloud-eck",
      "name": "Elasticsearch (ECK) Operator",
      "provider": "Elastic",
      "description": "Elastic Cloud on Kubernetes (ECK) automates the deployment, provisioning, management, and orchestration of Elasticsearch, Kibana, APM Server, and Enterprise Search on Kubernetes.",
      "categories": ["database"],
      "logo": "https://static-www.elastic.co/v3/assets/bltefdd0b53724fa2ce/blta96f599d291b21fc/5d082d93f8ca2b7f16683b31/logo-elastic-search-color-64.svg",
      "createdAt": "2023-01-15"
    },
    {
      "id": "strimzi-kafka-operator",
      "name": "Strimzi Kafka Operator",
      "provider": "Red Hat",
      "description": "Strimzi provides a way to run an Apache Kafka cluster on Kubernetes or OpenShift in various deployment configurations.",
      "categories": ["streaming-messaging", "big-data"],
      "logo": "https://strimzi.io/images/strimzi-logo.png",
      "createdAt": "2022-09-24"
    },
    {
      "id": "apimatic-operator",
      "name": "APIMatic Operator",
      "provider": "APIMatic.io",
      "description": "Generate client SDKs and interactive Documentation for your APIs in minutes",
      "categories": ["developer-tools", "integration-delivery"],
      "logo": "https://cdn.appcelerator.com/api-builder/ABLogo.png",
      "createdAt": "2022-11-05"
    }
  ],
  "categories": [
    { "id": "ai-machine-learning", "name": "AI/Machine Learning", "count": 3 },
    { "id": "application-runtime", "name": "Application Runtime", "count": 5 },
    { "id": "big-data", "name": "Big Data", "count": 2 },
    { "id": "database", "name": "Database", "count": 7 },
    { "id": "developer-tools", "name": "Developer Tools", "count": 12 }
  ]
}
EOF
```

3. Start the mock server:

```bash
json-server --watch db.json --port 3000
```

The server will be running at `http://localhost:3000` with the following endpoints:

- `GET /api/operators` - Get all operators
- `GET /api/operators?search=kafka` - Search operators
- `GET /api/operators?category=database` - Filter by category
- `GET /api/operators?_sort=name&_order=asc` - Sort by name
- `GET /api/operators/:id` - Get a specific operator
- `GET /api/categories` - Get all categories

## Custom Routes

To better match our API expectations, create a `routes.json` file:

```json
{
  "/api/operators": "/operators",
  "/api/operators/:id": "/operators/:id",
  "/api/categories": "/categories"
}
```

Then start the server with:

```bash
json-server --watch db.json --routes routes.json --port 3000
```

## CORS Configuration

If you're having CORS issues, start the server with:

```bash
json-server --watch db.json --routes routes.json --port 3000 --middlewares ./cors-middleware.js
```

Create a `cors-middleware.js` file:

```javascript
module.exports = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
};
```

## Extending the Mock Data

You can extend the `db.json` file with more operators and categories as needed. JSON Server will automatically generate the appropriate endpoints.
