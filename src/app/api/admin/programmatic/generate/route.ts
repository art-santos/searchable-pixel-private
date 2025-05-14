import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Use server client for auth check
import OpenAI from 'openai';
import { generateSlug } from '@/lib/utils'; // Assuming a utility function for slugs
import type { GenerationMode } from '@/app/main/programmatic/create/page'; // Import type

// Initialize OpenAI client
// Ensure OPENAI_API_KEY is set in your .env.local file
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Add SeoConfig type (if not imported from shared location)
interface SeoConfig { 
    seo_system_prompt?: string | null;
    seo_keywords?: string | null;
}

// Update Request Body to include generationMode and optional seoConfig
interface GenerateRequestBody {
    term: string;
    generationMode: GenerationMode; // <-- Added
    articleCount: number;
    structureOptions: {
        includeIntro: boolean;
        includeAuthoritativeLinks?: boolean;
        generateFAQ?: boolean;
    };
    seoConfig?: SeoConfig | null; // <-- Added
}

// Define the structure we expect OpenAI to return IN JSON FORMAT
// This needs to be kept simple for the AI to follow reliably.
interface OpenAIResponseFormat {
    title: string;
    introduction: string; // Renamed for clarity in prompt
    main_content: string; // Use markdown
    faq?: { question: string; answer: string }[]; // Optional based on structureOptions
    meta_description?: string;
}

// Interface specifically for polish mode output (simpler)
interface OpenAIResponseFormatPolish {
    title: string; // Title based on the polished content
    polished_content: string; // The main polished HTML output
    meta_description?: string; // Optional meta description for the polished content
}

// Define the final structure returned by our API (matching frontend)
interface GeneratedPage {
    title: string;
    slug: string;
    content_intro: string;
    content_main: string;
    content_faq?: { question: string; answer: string }[] | null;
    meta_description?: string;
}

// Add interface for the pre-processing AI response
interface PromptDecompositionResponse {
    prompts: string[];
}

// Define structure for FAQ JSON
interface FaqItem {
    question: string;
    answer: string;
}
interface FaqGenerationResponse {
    faqs: FaqItem[];
}

// Updated constructPrompt helper for 'create' and 'multiply' modes
function constructCreateMultiplyPrompt(
    singlePrompt: string, 
    structureOptions: GenerateRequestBody['structureOptions'],
    seoConfig?: SeoConfig | null
): string {
    let structureDetails = "";
    if (structureOptions.includeIntro) structureDetails += "- Include an engaging introduction section.\n";
    structureDetails += "- Use blockquote (<blockquote>) formatting for any direct quotes or key emphasized statements.\n";
    
    let linkInstruction = "";
    if (structureOptions.includeAuthoritativeLinks) {
        linkInstruction = "CRITICAL REQUIREMENT: You MUST include at least 2 valid, relevant HTML links within the main_content. Format them EXACTLY like this: <a href='https://example.com'>Descriptive Anchor Text</a>. DO NOT just write the URL.";
        structureDetails += `- ${linkInstruction}\n`;
    }

    // --- SEO Instructions --- 
    let seoSystemPrompt = seoConfig?.seo_system_prompt || "Ensure the content is well-optimized for search engines.";
    let seoKeywordsInstruction = "";
    if (seoConfig?.seo_keywords) {
         seoKeywordsInstruction = `Key SEO concepts and keywords to naturally integrate: ${seoConfig.seo_keywords}. Focus on incorporating long-tail variations of these keywords where relevant and natural within the text. Avoid keyword stuffing.`;
         // Add to structure details as well?
         structureDetails += `- SEO Focus: Naturally integrate keywords: ${seoConfig.seo_keywords}\n`;
     }

    // Update main prompt instructions
    const prompt = `${seoSystemPrompt}

Generate content for a webpage with the following specifications:
Topic/Term: ${singlePrompt}

Requested Structure Details:
${structureDetails}

Please provide the output strictly in the following JSON format...
{
  "title": "<Generated Title (This will be the main H1)>",
  "meta_description": ...,
  "introduction": ...,
  "main_content": "<HTML... Structure with H2/H3. Wrap <p> tags. Use <strong>/<blockquote>. ${seoKeywordsInstruction} ${linkInstruction ? `Include LINKS <a href='...'>...</a>.` : ''} Use <ul>/<li>.>"
}
...
Focus on high-quality, SEO-friendly, well-structured content using required HTML tags. ${linkInstruction ? 'Ensure <a> tags...' : ''}`;

    return prompt;
}

