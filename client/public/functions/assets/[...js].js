// Special handler for JavaScript assets
// This ensures JavaScript modules are served with the correct MIME type

export async function onRequest(context) {
  // Process the response
  const response = await context.next();

  // Clone the response to modify headers
  const newResponse = new Response(response.body, response);

  // Set JavaScript MIME type
  newResponse.headers.set("Content-Type", "application/javascript");

  return newResponse;
}
