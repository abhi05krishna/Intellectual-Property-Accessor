const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../config/logger');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Generate intelligent improvement recommendations for a submitted abstract.
 * Uses Claude claude-sonnet-4-20250514 to analyze the submission against similar works
 * and produce actionable, domain-aware suggestions.
 */
const generateRecommendations = async ({ abstract, domain, similarWorks, scores }) => {
  const similarWorksText = similarWorks
    .slice(0, 5)
    .map((w, i) =>
      `${i + 1}. "${w.title}" (${w.year || 'N/A'}, ${w.source}) — ${w.similarityPercent}% similar`
    )
    .join('\n');

  const prompt = `You are an expert academic research advisor specializing in ${domain}. 
Analyze this research abstract and its similarity report, then provide structured recommendations.

ABSTRACT:
${abstract}

ORIGINALITY SCORE: ${scores.originality}% (higher = more original)
SIMILARITY INDEX: ${scores.similarity}% (lower = less overlap with existing works)
NOVELTY POTENTIAL: ${scores.noveltyPotential}%

TOP SIMILAR WORKS FOUND:
${similarWorksText}

Provide exactly 6 recommendations in the following JSON format. Be specific, actionable, and domain-aware:

{
  "recommendations": [
    {
      "type": "strength",
      "title": "Short title (5 words max)",
      "description": "Specific observation about what's strong and original in this work (2-3 sentences)",
      "priority": "high"
    },
    {
      "type": "improvement",
      "title": "Short title",
      "description": "Specific area of overlap with existing works and how to differentiate (2-3 sentences)",
      "priority": "high"
    },
    {
      "type": "suggestion",
      "title": "Short title",
      "description": "Actionable suggestion to increase novelty or research quality (2-3 sentences)",
      "priority": "medium"
    },
    {
      "type": "gap",
      "title": "Short title",
      "description": "Research gap identified that this work could uniquely address (2-3 sentences)",
      "priority": "high"
    },
    {
      "type": "suggestion",
      "title": "Short title",
      "description": "Methodology or validation suggestion specific to this domain (2-3 sentences)",
      "priority": "medium"
    },
    {
      "type": "citation_gap",
      "title": "Short title",
      "description": "Missing foundational references or literature connections (2-3 sentences)",
      "priority": "low"
    }
  ],
  "aiSummary": "2-3 sentence overall assessment of the work's originality and most important action item."
}

Return ONLY valid JSON. No markdown, no extra text.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0].text.trim();
    const parsed = JSON.parse(content);

    return {
      recommendations: parsed.recommendations || [],
      aiSummary: parsed.aiSummary || '',
    };
  } catch (err) {
    logger.error(`AI recommendations failed: ${err.message}`);
    // Return sensible defaults so the analysis still completes
    return {
      recommendations: getDefaultRecommendations(scores),
      aiSummary: `Your work shows ${scores.originality}% originality with a novelty potential of ${scores.noveltyPotential}%. Review the similar works identified to strengthen your unique contributions.`,
    };
  }
};

/**
 * Fallback recommendations when AI is unavailable.
 */
const getDefaultRecommendations = (scores) => [
  {
    type: 'strength',
    title: 'Novel contribution identified',
    description: `Your work demonstrates ${scores.originality}% originality. The core methodology appears distinct from existing literature.`,
    priority: 'high',
  },
  {
    type: 'improvement',
    title: 'Reduce similarity overlap',
    description: `The ${scores.similarity}% similarity index suggests some content overlap. Review and rephrase sections that closely mirror existing papers.`,
    priority: 'high',
  },
  {
    type: 'suggestion',
    title: 'Strengthen novelty claim',
    description: 'Explicitly state your unique contributions in the abstract to differentiate from similar works.',
    priority: 'medium',
  },
];

/**
 * Generate a brief AI summary for the analysis.
 */
const generateBriefSummary = async (abstract, scores) => {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `In 2 sentences, summarize the originality assessment of this abstract (originality: ${scores.originality}%, similarity: ${scores.similarity}%): ${abstract.slice(0, 500)}`,
      }],
    });
    return message.content[0].text.trim();
  } catch {
    return null;
  }
};

module.exports = { generateRecommendations, generateBriefSummary };
