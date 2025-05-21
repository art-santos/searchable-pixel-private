export const isAiCrawler = (ua = ''): boolean =>
  /(GPTBot|ClaudeBot|PerplexityBot|ChatGPT-User|Google-Extended)/i.test(ua);
