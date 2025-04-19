# Deploying HealthChat to Cloudflare

This guide provides instructions for deploying the HealthChat SaaS platform to Cloudflare infrastructure, using Workers, KV, R2, and D1.

## Prerequisites

1. A Cloudflare account (sign up at [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up))
2. Node.js and npm installed on your local machine
3. Wrangler CLI installed (`npm install -g wrangler`)
4. OpenAI API key

## Setup Steps

### 1. Authentication and Project Setup

1. Log in to Cloudflare via Wrangler:
   ```bash
   wrangler login
   ```

2. Initialize Wrangler in your project directory:
   ```bash
   cd healthchat
   wrangler init
   ```

### 2. Creating Required Resources

#### D1 Database

1. Create a D1 database:
   ```bash
   wrangler d1 create healthchat-database
   ```

2. Apply the initial schema:
   ```bash
   wrangler d1 execute healthchat-database --file=cloudflare/migrations/0000_initial_schema.sql
   ```

#### KV Namespace

1. Create a KV namespace:
   ```bash
   wrangler kv:namespace create HEALTHCHAT_KV
   ```

#### R2 Bucket

1. Create an R2 bucket:
   ```bash
   wrangler r2 bucket create healthchat-assets
   ```

### 3. Update Configuration

1. Open `wrangler.toml` and update the resource IDs:
   - Replace `KV_NAMESPACE_ID_HERE` with your KV namespace ID
   - Replace `D1_DATABASE_ID_HERE` with your D1 database ID

2. Add your secret environment variables:
   ```bash
   wrangler secret put JWT_SECRET
   wrangler secret put OPENAI_API_KEY
   ```

### 4. Deploy the Worker

1. Deploy the worker to Cloudflare:
   ```bash
   wrangler publish
   ```

## Custom Domain Setup (Optional)

If you want to use a custom domain (e.g., api.yourdomain.com):

1. Add your domain to Cloudflare's DNS management
2. Create a new Worker route in the Cloudflare dashboard:
   - Pattern: `api.yourdomain.com/*`
   - Worker: `healthchat-api`

3. Update the `wrangler.toml` file with your domain:
   ```toml
   [routes]
   pattern = "api.yourdomain.com/*"
   zone_name = "yourdomain.com"
   ```

## Environment Variables

The application requires the following environment variables:

- `JWT_SECRET`: Secret key for JWT token generation and verification
- `OPENAI_API_KEY`: Your OpenAI API key for chat functionality

## Testing Your Deployment

1. Test the authentication endpoint:
   ```bash
   curl https://healthchat-api.yourdomain.workers.dev/api/auth/login \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"password"}'
   ```

2. Test the widget script endpoint:
   ```bash
   curl https://healthchat-api.yourdomain.workers.dev/api/widget/1.js
   ```

## Resource Limits and Scaling

Be aware of Cloudflare's resource limits for different plan tiers:

- **Workers**: 100,000 requests/day on the free plan
- **KV**: 100,000 reads/day and 1,000 writes/day on the free plan
- **R2**: 10GB storage free per month
- **D1**: Currently in beta, limits may apply

Consider upgrading to paid plans for production deployments with higher traffic.

## Monitoring and Logs

View logs and monitor your worker using Cloudflare dashboard:

1. Go to Workers & Pages section in the Cloudflare dashboard
2. Select your worker (`healthchat-api`)
3. Click on "Logs" to view recent requests and errors

## Troubleshooting

- If your worker fails to deploy, check the error message in the Wrangler output
- Ensure all required environment variables are set
- Verify that your Cloudflare account has the necessary permissions
- Check the syntax in your `wrangler.toml` file

For more detailed information, refer to the Cloudflare Workers documentation at [developers.cloudflare.com/workers](https://developers.cloudflare.com/workers/).