# HealthChat: AI-Powered Healthcare Chat Widget

HealthChat is a SaaS platform providing AI-powered chat widgets specifically designed for healthcare providers to streamline website visitor engagement and lead generation.

## Architecture

The platform is built with a hybrid architecture to support both local development and production deployment:

1. **Local Development**:
   - Express.js backend with TypeScript
   - React + Vite frontend
   - In-memory storage for development

2. **Production**:
   - Cloudflare Workers for serverless API
   - Cloudflare D1 database for data storage
   - Cloudflare KV for caching and small data
   - Cloudflare R2 for media storage
   - Same React frontend deployed to Cloudflare Pages

## Features

- **AI-Powered Chat**: Uses OpenAI's GPT-4o model to provide intelligent responses to healthcare queries
- **Lead Generation**: Automatically identifies potential leads through conversation analysis
- **Customizable Widget**: Configurable colors, positions, greeting messages and branding
- **Healthcare Provider Profiles**: Managed profiles with services, locations, and insurance info
- **Website Scanning**: Can scan healthcare websites to extract relevant information
- **Cross-Origin Communication**: Secure iframe-based widget with postMessage API
- **Embedding System**: Simple script tag for easy website integration

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Start development server:
   ```
   npm run dev
   ```

3. Access the application at `http://localhost:5000`

4. Demo credentials:
   - Username: `northshore`
   - Password: `password123`

## Widget Integration

To integrate the chat widget in a website, use the following script tag:

```html
<script src="https://api.healthchat.ai/api/widget/YOUR_USER_ID.js"></script>
```

Or for local development:

```html
<script src="http://localhost:5000/api/widget/1.js"></script>
```

## Cloudflare Deployment

1. Install Wrangler CLI:
   ```
   npm install -g wrangler
   ```

2. Configure your Cloudflare credentials:
   ```
   wrangler login
   ```

3. Update `wrangler.toml` with your Cloudflare account details and resource IDs

4. Deploy to Cloudflare:
   ```
   cd cloudflare
   wrangler deploy
   ```

## Environment Variables

- `OPENAI_API_KEY`: Required for AI functionality
- `JWT_SECRET`: Secret for authentication tokens
- `ENVIRONMENT`: Set to 'development' or 'production'

## Project Structure

- `client/`: Frontend React application
- `server/`: Express backend for local development
- `cloudflare/`: Cloudflare Workers scripts
- `shared/`: Shared types and schemas