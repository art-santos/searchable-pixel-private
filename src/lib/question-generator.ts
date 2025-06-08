import OpenAI from 'openai';

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface QuestionGenerationResult {
  questions: string[];
  success: boolean;
  error?: string;
  tokensUsed?: number;
  retryCount?: number;
}

const QUESTION_GENERATOR_SYSTEM = `
You're an expert at crafting human-sounding recommendation and comparison questions. 
Focus on scenarios someone would naturally ask when evaluating or researching a product/category.
`;

// Dynamic template function for building targeted questions
function buildQuestionPrompt(domain: string, topic: string): string {
  return `
Domain: ${domain}
Category: ${topic}

Generate exactly 5 questions a user might type when they're:
• Looking for the best options in ${topic}  
• Considering replacing their current ${topic} solution  
• Comparing ${domain} against other ${topic} offerings  

Requirements:
– Use "${topic}" or "the category" in your questions, not "platform" or "tool."  
– Only mention the domain (i.e. "${domain}") in 1–2 questions that compare it directly.  
– Vary the focus: features, pricing/value, reviews, use-cases, integrations, support.  
– Sound like real user queries.  
– Output as a numbered list (1–5).

Example patterns, but not limited to: (fill in your ${topic} and ${domain} where appropriate):
1. What are the 5-10 best ${topic} options available right now?  
2. I'm looking to replace my current ${topic} solution—what options should I consider?  
3. How does ${domain} compare to other ${topic} providers?  
4. Which 4-5 ${topic} should I consider? I've been looking at ${domain}.
5. For my use cases in ${topic}, what alternatives should I look at?  
`;
}

export async function generateQuestions(
  topic: string,
  domain: string,
  retryCount: number = 0
): Promise<QuestionGenerationResult> {
  console.log(`🤖 Generating questions for domain: "${domain}", topic: "${topic}" (attempt ${retryCount + 1})`);
  
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: QUESTION_GENERATOR_SYSTEM },
        { role: 'user', content: buildQuestionPrompt(domain, topic) }
      ],
      max_tokens: 400,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;
    
    console.log(`📝 Raw GPT-4o response (${tokensUsed} tokens):`, content);
    
    const questions = parseNumberedList(content);
    console.log(`✅ Parsed ${questions.length} questions:`, questions);
    
    if (questions.length < 3) {
      throw new Error(`Only parsed ${questions.length} questions, expected at least 3`);
    }
    
    // Pad with fallback questions if needed
    while (questions.length < 5) {
      const fallbacks = generateFallbackQuestions(topic, domain);
      questions.push(fallbacks[questions.length % fallbacks.length]);
    }
    
    return {
      questions: questions.slice(0, 5),
      success: true,
      tokensUsed,
      retryCount
    };
  } catch (error: any) {
    console.error(`❌ Question generation failed (attempt ${retryCount + 1}):`, error);
    
    // Retry logic with exponential backoff
    if (retryCount < 2) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      console.log(`⏳ Retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateQuestions(topic, domain, retryCount + 1);
    }
    
    // Final fallback
    console.log('🔄 Using fallback questions');
    return {
      questions: generateFallbackQuestions(topic, domain),
      success: false,
      error: error.message,
      retryCount
    };
  }
}

function parseNumberedList(content: string): string[] {
  const lines = content.split('\n')
    .filter(line => /^\d+\./.test(line.trim()))
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(q => q.length > 10 && q.length < 200); // Reasonable length bounds
    
  return lines;
}

function generateFallbackQuestions(topic: string, domain: string): string[] {
  return [
    `What are the best 5 ${topic} options available right now?`,
    `I'm looking to replace my current ${topic} solution—what should I consider?`,
    `How does ${domain} compare to other ${topic} providers?`,
    `Which ${topic} offerings give the best value for money?`,
    `For my use cases in ${topic}, what alternatives should I look at?`
  ];
} 