/**
 * Helper functions for handling R2 storage operations
 */

/**
 * Upload a file to R2 storage
 * @param {Request} request - The incoming request with the file
 * @param {Object} env - Environment variables including R2 bucket binding
 * @param {string} key - The key/filename to use for storage (or generate one)
 * @returns {Promise<Object>} - Response with the URL of the uploaded file
 */
export async function uploadToR2(request, env, key = null) {
  try {
    // Get the binary data from the request
    const fileData = await request.arrayBuffer();
    
    if (!fileData || fileData.byteLength === 0) {
      return {
        success: false,
        error: 'No file data provided',
        status: 400
      };
    }
    
    // Get content type from the request
    const contentType = request.headers.get('content-type') || 'application/octet-stream';
    
    // If no key is provided, generate a unique one based on timestamp and random string
    if (!key) {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = getFileExtensionFromContentType(contentType);
      key = `uploads/${timestamp}-${randomString}${fileExtension}`;
    }
    
    // Upload the file to R2
    await env.HEALTHCHAT_ASSETS.put(key, fileData, {
      httpMetadata: {
        contentType: contentType
      }
    });
    
    // Return success with the file URL
    return {
      success: true,
      key: key,
      url: `https://api.healthchat.ai/assets/${key}`,
      status: 200
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    
    return {
      success: false,
      error: 'Failed to upload file',
      status: 500
    };
  }
}

/**
 * Get a file from R2 storage
 * @param {string} key - The key/filename to retrieve
 * @param {Object} env - Environment variables including R2 bucket binding
 * @returns {Promise<Response>} - Response with the file or error
 */
export async function getFromR2(key, env) {
  try {
    // Get the object from R2
    const object = await env.HEALTHCHAT_ASSETS.get(key);
    
    if (!object) {
      return new Response('File not found', { status: 404 });
    }
    
    // Determine content type based on file extension
    let contentType = object.httpMetadata?.contentType || 'application/octet-stream';
    
    // Return the file with appropriate headers
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('R2 retrieval error:', error);
    return new Response('Error retrieving file', { status: 500 });
  }
}

/**
 * Delete a file from R2 storage
 * @param {string} key - The key/filename to delete
 * @param {Object} env - Environment variables including R2 bucket binding
 * @returns {Promise<Object>} - Response indicating success or failure
 */
export async function deleteFromR2(key, env) {
  try {
    // Delete the object from R2
    await env.HEALTHCHAT_ASSETS.delete(key);
    
    return {
      success: true,
      message: 'File deleted successfully',
      status: 200
    };
  } catch (error) {
    console.error('R2 deletion error:', error);
    
    return {
      success: false,
      error: 'Failed to delete file',
      status: 500
    };
  }
}

/**
 * Helper function to determine file extension from content type
 * @param {string} contentType - The MIME type of the file
 * @returns {string} - The appropriate file extension including the dot
 */
function getFileExtensionFromContentType(contentType) {
  const contentTypeMap = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'text/csv': '.csv',
    'application/json': '.json',
    'application/javascript': '.js',
    'text/css': '.css',
    'text/html': '.html'
  };
  
  return contentTypeMap[contentType] || '';
}

/**
 * List all files in an R2 bucket or a specific prefix
 * @param {Object} env - Environment variables including R2 bucket binding
 * @param {string} prefix - Optional prefix to filter results
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Object>} - Response with the list of files
 */
export async function listFilesInR2(env, prefix = '', limit = 100) {
  try {
    // List objects in the bucket
    const listed = await env.HEALTHCHAT_ASSETS.list({
      prefix: prefix,
      limit: limit
    });
    
    // Format the response
    const files = listed.objects.map(object => ({
      key: object.key,
      size: object.size,
      uploaded: object.uploaded,
      type: object.httpMetadata?.contentType || 'application/octet-stream',
      url: `https://api.healthchat.ai/assets/${object.key}`
    }));
    
    return {
      success: true,
      files: files,
      truncated: listed.truncated,
      status: 200
    };
  } catch (error) {
    console.error('R2 list error:', error);
    
    return {
      success: false,
      error: 'Failed to list files',
      status: 500
    };
  }
}