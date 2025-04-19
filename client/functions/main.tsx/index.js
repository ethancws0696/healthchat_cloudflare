// Special handler for main.tsx file
export async function onRequest(context) {
  // Let the regular handler process the request
  const response = await context.next();
  
  // Create a new response with the correct Content-Type header
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Content-Type', 'application/javascript');
  
  return newResponse;
}