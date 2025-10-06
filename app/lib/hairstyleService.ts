// import { GoogleGenerativeAI, Part } from "@google/generative-ai";
// import mime from "mime-types";

// // Ensure the API key is set in your environment variables
// if (!process.env.GEMINI_API_KEY) {
//   throw new Error("GEMINI_API_KEY environment variable is not set.");
// }

// const apiKey = process.env.GEMINI_API_KEY;
// console.log('Using Gemini API Key:', apiKey);
// const genAI = new GoogleGenerativeAI(apiKey);

// /**
//  * Converts a Buffer to a GoogleGenerativeAI.Part object for the API call.
//  * @param {Buffer} buffer - The image data buffer.
//  * @param {string} mimeType - The MIME type of the image (e.g., 'image/png').
//  * @returns {Part} A Part object with inlineData.
//  */
// function bufferToGenerativePart(buffer: Buffer, mimeType: string): Part {
//   return {
//     inlineData: {
//       data: buffer.toString("base64"),
//       mimeType,
//     },
//   } as Part;
// }

// /**
//  * The main function to perform the hairstyle transfer.
//  * It orchestrates the two-step process: description and synthesis.
//  *
//  * @param {Buffer} styleImageBuffer - The buffer of the image with the desired hairstyle.
//  * @param {string} styleImageMimeType - The MIME type of the style image.
//  * @param {Buffer} personImageBuffer - The buffer of the user's image.
//  * @param {string} personImageMimeType - The MIME type of the person's image.
//  * @returns {Promise<{ success: true; imageBase64: string; mimeType: string } | { success: false; error: string }>}
//  * An object containing the resulting image data or an error message.
//  */
// export async function performHairstyleTransfer(
//   styleImageBuffer: Buffer,
//   styleImageMimeType: string,
//   personImageBuffer: Buffer,
//   personImageMimeType: string
// ) {
//   try {
//     // --- STEP 1: Generate Hairstyle Description ---
//     console.log("Step 1: Generating hairstyle description from style image...");
//     const descriptionModel = genAI.getGenerativeModel({ 
//       model: "gemini-2.5-flash-image-preview",
//       generationConfig: {
//         temperature: 0.8 // Default temperature for creativity
//       }
//     });

//     const descriptionPromptParts: Part[] = [
//       bufferToGenerativePart(styleImageBuffer, styleImageMimeType),
//       { text: `Write a prompt, don't generate any image.
// Your job is to help AI to copy the hairstyle/haircut with the help of prompt.
// Analyze the hairstyle in the provided image. Generate a highly detailed, descriptive text prompt suitable for an advanced image generation AI. This prompt should meticulously capture all key attributes of the hairstyle, including:

// 1.  **Overall Shape and Silhouette:** Describe the general form and outline of the hair on the head (e.g., rounded, tapered, voluminous, flat on top, swept back, side part, no part).
// 2.  **Length and Distribution:** Specify hair length at the top, sides, and back. Note how the length transitions.
// 3.  **Texture and Curl Pattern:** Detail the hair's natural texture (e.g., straight, wavy, curly, coily, frizzy) and, if applicable, the specific type and tightness of curls or waves. Mention its natural body or lack thereof.
// 4.  **Volume and Lift:** Indicate where the hair has volume (e.g., at the crown, all over, minimal) and how it achieves that lift.
// 5.  **Styling Elements:** Describe any specific styling (e.g., messy, sleek, combed, finger-combed, swept, tousled, structured, gelled).
// 6.  **Hairline and Edges:** Describe how the hair meets the forehead, temples, and neck (e.g., faded, sharp, natural, messy fringe).
// 7.  **Key Defining Features:** Highlight any unique or prominent characteristics that define this particular haircut or style.

// The description should be purely observational and objective, avoiding subjective terms where possible. It must be specific enough that an AI, using *only* this description, could accurately reproduce the same hairstyle on a different person, ensuring the cut and style are applied in the same fashion and proportions relative to a human head.

// Important: Do not generate an image. Provide only the detailed textual description, formatted as a direct prompt for an image generation system.`
//       },
//     ];

//     const descriptionResult = await descriptionModel.generateContent({
//         contents: [{ role: "user", parts: descriptionPromptParts }],
//     });
//     const hairstyleDescription = descriptionResult.response.text();