// New prompt helper specifically for 'polish' mode
function constructPolishPrompt(
    originalContent: string,
    structureOptions: GenerateRequestBody['structureOptions'], // Keep for potential link/etc options
    seoConfig?: SeoConfig | null // Keep for potential keyword awareness
): string {
    const seoSystemPrompt = seoConfig?.seo_system_prompt || "You are an expert editor focusing on improving web content.";
    let seoKeywordsInstruction = "";
    if (seoConfig?.seo_keywords) {
         seoKeywordsInstruction = `While polishing, subtly enhance the text around these SEO concepts if natural: ${seoConfig.seo_keywords}.`;
     }

    const prompt = `${seoSystemPrompt}

Please polish the following web content. Focus on:
+- Improving clarity, grammar, spelling, and punctuation.
+- Enhancing flow and readability.
+- Maintaining the original meaning and tone.
+- Correcting awkward phrasing.
+- Ensuring consistent formatting (use standard HTML like <p>, <h2>, <h3>, <strong>, <blockquote>, <ul>, <li>).
+${seoKeywordsInstruction}

Return the polished result strictly in the following JSON format:
+{
+  "title": "<Generate a concise, relevant title based on the polished content>",
+  "meta_description": "<Generate a brief meta description (~155 chars) summarizing the polished content>",
+  "polished_content": "<The full polished HTML content goes here. Use <p> tags for paragraphs. Retain or improve structure with H2/H3. Use <strong>/<blockquote> where appropriate.>"
+}

--- START OF ORIGINAL CONTENT TO POLISH ---
${originalContent}
--- END OF ORIGINAL CONTENT TO POLISH ---`;

    return prompt;
}

// New prompt helper for generating metadata from raw HTML
function constructRawHtmlMetaPrompt(rawHtml: string): string {
    const prompt = `You are an assistant that analyzes HTML content.

Analyze the following HTML content and generate a suitable title and meta description. Return ONLY a valid JSON object like this: 
+{
  "title": "<Generated Title>",
  "meta_description": "<Generated Meta Description (~155 chars)>"
+}

--- START OF HTML CONTENT ---
${rawHtml.substring(0, 4000)}...
--- END OF HTML CONTENT ---`;

    return prompt;
}

// New prompt helper for generating FAQs from raw HTML
function constructRawHtmlFaqPrompt(rawHtml: string): string {
    const prompt = `You are an SEO assistant. Generate relevant FAQs based on the provided HTML content.

Generate 3-5 SEO-focused FAQ questions and answers based on the main topics discussed in the following HTML content. Return ONLY a valid JSON object like this: 
+{
  "faqs": [{"question": "Q1", "answer": "A1"}, {"question": "Q2", "answer": "A2"}]
+}

--- START OF HTML CONTENT ---
${rawHtml.substring(0, 4000)}...
--- END OF HTML CONTENT ---`;

    return prompt;
}

