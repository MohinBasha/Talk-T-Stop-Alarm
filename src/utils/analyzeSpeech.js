/**
 * Analyzes a speech transcript and returns a score + suggestions.
 * Runs entirely client-side — no API calls.
 */

const FILLER_WORDS = [
  'um', 'uh', 'uhh', 'umm', 'er', 'err', 'like', 'literally',
  'basically', 'you know', 'i mean', 'sort of', 'kind of',
  'kinda', 'sorta', 'right', 'okay so', 'so yeah', 'well',
];

const CONNECTOR_WORDS = [
  'because', 'therefore', 'however', 'although', 'moreover',
  'furthermore', 'additionally', 'consequently', 'nevertheless',
  'in addition', 'for example', 'for instance', 'in fact',
  'as a result', 'on the other hand', 'first', 'second', 'finally',
  'also', 'but', 'so', 'then', 'next',
];

/**
 * Extract keywords from topic string for relevance scoring.
 */
function extractTopicKeywords(topic) {
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'your', 'you', 'about',
    'and', 'or', 'to', 'in', 'of', 'for', 'on', 'with', 'it', 'that',
    'this', 'what', 'how', 'would', 'do', 'did', 'have', 'has',
  ]);
  return topic
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

/**
 * Count how many times filler words appear in text.
 */
function countFillers(text) {
  const lower = text.toLowerCase();
  let count = 0;
  FILLER_WORDS.forEach(f => {
    const regex = new RegExp(`\\b${f}\\b`, 'g');
    const matches = lower.match(regex);
    if (matches) count += matches.length;
  });
  return count;
}

/**
 * Count connective/transitional phrases.
 */
function countConnectors(text) {
  const lower = text.toLowerCase();
  let count = 0;
  CONNECTOR_WORDS.forEach(c => {
    const regex = new RegExp(`\\b${c}\\b`, 'g');
    const matches = lower.match(regex);
    if (matches) count += matches.length;
  });
  return count;
}

/**
 * Main analysis function. Returns { score, label, metrics, suggestions, summary }.
 */
export function analyzeSpeech(transcript, topic) {
  if (!transcript || transcript.trim().length < 5) {
    return {
      score: 0,
      label: 'Not enough speech',
      metrics: {},
      suggestions: ['Start speaking about the topic to get feedback.'],
      summary: '',
    };
  }

  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const sentenceCount = Math.max(1, sentences.length);
  const avgWordsPerSentence = wordCount / sentenceCount;

  // Unique vocabulary
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')));
  const vocabularyRatio = uniqueWords.size / wordCount; // 0–1, higher = more diverse

  // Filler words
  const fillerCount = countFillers(transcript);
  const fillerRatio = fillerCount / wordCount; // lower is better

  // Connectors / flow
  const connectorCount = countConnectors(transcript);

  // Topic relevance
  const topicKeywords = extractTopicKeywords(topic);
  const lowerTranscript = transcript.toLowerCase();
  const relevantHits = topicKeywords.filter(kw => lowerTranscript.includes(kw)).length;
  const topicRelevance = topicKeywords.length > 0
    ? relevantHits / topicKeywords.length
    : 0.5;

  // ── Scoring (each out of 10, weighted average) ──

  // 1. Length score (0–10): 50 words = 5, 150 words = 10
  const lengthScore = Math.min(10, (wordCount / 120) * 10);

  // 2. Vocabulary diversity (0–10): ratio 0.4+ = 10
  const vocabScore = Math.min(10, (vocabularyRatio / 0.45) * 10);

  // 3. Filler penalty (0–10): 0 fillers = 10, >25% filler = 0
  const fillerScore = Math.max(0, 10 - (fillerRatio / 0.25) * 10);

  // 4. Sentence variety (0–10): avg 8–15 words = good
  const sentenceScore =
    avgWordsPerSentence >= 5 && avgWordsPerSentence <= 20
      ? Math.min(10, (avgWordsPerSentence / 12) * 10)
      : Math.max(0, 10 - Math.abs(avgWordsPerSentence - 12) * 0.8);

  // 5. Topic relevance (0–10)
  const relevanceScore = Math.min(10, topicRelevance * 10);

  // 6. Connector / flow bonus (0–10)
  const connectorScore = Math.min(10, connectorCount * 1.5);

  // Weighted average
  const raw =
    lengthScore * 0.20 +
    vocabScore * 0.20 +
    fillerScore * 0.20 +
    sentenceScore * 0.15 +
    relevanceScore * 0.15 +
    connectorScore * 0.10;

  const score = Math.round(Math.min(10, Math.max(1, raw)));

  // ── Label ──
  const label =
    score >= 9 ? 'Excellent 🌟' :
    score >= 7 ? 'Great 🔥' :
    score >= 5 ? 'Good 👍' :
    score >= 3 ? 'Getting there 💪' :
    'Keep going 🗣';

  // ── Suggestions ──
  const suggestions = [];

  if (fillerCount > 5) {
    suggestions.push(`You used ${fillerCount} filler word${fillerCount > 1 ? 's' : ''} (like "um", "uh", "like"). Try pausing silently instead.`);
  }
  if (vocabularyRatio < 0.4) {
    suggestions.push('Try using more varied vocabulary — you repeated some words often.');
  }
  if (topicRelevance < 0.4 && topicKeywords.length > 0) {
    suggestions.push(`Stay closer to the topic: "${topic}". Try mentioning key ideas directly.`);
  }
  if (connectorCount < 2) {
    suggestions.push('Add transition words ("because", "however", "for example") to improve flow.');
  }
  if (avgWordsPerSentence < 5) {
    suggestions.push('Your sentences are very short. Try expanding your ideas with more detail.');
  }
  if (avgWordsPerSentence > 25) {
    suggestions.push('Your sentences are quite long. Try breaking them into shorter, clearer thoughts.');
  }
  if (wordCount < 30) {
    suggestions.push('Keep talking! More content means better coverage of the topic.');
  }
  if (suggestions.length === 0) {
    suggestions.push('Great job! You spoke naturally with good vocabulary and topic coverage.');
    suggestions.push('Keep practicing to maintain this quality every morning!');
  }

  // ── One-line summary ──
  const summary = generateSummary(transcript, topic, wordCount, score);

  return {
    score,
    label,
    metrics: {
      wordCount,
      uniqueWords: uniqueWords.size,
      vocabularyRatio: Math.round(vocabularyRatio * 100),
      fillerCount,
      sentenceCount,
      avgWordsPerSentence: Math.round(avgWordsPerSentence),
      topicRelevance: Math.round(topicRelevance * 100),
      connectorCount,
    },
    suggestions: suggestions.slice(0, 3),
    summary,
  };
}

/**
 * Generate a short human-readable summary of what was said.
 */
function generateSummary(transcript, topic, wordCount, score) {
  const trimmed = transcript.trim();
  if (wordCount < 5) return '';

  // Extract the first two sentences as a summary preview
  const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 5);
  if (sentences.length === 0) return trimmed.slice(0, 100) + '…';

  const preview = sentences.slice(0, 2).join('. ').trim();
  return preview.length > 120 ? preview.slice(0, 117) + '…' : preview + '.';
}