//     if (!hairstyleDescription || hairstyleDescription.trim() === "") {
//       console.error("Failed to generate a valid hairstyle description.");
//       return { success: false, error: "Could not generate hairstyle description from the provided style image." } as const;
//     }
//     console.log("Generated Hairstyle Description:", hairstyleDescription);

//     // --- STEP 2: Apply Hairstyle to Person's Image ---
//     console.log("\nStep 2: Applying new hairstyle to the person's image...");
//     const synthesisModel = genAI.getGenerativeModel({ 
//       model: "gemini-2.5-flash-image-preview",
//       generationConfig: {
//         temperature: 1.0 // Default temperature for creativity
//       }
//     });

//     const synthesisPromptParts: Part[] = [
//       bufferToGenerativePart(personImageBuffer, personImageMimeType),
//       { text: `Transform the hairstyle of the person in the provided image. The new hairstyle must precisely match the characteristics detailed in the "Hairstyle Description" provided below.

// **Strict Application Guidelines:**

// 1.  **Full Hairstyle Transfer:** Apply the described hairstyle, including its exact shape, length, volume, and crucially, its specific texture and curl/wave pattern, onto the person's head.
// 2.  **Preserve Facial Identity:** Maintain the original facial features, skin tone, head shape, and all other non-hair-related aspects of the person in the image. Do not alter their identity.
// 3.  **Seamless Integration:** The new hairstyle must be seamlessly integrated. Ensure a natural-looking hairline, realistic hair flow, and appropriate layering that makes the hairstyle appear genuinely part of the person.
// 4.  **Match Environmental Lighting:** The lighting, shadows, and highlights on the new hairstyle must precisely match the existing ambient and directional lighting conditions present in the original image. The hair should look naturally lit within the scene.
// 5.  **Maintain Original Hair Color:** While adopting the new shape and texture, use the *original hair color* of the person from the input image. Do not introduce a different hair color from the description or any external source.
// 6.  **Realistic Fit:** The hairstyle should fit the person's head proportionally and naturally, as if they had just received that specific haircut and styling.
//       Hairstyle Description:
//       ${hairstyleDescription}`
//       },
//     ];

//     const imageResult = await synthesisModel.generateContent({
//         contents: [{ role: "user", parts: synthesisPromptParts }],
//     });
    
//     // Find the part of the response that contains the image data.
//     const imagePart = imageResult.response.candidates?.[0]?.content?.parts?.find((part: any) => (part as Part).inlineData);

//     if (imagePart && (imagePart as any).inlineData) {
//       console.log("Successfully generated the final image.");
//       return {
//         success: true as const,
//         imageBase64: (imagePart as any).inlineData.data,
//         mimeType: (imagePart as any).inlineData.mimeType,
//       };
//     } else {
//       console.error("The API response did not contain an image.", JSON.stringify(imageResult.response, null, 2));
//       return { success: false as const, error: "Failed to generate the new hairstyle image." };
//     }

//   } catch (error) {
//     console.error("An unexpected error occurred during the hairstyle transfer process:", error);
//     return { success: false as const, error: "An internal server error occurred." };
//   }
// }





import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import mime from "mime-types";

// --- START: Added Retry Utility ---

/**
 * Configuration options for the retry mechanism.
 */
interface RetryOptions {
  /** The maximum number of retries before giving up. Defaults to 5. */
  maxRetries?: number;
  /** The base delay in milliseconds for the first retry. Defaults to 1000ms. */
  initialDelay?: number;
  /** * A function to determine if a retry should be attempted based on the error.
   * Defaults to retrying on any error. It's best to customize this to only
   * retry on specific, transient error codes (e.g., 503, 500).
   */
  shouldRetry?: (error: any) => boolean;
}

/**
 * A utility function to retry a promise-based function with exponential backoff and jitter.
 * This is essential for handling transient errors (like 503 Service Unavailable) from external APIs.
 *
 * @param {() => Promise<T>} fn - The asynchronous function to retry. It must return a promise.
 * @param {RetryOptions} [options={}] - Configuration options for the retry mechanism.
 * @returns {Promise<T>} - A promise that resolves with the result of `fn` if it succeeds, or rejects if it fails after all retries.
 */