export async function POST(request: Request) {
    const supabase = createClient();

    // 1. Check User Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let requestBody: GenerateRequestBody;
    try {
        requestBody = await request.json();
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { term, generationMode, articleCount, structureOptions, seoConfig } = requestBody;

    // Validate Input
    if (!term || !generationMode || !articleCount || articleCount < 1 || articleCount > 10 || !structureOptions) {
        return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
    }

    let derivedPrompts: string[] = [];

    try {
        // --- Step 1: Determine Prompts based on Mode --- 
        console.log(`API: Received mode: ${generationMode}, term: "${term.substring(0, 50)}...", count: ${articleCount}, SEO: ${!!seoConfig}`);

        if (generationMode === 'polish') {
            // Polish mode: Use the input term directly as the content to polish.
            // Decomposition is skipped. Only one "prompt" (the content) is used.
            console.log(`API: Polish mode selected. Using input term as content.`);
            derivedPrompts = [term]; 
            // NOTE: articleCount is ignored in polish mode, we only process the single input term.
        } else if (generationMode === 'rawHtml') {
            // Raw HTML mode: Use the input term directly as the content.
            // Decomposition is skipped. Only one "prompt" (the HTML content) is used.
            console.log(`API: Raw HTML mode selected. Using input term as content.`);
            derivedPrompts = [term]; 
            // NOTE: articleCount is ignored in rawHtml mode.
        } else {
            // Create or Multiply mode: Decompose the user request/term into multiple prompts.
            let decompositionSystemPrompt = "Analyze the user request. Return ONLY a valid JSON object { \"prompts\": [...] }.";
            let decompositionUserPrompt = ``;

            if (generationMode === 'create') {
                console.log(`API: Create mode selected. Decomposing term into article prompts.`);
                decompositionUserPrompt = `User Request/Topic: "${term}"\nTarget Number of Articles: ${articleCount}\n\nPlease generate a JSON object containing a single key \"prompts\" whose value is an array of distinct article topic/prompt strings based on the request, targeting ${articleCount} prompts if reasonable.`;
            } else { // generationMode === 'multiply'
                console.log(`API: Multiply mode selected. Decomposing term into article variations.`);
                decompositionSystemPrompt = "Analyze the user request (which might be a topic or a full article). Generate multiple related but distinct article prompts/angles based on it. Return ONLY a valid JSON object { \"prompts\": [...] }.";
                decompositionUserPrompt = `User Request/Base Content: "${term}"\nTarget Number of Article Variations: ${articleCount}\n\nPlease generate a JSON object containing a single key \"prompts\" whose value is an array of distinct article topic/prompt strings that are variations or related sub-topics derived from the base content/request. Aim for ${articleCount} prompts.`;
            }

            // Enhance decomposition prompt if SEO config exists
            if (seoConfig) {
                decompositionSystemPrompt = `You are an SEO-aware assistant. ${seoConfig.seo_system_prompt || 'Analyze the user request...'} ${decompositionSystemPrompt.substring(decompositionSystemPrompt.indexOf('Generate'))}`;
                decompositionUserPrompt += `\nSEO Keywords to consider when formulating prompts: ${seoConfig.seo_keywords || 'None'}`;
            }
            
            console.log(`API: Calling decomposition AI. System: ${decompositionSystemPrompt}`);
            const decompositionCompletion = await openai.chat.completions.create({
                model: "gpt-4o", 
                messages: [
                    { role: "system", content: decompositionSystemPrompt },
                    { role: "user", content: decompositionUserPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.3, // Slightly adjust temperature for variation/creation
            });

            const decompContent = decompositionCompletion.choices[0]?.message?.content;
            if (!decompContent) throw new Error('Prompt decomposition AI response was empty.');

            try {
                const parsedDecomp = JSON.parse(decompContent);
                if (parsedDecomp.prompts && Array.isArray(parsedDecomp.prompts) && parsedDecomp.prompts.length > 0) {
                    derivedPrompts = parsedDecomp.prompts.map((p: any) => String(p).trim()).filter((p: string) => p.length > 0);
                     if (derivedPrompts.length > 10) derivedPrompts = derivedPrompts.slice(0, 10); // Still limit max
                } else {
                     console.warn("Prompt decomposition AI did not return expected format { prompts: [...] }. Using original term.", parsedDecomp);
                     derivedPrompts = [term]; // Fallback
                }
            } catch (parseError) {
                console.error("Failed to parse prompt decomposition JSON:", decompContent, parseError);
                 derivedPrompts = [term]; // Fallback
            }

            if (derivedPrompts.length === 0) {
                 throw new Error("Failed to derive any valid prompts from the user request.");
            }
            console.log(`API: Derived ${derivedPrompts.length} individual prompts for ${generationMode} mode.`);
        }

        // --- Step 2: Generate Content for Each Derived Prompt --- 
        const generationPromises = derivedPrompts.map(async (individualPrompt, index) => {
            // Select the appropriate prompt construction function and expected response format
            let userPrompt: string;
            let responseFormatType: "json_object" = "json_object"; // Default
            let expectedResponseType: 'standard' | 'polish' = 'standard';

            if (generationMode === 'polish') {
                userPrompt = constructPolishPrompt(individualPrompt, structureOptions, seoConfig || null);
                expectedResponseType = 'polish';
                console.log(`-- OpenAI Polish Call ${index + 1} Prompt --\n`, userPrompt, `\n-- End Prompt --`);
            } else if (generationMode === 'rawHtml') {
                // In rawHtml mode, we call AI *only* for metadata and potentially FAQs
                // The main content IS the individualPrompt (raw HTML)
                userPrompt = constructRawHtmlMetaPrompt(individualPrompt);
                expectedResponseType = 'standard'; // Expecting { title, meta_description }
                console.log(`-- OpenAI RawHTML Meta Call ${index + 1} Prompt --\n`, userPrompt, `\n-- End Prompt --`);
            } else { // 'create' or 'multiply'
                userPrompt = constructCreateMultiplyPrompt(individualPrompt, structureOptions, seoConfig || null);
                expectedResponseType = 'standard';
                console.log(`-- OpenAI Create/Multiply Call ${index + 1} Prompt --\n`, userPrompt, `\n-- End Prompt --`);
            }

            let generatedFaqs: FaqItem[] | null = null; // Variable to hold FAQs for this article
            
            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o", // Or "gpt-4-turbo" or "gpt-3.5-turbo" if preferred (check JSON mode support)
                    // model: "gpt-3.5-turbo", // Cheaper option, might be less reliable with JSON
                    messages: [
                        // System prompt is now included within the userPrompt construction functions
                        { role: "user", content: userPrompt }
                    ],
                    response_format: { type: responseFormatType }, // Request JSON output
                    temperature: 0.7, // Adjust creativity vs. consistency
                    // max_tokens: 1500, // Optional: Limit token usage
                });

                const content = completion.choices[0]?.message?.content;
                if (!content) {
                    // Log specific error for empty content
                    console.error(`OpenAI response content was empty for prompt ${index + 1}.`);
                    throw new Error(`OpenAI response content was empty for prompt ${index + 1}.`);
                }

                // Parse the JSON content from OpenAI
                let title: string = '';
                let introduction: string = '';
                let main_content: string = '';
                let meta_description: string | undefined = undefined;

                // Handle raw HTML mode parsing and content assignment separately
                if (generationMode === 'rawHtml') {
                    try {
                        // Parse the metadata response
                        const parsedMeta = JSON.parse(content) as { title: string; meta_description?: string };
                        title = parsedMeta.title || 'Untitled Page'; // Provide default title
                        meta_description = parsedMeta.meta_description;
                        // Use the original input HTML as main content
                        main_content = individualPrompt; 
                        introduction = ''; // No separate intro for raw HTML
                    } catch (parseError) {
                        console.error(`Failed to parse OpenAI JSON meta response for raw HTML input ${index + 1}:`, content, parseError);
                        return { error: `Failed to parse AI meta response for raw HTML input ${index + 1}. Content: ${content.substring(0, 100)}...` };
                    }
                } else {
                    // Existing logic for other modes
                    try {
                        if (expectedResponseType === 'polish') {
                            const parsedPolish = JSON.parse(content) as OpenAIResponseFormatPolish;
                            title = parsedPolish.title || '';
                            main_content = parsedPolish.polished_content || '';
                            introduction = ''; // No separate intro for polish mode
                            meta_description = parsedPolish.meta_description;
                        } else {
                            const parsedStandard = JSON.parse(content) as OpenAIResponseFormat;
                            title = parsedStandard.title || '';
                            introduction = parsedStandard.introduction || '';
                            main_content = parsedStandard.main_content || '';
                            meta_description = parsedStandard.meta_description;
                        }
                    } catch (parseError) {
                        console.error(`Failed to parse OpenAI JSON response for prompt ${index + 1}:`, content, parseError);
                        return { error: `Failed to parse AI response for prompt ${index + 1}. Content: ${content.substring(0, 100)}...` };
                    }
                }
                
                // Validate essential fields after parsing
                if (!title || (!main_content && generationMode !== 'polish' && generationMode !== 'rawHtml')) { // main_content comes directly in rawHtml mode
                     console.warn(`Parsed OpenAI response was missing some required fields for prompt ${index + 1}. Using defaults. Received:`, content);
                }

                // LOG the RAW HTML content BEFORE post-processing
                console.log(`---> RAW HTML for ${generationMode} ${index + 1} Main Content:\n`, main_content);

                // POST-PROCESS HTML (Remove addSpacer logic again) 
                const processedIntro = introduction || ''; 
                const processedMainContent = main_content || ''; 

                // LOG the processed HTML content
                // console.log(`---> Processed HTML for ${generationMode} ${index + 1} Main Content:\n`, processedMainContent); // Not needed if no processing

                // --- Generate FAQs (If Requested) --- 
                if (structureOptions.generateFAQ) {
                    let faqUserPrompt: string;
                    if (generationMode === 'rawHtml') {
                        faqUserPrompt = constructRawHtmlFaqPrompt(individualPrompt); // Use raw HTML as context
                        console.log(`--- OpenAI RawHTML FAQ Call ${index + 1} ---`);
                    } else if (generationMode !== 'polish') { // Skip for polish
                        faqUserPrompt = `Generate 3-5 SEO-focused FAQ questions and answers for the topic: "${individualPrompt}". Focus on likely user search queries related to this topic. Ensure the output is ONLY the specified JSON object.`; // Original prompt for create/multiply
                        console.log(`--- OpenAI FAQ Call ${index + 1} for prompt: "${individualPrompt.substring(0,50)}..." ---`);
                    } else {
                        faqUserPrompt = ''; // Skip FAQ call for polish
                    }

                    if (faqUserPrompt) { // Only call if prompt is set
                        const faqSystemPrompt = "You are an SEO assistant. Generate relevant Frequently Asked Questions (FAQs) and concise answers based on the provided context, focusing on questions users might search for. Return ONLY a valid JSON object like this: { \"faqs\": [{\"question\": \"Q1\", \"answer\": \"A1\"}, {\"question\": \"Q2\", \"answer\": \"A2\"}] }.";

                        try {
                            const faqCompletion = await openai.chat.completions.create({
                                model: "gpt-4o",
                                messages: [
                                    { role: "system", content: faqSystemPrompt },
                                    { role: "user", content: faqUserPrompt }
                                ],
                                response_format: { type: "json_object" },
                                temperature: 0.5,
                            });
                            const faqContent = faqCompletion.choices[0]?.message?.content;
                            if (faqContent) {
                                const parsedFaqResponse = JSON.parse(faqContent) as FaqGenerationResponse;
                                if (parsedFaqResponse.faqs && Array.isArray(parsedFaqResponse.faqs)) {
                                    generatedFaqs = parsedFaqResponse.faqs;
                                    console.log(`---> Generated ${generatedFaqs.length} FAQs for article ${index + 1}`);
                                } else {
                                    console.warn(`FAQ generation for article ${index + 1} returned unexpected JSON format:`, faqContent);
                                }
                            } else {
                                console.warn(`FAQ generation for article ${index + 1} produced empty content.`);
                            }
                        } catch (faqError: any) {
                            console.error(`Error during FAQ generation for ${generationMode} ${index + 1}:`, faqError);
                        }
                    }
                }

                // Map to finalPage including FAQs
                const finalPage: GeneratedPage = {
                    title: title,
                    slug: generateSlug(title || `article-${index + 1}`),
                    content_intro: processedIntro,
                    content_main: processedMainContent,
                    meta_description: meta_description,
                    content_faq: generatedFaqs, // Add generated FAQs or null
                };
                return finalPage;

            } catch (error: any) {
                 // Catch errors from OpenAI call or empty content
                 console.error(`Error during OpenAI call for prompt ${index + 1} ("${individualPrompt.substring(0,30)}..."):`, error);
                 return { error: `Failed to generate article for prompt ${index + 1}: ${error.message}` }; 
            }
        });

        const results = await Promise.all(generationPromises);

        // Separate successful generations from errors
        const successfulGenerations = results.filter((r): r is GeneratedPage => r && !('error' in r));
        const generationErrors = results.filter(r => r && 'error' in r);

        console.log(`Generated ${successfulGenerations.length} articles successfully.`);
        if (generationErrors.length > 0) {
            console.error("Errors during generation:", generationErrors);
            // Decide how to handle partial success. Here, we return success if at least one article was generated,
            // but include error info. Adjust as needed.
             if (successfulGenerations.length === 0) {
                 // If all failed, return a server error
                return NextResponse.json({ error: 'All generation attempts failed.', details: generationErrors }, { status: 500 });
             }
        }
        
        // 4. Return Generated Content (even if partial success)
        return NextResponse.json({ data: successfulGenerations, errors: generationErrors }, { status: 200 });

    } catch (error: any) {
        console.error("Unhandled error during content generation process:", error);
        return NextResponse.json({ error: error.message || 'Failed to generate content' }, { status: 500 });
    }
} 