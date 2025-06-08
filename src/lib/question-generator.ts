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

const QUESTION_GENERATOR_SYSTEM = `You create realistic user questions for AI assistants based on topics. Focus on recommendation/comparison scenarios that would surface product mentions.`;

const QUESTION_GENERATOR_USER = `Topic: "{TOPIC}"

Generate exactly 5 questions that users might ask ChatGPT/Perplexity about this topic. Make them:
- Natural, human language
- Recommendation-focused ("what's the best...", "compare X vs Y")
- Different angles (pricing, features, use cases)

Format as numbered list:
1. [question]
2. [question]
3. [question]
4. [question]
5. [question]`;

export async function generateQuestions(
  topic: string, 
  retryCount: number = 0
): Promise<QuestionGenerationResult> {
  console.log(`🤖 Generating questions for topic: "${topic}" (attempt ${retryCount + 1})`);
  
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: QUESTION_GENERATOR_SYSTEM },
        { role: 'user', content: QUESTION_GENERATOR_USER.replace('{TOPIC}', topic) }
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
      const fallbacks = generateFallbackQuestions(topic);
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
      return generateQuestions(topic, retryCount + 1);
    }
    
    // Final fallback
    console.log('🔄 Using fallback questions');
    return {
      questions: generateFallbackQuestions(topic),
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

function generateFallbackQuestions(topic: string): string[] {
  return [
    `What's the best ${topic}?`,
    `Compare top ${topic} options for businesses`,
    `${topic} recommendations and reviews`,
    `Most popular ${topic} tools in 2024`,
    `${topic} pricing and features comparison`
  ];
} 