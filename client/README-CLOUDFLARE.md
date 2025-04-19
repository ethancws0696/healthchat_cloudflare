# Deploying to Cloudflare Pages

This guide will help you deploy the HealthChat frontend to Cloudflare Pages, taking advantage of Cloudflare's global CDN and integrated Cloudflare Workers for the API.

## Prerequisites

1. A [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. Git repository with your code (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Connect Your Repository to Cloudflare Pages

- Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
- Navigate to "Pages" from the sidebar
- Click "Create a project" > "Connect to Git"
- Select your Git provider and authorize Cloudflare
- Select the repository containing this project

### 2. Configure the Project

When configuring the project in Cloudflare Pages interface:

- **Project name**: Choose a name (e.g., "healthchat")
- **Production branch**: Select your main branch
- **Build command**: `cd .. && npm run build`
- **Build output directory**: `dist/public`
- **Root directory**: `client` (or leave blank and use the _build-config.json)

### 3. Environment Variables

Add the following environment variables:

- `VITE_APP_ENV`: Set to `production`
- `NODE_VERSION`: Set to `18` (or your preferred Node.js version)

### 4. Advanced Settings

- Click "Save and Deploy"
- Wait for the build and deployment to complete

## Post-Deployment

After deployment:

1. Cloudflare Pages will provide you with a URL (e.g., `your-project.pages.dev`)
2. Test the application by visiting this URL
3. If you have a custom domain, you can configure it in the Cloudflare Pages project settings

## Handling MIME Types

The project includes several configuration files to ensure proper MIME types for JavaScript modules:

- `_headers`: Sets Content-Type headers for various file extensions
- `_routes.json`: Configures routing and additional headers
- `functions/_middleware.js`: Processes responses to set proper MIME types

## Connecting to the API

For a complete solution:

1. Deploy the API to Cloudflare Workers
2. Update the `client/src/config.ts` file with your Cloudflare Workers URL
3. Ensure CORS is properly configured on your Cloudflare Workers API

## Troubleshooting

- **MIME Type Issues**: Check the Network tab in browser DevTools to verify proper Content-Type headers
- **Build Failures**: Check the build logs in Cloudflare Pages for error messages
- **API Connection**: Verify CORS headers are properly set in your Cloudflare Workers API
- **404 Errors**: The `_routes.json` configuration includes a rewrite rule to handle client-side routing

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Deploying a Vite site to Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite-site/)
- [Using Functions with Pages](https://developers.cloudflare.com/pages/platform/functions/)
- [Custom Domains for Pages](https://developers.cloudflare.com/pages/platform/custom-domains/)