async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxRetries = 5,
    initialDelay = 1000, // 1 second
    shouldRetry = (err: any) => true // Default to retrying on any error
  } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Attempt to execute the provided asynchronous function.
      return await fn();
    } catch (error: any) {
      // If we've reached the max number of retries or the error is not retryable, throw the error.
      if (attempt === maxRetries || !shouldRetry(error)) {
        console.error(`Final attempt failed or error is not retryable. No more retries. Error: ${error.message}`);
        
        // Check if it's a 503 Service Unavailable error after max retries
        if (error.message?.includes('503') || error.message?.includes('Service Unavailable')) {
          // Create a custom error with user-friendly message
          const customError = new Error('SERVICE_UNAVAILABLE_AFTER_RETRIES');
          (customError as any).userMessage = "Patience, gorgeous. A perfect hairstyle is worth a short wait. We're currently styling at full capacity, so please try again.";
          (customError as any).userSubMessage = "if fails again, please try again later";
          throw customError;
        }
        
        throw error;
      }

      // Calculate the exponential backoff delay with jitter.
      const exponentialDelay = initialDelay * Math.pow(2, attempt);
      const jitter = Math.random() * exponentialDelay;
      const totalDelay = exponentialDelay + jitter;

      console.log(
        `Attempt ${attempt + 1} failed. Retrying in ${Math.round(totalDelay)}ms... Error: ${error.message}`
      );

      // Wait for the calculated delay before the next attempt.
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  // This line should theoretically never be reached, but it satisfies TypeScript's need for a return path.
  throw new Error("Retry logic failed unexpectedly.");
}

// --- END: Added Retry Utility ---


// Ensure the API key is set in your environment variables
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const apiKey = process.env.GEMINI_API_KEY;
console.log('Using Gemini API Key:', apiKey);
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Converts a Buffer to a GoogleGenerativeAI.Part object for the API call.
 * @param {Buffer} buffer - The image data buffer.
 * @param {string} mimeType - The MIME type of the image (e.g., 'image/png').
 * @returns {Part} A Part object with inlineData.
 */
function bufferToGenerativePart(buffer: Buffer, mimeType: string): Part {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  } as Part;
}

/**
 * The main function to perform the hairstyle transfer.
 * It orchestrates the two-step process: description and synthesis.
 *
 * @param {Buffer} styleImageBuffer - The buffer of the image with the desired hairstyle.
 * @param {string} styleImageMimeType - The MIME type of the style image.
 * @param {Buffer} personImageBuffer - The buffer of the user's image.
 * @param {string} personImageMimeType - The MIME type of the person's image.
 * @returns {Promise<{ success: true; imageBase64: string; mimeType: string } | { success: false; error: string }>}
 * An object containing the resulting image data or an error message.
 */
