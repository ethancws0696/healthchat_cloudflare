// Middleware for Cloudflare Pages Functions
// This ensures all JavaScript files are served with the correct MIME type

export async function onRequest(context) {
  // Process the response
  const response = await context.next();
  
  // Get the URL pathname
  const url = new URL(context.request.url);
  const path = url.pathname;
  
  // Clone the response to modify headers
  const newResponse = new Response(response.body, response);
  
  // Set proper Content-Type headers based on file extension
  if (path.endsWith('.js') || path.endsWith('.mjs') || path.endsWith('.jsx') || 
      path.endsWith('.ts') || path.endsWith('.tsx') || path === '/main.tsx') {
    newResponse.headers.set('Content-Type', 'application/javascript');
  } else if (path.endsWith('.css')) {
    newResponse.headers.set('Content-Type', 'text/css');
  } else if (path.endsWith('.svg')) {
    newResponse.headers.set('Content-Type', 'image/svg+xml');
  } else if (path.endsWith('.json')) {
    newResponse.headers.set('Content-Type', 'application/json');
  }
  
  // Add CORS headers for cross-origin requests
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  
  return newResponse;
}