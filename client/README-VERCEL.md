# Deploying to Vercel

This guide will help you deploy the HealthChat frontend to Vercel to avoid MIME type issues and take advantage of Vercel's global CDN and edge network.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. Git repository with your code (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Connect Your Repository to Vercel

- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Click "Add New" > "Project"
- Import your Git repository
- Select the repository containing this project

### 2. Configure the Project

When configuring the project in Vercel's interface:

- **Framework Preset**: Select "Vite"
- **Root Directory**: Set to `client`
- **Build Command**: Leave as default (uses the one in client/package.json)
- **Output Directory**: Leave as default (Vercel will auto-detect)

### 3. Environment Variables

Add the following environment variables:

- `VITE_APP_ENV`: Set to `production`
- `VITE_API_URL`: Set to your Cloudflare Workers API URL (e.g., `https://healthchat.ethan-c87.workers.dev`)

### 4. Deploy

Click "Deploy" and wait for the build to complete.

## Post-Deployment

After deployment:

1. Vercel will provide you with a URL (e.g., `your-project.vercel.app`)
2. Test the application by visiting this URL
3. If you have a custom domain, you can configure it in the Vercel project settings

## Troubleshooting

- **MIME Type Issues**: Vercel should correctly serve JavaScript modules with proper MIME types
- **API Connection**: Ensure CORS is properly configured on your Cloudflare Workers API
- **404 Errors**: The `vercel.json` configuration includes a rewrite rule to handle client-side routing

## Additional Resources

- [Vite on Vercel Documentation](https://vercel.com/docs/frameworks/vite)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [Custom Domains in Vercel](https://vercel.com/docs/concepts/projects/domains)