export async function performHairstyleTransfer(
  styleImageBuffer: Buffer,
  styleImageMimeType: string,
  personImageBuffer: Buffer,
  personImageMimeType: string
) {
  try {
    // --- STEP 1: Generate Hairstyle Description ---
    console.log("Step 1: Generating hairstyle description from style image...");
    const descriptionModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image-preview",
      generationConfig: {
        temperature: 0.6
      }
    });

    const descriptionPromptParts: Part[] = [
      bufferToGenerativePart(styleImageBuffer, styleImageMimeType),
      { text: `Write a prompt, don't generate any image.
Your job is to help AI to copy the hairstyle/haircut with the help of prompt.
Analyze the hairstyle in the provided image. Generate a highly detailed, descriptive text prompt suitable for an advanced image generation AI. This prompt should meticulously capture all key attributes of the hairstyle, including:

1.  **Overall Shape and Silhouette:** Describe the general form and outline of the hair on the head (e.g., rounded, tapered, voluminous, flat on top, swept back, side part, no part).
2.  **Length and Distribution:** Specify hair length at the top, sides, and back. Note how the length transitions.
3.  **Texture and Curl Pattern:** Detail the hair's natural texture (e.g., straight, wavy, curly, coily, frizzy) and, if applicable, the specific type and tightness of curls or waves. Mention its natural body or lack thereof.
4.  **Volume and Lift:** Indicate where the hair has volume (e.g., at the crown, all over, minimal) and how it achieves that lift.
5.  **Styling Elements:** Describe any specific styling (e.g., messy, sleek, combed, finger-combed, swept, tousled, structured, gelled).
6.  **Hairline and Edges:** Describe how the hair meets the forehead, temples, and neck (e.g., faded, sharp, natural, messy fringe).
7.  **Key Defining Features:** Highlight any unique or prominent characteristics that define this particular haircut or style.

The description should be purely observational and objective, avoiding subjective terms where possible. It must be specific enough that an AI, using *only* this description, could accurately reproduce the same hairstyle on a different person, ensuring the cut and style are applied in the same fashion and proportions relative to a human head.

Important: Do not generate an image. Provide only the detailed textual description, formatted as a direct prompt for an image generation system.`
      },
    ];

    // --- MODIFICATION: Wrapped the API call with retry logic ---
    const descriptionApiCall = () => descriptionModel.generateContent({
        contents: [{ role: "user", parts: descriptionPromptParts }],
    });
    const descriptionResult = await retryWithBackoff(descriptionApiCall);
    const hairstyleDescription = descriptionResult.response.text();

    if (!hairstyleDescription || hairstyleDescription.trim() === "") {
      console.error("Failed to generate a valid hairstyle description.");
      return { success: false, error: "Could not generate hairstyle description from the provided style image." } as const;
    }
    console.log("Generated Hairstyle Description:", hairstyleDescription);

    // --- STEP 2: Apply Hairstyle to Person's Image ---
    console.log("\nStep 2: Applying new hairstyle to the person's image...");
    const synthesisModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image-preview",
      generationConfig: {
        temperature: 1.0
      }
    });

    const synthesisPromptParts: Part[] = [
      bufferToGenerativePart(personImageBuffer, personImageMimeType),
      { text: `Transform the hairstyle of the person in the provided image. The new hairstyle must precisely match the characteristics detailed in the "Hairstyle Description" provided below.

**Strict Application Guidelines:**

1.  **Full Hairstyle Transfer:** Apply the described hairstyle, including its exact shape, length, volume, and crucially, its specific texture and curl/wave pattern, onto the person's head.
2.  **Preserve Facial Identity:** Maintain the original facial features, skin tone, head shape, and all other non-hair-related aspects of the person in the image. Do not alter their identity.
3.  **Seamless Integration:** The new hairstyle must be seamlessly integrated. Ensure a natural-looking hairline, realistic hair flow, and appropriate layering that makes the hairstyle appear genuinely part of the person.
4.  **Match Environmental Lighting:** The lighting, shadows, and highlights on the new hairstyle must precisely match the existing ambient and directional lighting conditions present in the original image. The hair should look naturally lit within the scene.
5.  **Maintain Original Hair Color:** While adopting the new shape and texture, use the *original hair color* of the person from the input image. Do not introduce a different hair color from the description or any external source.
6.  **Realistic Fit:** The hairstyle should fit the person's head proportionally and naturally, as if they had just received that specific haircut and styling.
      Hairstyle Description:
      ${hairstyleDescription}`
      },
    ];
    
    // --- MODIFICATION: Wrapped the second API call with retry logic as well ---
    const synthesisApiCall = () => synthesisModel.generateContent({
        contents: [{ role: "user", parts: synthesisPromptParts }],
    });
    const imageResult = await retryWithBackoff(synthesisApiCall);
    
    // Find the part of the response that contains the image data.
    const imagePart = imageResult.response.candidates?.[0]?.content?.parts?.find((part: any) => (part as Part).inlineData);

    if (imagePart && (imagePart as any).inlineData) {
      console.log("Successfully generated the final image.");
      return {
        success: true as const,
        imageBase64: (imagePart as any).inlineData.data,
        mimeType: (imagePart as any).inlineData.mimeType,
      };
    } else {
      console.error("The API response did not contain an image.", JSON.stringify(imageResult.response, null, 2));
      return { success: false as const, error: "Failed to generate the new hairstyle image." };
    }

  } catch (error: any) {
    console.error("An unexpected error occurred during the hairstyle transfer process:", error);
    
    // Check if it's our custom error with user-friendly message
    if (error.message === 'SERVICE_UNAVAILABLE_AFTER_RETRIES') {
      return { 
        success: false as const, 
        error: error.userMessage,
        userSubMessage: error.userSubMessage
      };
    }
    
    return { success: false as const, error: "An internal server error occurred." };
  }
}

