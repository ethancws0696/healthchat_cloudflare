/**
 * Website scraping utilities for extracting healthcare provider information
 */

/**
 * Scrape a website for content
 * @param {string} url - The URL to scrape
 * @returns {Promise<string>} - The extracted content
 */
export async function scrapeWebsite(url) {
  try {
    // Validate the URL
    const parsedUrl = new URL(url);
    
    // Check if URL is valid
    if (!parsedUrl.hostname) {
      throw new Error('Invalid URL');
    }
    
    // Fetch the website content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HealthChat Scraper/1.0 (compatible)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extract and clean content
    return extractContentFromHtml(html);
  } catch (error) {
    console.error('Website scraping error:', error);
    throw new Error(`Failed to scrape website: ${error.message}`);
  }
}

/**
 * Extract meaningful content from HTML
 * @param {string} html - Raw HTML content
 * @returns {string} - Cleaned text content
 */
function extractContentFromHtml(html) {
  try {
    // In a Cloudflare worker, we don't have access to DOM APIs like document
    // So we'll use regex and string manipulation to extract content
    
    // Simple regex to remove script and style tags and their content
    let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    
    // Extract text from HTML tags
    content = content.replace(/<\/(?:p|div|h[1-6]|li|td|th)>/gi, '\n');
    content = content.replace(/<br\s*\/?>/gi, '\n');
    content = content.replace(/<[^>]*>/g, ' ');
    
    // Decode HTML entities
    content = decodeHtmlEntities(content);
    
    // Clean up whitespace
    content = content.replace(/\s+/g, ' ');
    content = content.replace(/\n\s*\n/g, '\n');
    content = content.trim();
    
    return content;
  } catch (error) {
    console.error('HTML extraction error:', error);
    return 'Failed to extract content from HTML';
  }
}

/**
 * Decode HTML entities in text
 * @param {string} text - Text with HTML entities
 * @returns {string} - Decoded text
 */
function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };
  
  // Replace known entities
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, match => entities[match]);
}

/**
 * Extract key healthcare information from raw content
 * This function doesn't use OpenAI, it's a simplified extraction for basic information
 * @param {string} content - Raw website content
 * @returns {Object} - Structured healthcare information
 */
export function basicExtractHealthcareInfo(content) {
  // Initialize result object
  const result = {
    services: [],
    locations: [],
    insurance: [],
    intake: null,
    contact: {
      phone: null,
      email: null,
      hours: null
    }
  };
  
  // Extract services (look for common healthcare service terms)
  const serviceTerms = [
    'primary care', 'pediatrics', 'family medicine', 'internal medicine',
    'cardiology', 'dermatology', 'neurology', 'orthopedics', 'gynecology',
    'obstetrics', 'psychiatry', 'psychology', 'therapy', 'physical therapy',
    'dental', 'optometry', 'urgent care', 'emergency', 'radiology', 'laboratory',
    'allergy', 'immunology', 'endocrinology', 'gastroenterology', 'oncology',
    'rheumatology', 'urology', 'ent', 'pulmonology', 'nutrition'
  ];
  
  // Look for services in content
  serviceTerms.forEach(service => {
    if (content.toLowerCase().includes(service)) {
      // Capitalize first letter of each word
      result.services.push(
        service.replace(/\b\w/g, c => c.toUpperCase())
      );
    }
  });
  
  // Extract phone numbers
  const phoneRegex = /(?:Phone|Tel|Call)[:\s]+(?:\+?1[-\s]?)?(?:\(?\d{3}\)?[-\s]?)?\d{3}[-\s]?\d{4}/gi;
  const phoneMatches = content.match(phoneRegex);
  
  if (phoneMatches && phoneMatches.length > 0) {
    // Extract just the digits from the first match
    const digits = phoneMatches[0].replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX if it's a 10-digit number
    if (digits.length === 10) {
      result.contact.phone = `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    } else {
      result.contact.phone = digits;
    }
  }
  
  // Extract email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = content.match(emailRegex);
  
  if (emailMatches && emailMatches.length > 0) {
    result.contact.email = emailMatches[0];
  }
  
  // Extract hours (simplified)
  const hoursRegex = /(?:hours|open|we are open)(?:[\s:]*)((?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)[\s\S]*?)(?:\.|\n)/i;
  const hoursMatch = content.match(hoursRegex);
  
  if (hoursMatch && hoursMatch[1]) {
    result.contact.hours = hoursMatch[1].trim();
  }
  
  // Extract address (simplified)
  const addressRegex = /\d+\s+[a-zA-Z\s,]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|parkway|pkwy|square|sq|highway|hwy|route|rt)[,\s]+[a-zA-Z\s]+(?:,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?)?/i;
  const addressMatch = content.match(addressRegex);
  
  if (addressMatch && addressMatch[0]) {
    const address = addressMatch[0].trim();
    result.locations.push({
      name: 'Main Office', // Default name
      address: address,
      serviceArea: null
    });
  }
  
  // Extract insurance information (simplified)
  const insuranceTerms = [
    'aetna', 'blue cross', 'blue shield', 'cigna', 'humana', 'medicare',
    'medicaid', 'tricare', 'united healthcare', 'unitedhealthcare', 'oxford',
    'empire', 'kaiser', 'healthcare', 'health plan', 'insurance'
  ];
  
  // Try to find paragraphs about insurance
  const insuranceParagraphRegex = /(?:(?:we|our office) (?:accept|takes|work with)[\s\S]*?insurance|accepted insurance(?:s)?|insurance(?:s)? accepted|in-network (?:provider|insurance))[\s\S]*?(?:\.|\n)/i;
  const insuranceParagraph = content.match(insuranceParagraphRegex);
  
  if (insuranceParagraph && insuranceParagraph[0]) {
    // Look for specific insurance terms in the paragraph
    insuranceTerms.forEach(insurance => {
      if (insuranceParagraph[0].toLowerCase().includes(insurance)) {
        // Add insurance with proper capitalization
        result.insurance.push(
          insurance.replace(/\b\w/g, c => c.toUpperCase())
        );
      }
    });
  }
  
  // If no insurance found in a dedicated paragraph, look throughout the content
  if (result.insurance.length === 0) {
    insuranceTerms.forEach(insurance => {
      if (content.toLowerCase().includes(insurance)) {
        // Add insurance with proper capitalization
        result.insurance.push(
          insurance.replace(/\b\w/g, c => c.toUpperCase())
        );
      }
    });
  }
  
  // Extract intake information (simplified)
  const intakeRegex = /(?:new patients|intake process|to schedule|appointment|scheduling)[\s\S]*?(?:\.|\n)/i;
  const intakeMatch = content.match(intakeRegex);
  
  if (intakeMatch && intakeMatch[0]) {
    result.intake = intakeMatch[0].trim();
  }
  
  return result;
}