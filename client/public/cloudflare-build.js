// This is a build hook script for Cloudflare Pages
// It ensures that proper MIME types are set for JavaScript modules

export function onRequest(context) {
  // Get the URL pathname
  const url = new URL(context.request.url);
  const path = url.pathname;
  
  // Process the response
  return context.next().then((response) => {
    const newResponse = new Response(response.body, response);
    
    // Set proper Content-Type headers based on file extension
    if (path.endsWith('.js') || path.endsWith('.mjs')) {
      newResponse.headers.set('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      newResponse.headers.set('Content-Type', 'text/css');
    } else if (path.endsWith('.svg')) {
      newResponse.headers.set('Content-Type', 'image/svg+xml');
    } else if (path.endsWith('.json')) {
      newResponse.headers.set('Content-Type', 'application/json');
    }
    
    // Add CORS headers for development
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    
    return newResponse;
  });
}