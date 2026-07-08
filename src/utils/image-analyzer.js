// Content analyzer — extracts keywords, topics, and search queries from blog content

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need',
  'has', 'had', 'its', 'it', 'this', 'that', 'these', 'those', 'all',
  'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'just', 'because', 'about', 'which', 'when', 'where', 'how', 'what',
  'who', 'whom', 'why', 'any', 'also', 'into', 'over', 'after', 'before',
  'between', 'under', 'above', 'below', 'up', 'down', 'out', 'off',
  'here', 'there', 'get', 'got', 'use', 'used', 'using', 'make', 'made',
  'like', 'well', 'best', 'new', 'one', 'two', 'top', 'your', 'our',
  'their', 'you', 'we', 'they', 'he', 'she', 'not', 'are', 'can',
]);

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/).filter(Boolean);
}

function extractKeywords(text) {
  const tokens = tokenize(text);
  const freq = {};
  for (const t of tokens) {
    if (!STOP_WORDS.has(t) && t.length > 2) {
      freq[t] = (freq[t] || 0) + 1;
    }
  }
  // Extract bigrams too
  const bigrams = {};
  for (let i = 0; i < tokens.length - 1; i++) {
    const pair = `${tokens[i]}-${tokens[i + 1]}`;
    const clean = `${tokens[i]} ${tokens[i + 1]}`;
    if (!STOP_WORDS.has(tokens[i]) && !STOP_WORDS.has(tokens[i + 1]) && tokens[i].length > 2 && tokens[i + 1].length > 2) {
      bigrams[clean] = (bigrams[clean] || 0) + 1;
    }
  }

  return {
    unigrams: Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 30),
    bigrams: Object.entries(bigrams).sort((a, b) => b[1] - a[1]).slice(0, 20),
  };
}

function extractTopics(title, description, category, tags) {
  const topics = [];

  topics.push({ word: category, weight: 10, source: 'category' });

  for (const tag of tags) {
    topics.push({ word: tag, weight: 8, source: 'tag' });
  }

  const titleWords = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const descWords = description ? description.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/) : [];

  const seen = new Set();
  for (const w of [...titleWords, ...descWords]) {
    if (!STOP_WORDS.has(w) && w.length > 2 && !seen.has(w)) {
      seen.add(w);
      topics.push({ word: w, weight: titleWords.includes(w) ? 6 : 4, source: 'content' });
    }
  }

  return topics.sort((a, b) => b.weight - a.weight);
}

export function generateSearchQueries(title, description, category, tags, body) {
  const keywords = extractKeywords(body || '');
  const topics = extractTopics(title, description, category, tags);

  const queries = [];

  // Primary: topic phrases
  queries.push(title);
  queries.push(`${category} ${tags.slice(0, 3).join(' ')}`);

  // From topics
  for (const t of topics.slice(0, 8)) {
    queries.push(t.word);
  }

  // From keyword bigrams
  for (const [phrase] of keywords.bigrams.slice(0, 6)) {
    queries.push(phrase);
  }

  // From keyword unigrams
  for (const [word] of keywords.unigrams.slice(0, 5)) {
    queries.push(word);
  }

  // Deduplicate and clean
  const seen = new Set();
  return queries
    .map((q) => q.toLowerCase().trim())
    .filter((q) => {
      if (seen.has(q) || q.length < 3) return false;
      seen.add(q);
      return true;
    })
    .slice(0, 10);
}
