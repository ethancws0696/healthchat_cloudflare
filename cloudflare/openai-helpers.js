/**
 * Helper functions for interacting with OpenAI API
 */

import { OpenAI } from "openai";

/**
 * Generate system prompt for the AI based on provider profile
 * @param {Object} profile - Provider profile object
 * @returns {string} - Generated system prompt
 */
export function generateSystemPrompt(profile) {
  // Default values if profile is incomplete
  const services = profile.services || [];
  const locations = profile.locations || [];
  const insurance = profile.insurance || [];
  const contact = profile.contact || { phone: "", email: "" };
  const customRules = profile.customRules || null;

  let prompt = `You are an AI assistant for a healthcare provider. You are helping potential patients learn about the services offered and schedule appointments.

About the healthcare provider:
- Services offered: ${services.join(", ")}
- Locations: ${locations.map((loc) => `${loc.name} (${loc.address})`).join(", ")}
- Insurance accepted: ${insurance.join(", ")}
- Intake process: ${profile.intake || "Contact us for details."}
- Contact information: Phone: ${contact.phone}, Email: ${contact.email}${contact.hours ? `, Hours: ${contact.hours}` : ""}

Your role is to be helpful, informative, and respectful. You should:
1. Answer questions about services, locations, and insurance.
2. Help users understand if their needs match what the provider offers.
3. Always try to gather information from potential patients to qualify them as leads (name, Phone, Email, healthcare needs) so that our team can reach out to you with more details.
4. Encourage contacting the provider or scheduling an appointment for serious medical concerns.

Important rules:
- Never provide medical advice or diagnoses.
- Do not discuss pricing unless the provider has given specific information.
- Clearly state when you don't have specific information and direct users to contact the provider.
- Be compassionate but professional when discussing health concerns.
- Respect patient privacy and do not ask for unnecessary personal details.
`;

  // Add custom rules if available
  if (customRules) {
    prompt += "\nSpecial considerations:\n";

    if (
      customRules.excludedLocations &&
      customRules.excludedLocations.length > 0
    ) {
      prompt += `- The following locations are excluded or have limited services: ${customRules.excludedLocations.join(", ")}\n`;
    }

    if (
      customRules.specialRequirements &&
      customRules.specialRequirements.length > 0
    ) {
      prompt += `- Special requirements: ${customRules.specialRequirements.join(", ")}\n`;
    }

    if (customRules.ageRestrictions) {
      prompt += `- Age restrictions: ${customRules.ageRestrictions}\n`;
    }

    if (customRules.patientTypes && customRules.patientTypes.length > 0) {
      prompt += `- Patient types served: ${customRules.patientTypes.join(", ")}\n`;
    }

    if (customRules.notes) {
      prompt += `- Additional notes: ${customRules.notes}\n`;
    }
  }

  // Add information from the scanned website if available
  if (profile.rawContent) {
    prompt += `\nAdditional information from the provider's website:\n${profile.rawContent}\n`;
  }

  return prompt;
}

/**
 * Extract lead information from conversation messages
 * @param {Array} messages - Array of conversation messages
 * @param {Object} env - Environment variables including OPENAI_API_KEY
 * @returns {Promise<Object>} - Extracted lead information
 */
export async function extractLeadInfo(messages, env) {
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    // Get all message content
    const messageContent = messages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n\n");

    // Create system prompt for extraction
    const systemPrompt = `
      You are an assistant that extracts potential lead information from conversations.
      Extract the following information if available:
      - name: The person's full name
      - email: Their email address
      - phone: Their phone number
      - interest: What healthcare services they're interested in
      
      Return the information in a JSON format with these fields. If a field is not found, use null.
      Only include these exact fields in your response.
    `;

    // Make API call
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: messageContent },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    // Parse response
    try {
      const extractedInfo = JSON.parse(response.choices[0].message.content);

      return {
        name: extractedInfo.name || null,
        email: extractedInfo.email || null,
        phone: extractedInfo.phone || null,
        interest: extractedInfo.interest || null,
      };
    } catch (parseError) {
      console.error("Error parsing lead extraction result:", parseError);

      // Fallback with simple extraction
      return simpleLeadExtraction(messageContent);
    }
  } catch (error) {
    console.error("OpenAI lead extraction error:", error);

    // Fallback with simple extraction
    return simpleLeadExtraction(messageContent);
  }
}

/**
 * Simple lead extraction as fallback
 * @param {string} messageContent - Combined message content
 * @returns {Object} - Extracted lead information
 */
function simpleLeadExtraction(messageContent) {
  // Basic regex patterns for extraction
  const nameMatch = messageContent.match(
    /\b(?:my name is|i am|i'm) (\w+(?:\s\w+)?)/i,
  );
  const emailMatch = messageContent.match(
    /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i,
  );
  const phoneMatch = messageContent.match(
    /(\d{3}[-.\s]??\d{3}[-.\s]??\d{4}|\(\d{3}\)\s*\d{3}[-.\s]??\d{4}|\d{3}[-.\s]??\d{4})/i,
  );

  return {
    name: nameMatch ? nameMatch[1] : null,
    email: emailMatch ? emailMatch[1] : null,
    phone: phoneMatch ? phoneMatch[1] : null,
    interest: null,
  };
}

/**
 * Process chat message with OpenAI
 * @param {Array} messages - Array of chat messages
 * @param {string} systemPrompt - System prompt for context
 * @param {Object} env - Environment variables including OPENAI_API_KEY
 * @returns {Promise<string>} - AI response text
 */
export async function processChat(messages, systemPrompt, env) {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  try {
    // Prepare messages for OpenAI API
    const openaiMessages = [{ role: "system", content: systemPrompt }];

    // Add conversation messages (limit to last 10 for context)
    const pastMessages = messages.slice(-10);

    for (const msg of pastMessages) {
      openaiMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Make API call
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI chat processing error:", error);
    throw new Error("Failed to generate AI response");
  }
}

/**
 * Process website content to extract healthcare information
 * @param {string} websiteContent - Raw content from the website
 * @param {Object} env - Environment variables including OPENAI_API_KEY
 * @returns {Promise<Object>} - Structured healthcare information
 */
export async function processWebsiteContent(websiteContent, env) {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  try {
    // Create system prompt for extraction
    const systemPrompt = `
      You are an AI that analyzes healthcare provider websites.
      Extract the following information in a structured format:
      - services: Array of healthcare services offered
      - locations: Array of location objects with name, address, and serviceArea properties
      - insurance: Array of accepted insurance plans
      - intake: Description of the intake process
      - contact: Object with phone, email, and hours properties
      
      Return the information in a JSON format. If a field is not found, use an empty array or null.
    `;

    // Make API call
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: websiteContent },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    // Parse response
    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      console.error("Error parsing website content result:", parseError);

      // Return an empty structure on error
      return {
        services: [],
        locations: [],
        insurance: [],
        intake: null,
        contact: { phone: "", email: "", hours: "" },
      };
    }
  } catch (error) {
    console.error("OpenAI website processing error:", error);

    // Return an empty structure on error
    return {
      services: [],
      locations: [],
      insurance: [],
      intake: null,
      contact: { phone: "", email: "", hours: "" },
    };
  }
}
