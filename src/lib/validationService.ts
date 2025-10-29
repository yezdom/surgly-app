import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface AdValidationResult {
  readabilityScore: number;
  emotionalTone: string;
  complianceRisk: 'Low' | 'Medium' | 'High';
  messageConsistency?: number;
  conversionPotential: 'Low' | 'Medium' | 'High';
  suggestedHeadline: string;
  predictedCTR: number;
  predictedROI: number;
  recommendations: string[];
  engagementLevel: 'Low' | 'Medium' | 'High';
  adReadinessScore: number;
}

export interface LandingPageAuditResult {
  suggestedAdCopy: {
    headline: string;
    body: string;
    cta: string;
  };
  emotionalHooks: string[];
  clarityScore: number;
  complianceLevel: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  conversionReadiness: number;
  uniqueSellingPoints: string[];
  missingElements: string[];
  recommendations: string[];
  predictedEngagement: number;
  drSurglyPrescription: string;
}

export async function validateAdWithLandingPage(
  headline: string,
  body: string,
  objective: string,
  landingPageText: string
): Promise<AdValidationResult> {
  const prompt = `You are an AI Ad Doctor specializing in Facebook advertising.
Evaluate this Facebook ad and its landing page before launch.

Ad Objective: ${objective}
Headline: "${headline}"
Body: "${body}"
Landing Page Text (first 2000 chars): "${landingPageText.slice(0, 2000)}"

Provide a detailed evaluation in the following JSON format (respond ONLY with valid JSON):
{
  "readabilityScore": <number 0-100>,
  "emotionalTone": "<string>",
  "complianceRisk": "<Low|Medium|High>",
  "messageConsistency": <number 0-100>,
  "conversionPotential": "<Low|Medium|High>",
  "suggestedHeadline": "<string>",
  "predictedCTR": <number 0-10>,
  "predictedROI": <number 0-5>,
  "recommendations": ["<recommendation1>", "<recommendation2>", "<recommendation3>"],
  "engagementLevel": "<Low|Medium|High>",
  "adReadinessScore": <number 0-100>
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    return {
      readabilityScore: result.readabilityScore || 0,
      emotionalTone: result.emotionalTone || 'Neutral',
      complianceRisk: result.complianceRisk || 'Medium',
      messageConsistency: result.messageConsistency || 0,
      conversionPotential: result.conversionPotential || 'Medium',
      suggestedHeadline: result.suggestedHeadline || headline,
      predictedCTR: result.predictedCTR || 0,
      predictedROI: result.predictedROI || 0,
      recommendations: result.recommendations || [],
      engagementLevel: result.engagementLevel || 'Medium',
      adReadinessScore: result.adReadinessScore || 0,
    };
  } catch (error) {
    console.error('AI validation error:', error);
    throw new Error('Failed to validate ad. Please try again.');
  }
}

export async function validateManualAd(
  adText: string
): Promise<AdValidationResult> {
  const prompt = `You are an AI Ad Reviewer specializing in Facebook advertising.
Evaluate this Facebook ad before launch.

Ad Copy:
"${adText}"

Provide a detailed evaluation in the following JSON format (respond ONLY with valid JSON):
{
  "readabilityScore": <number 0-100>,
  "emotionalTone": "<string>",
  "complianceRisk": "<Low|Medium|High>",
  "conversionPotential": "<Low|Medium|High>",
  "suggestedHeadline": "<string>",
  "predictedCTR": <number 0-10>,
  "predictedROI": <number 0-5>,
  "recommendations": ["<recommendation1>", "<recommendation2>", "<recommendation3>"],
  "engagementLevel": "<Low|Medium|High>",
  "adReadinessScore": <number 0-100>
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    return {
      readabilityScore: result.readabilityScore || 0,
      emotionalTone: result.emotionalTone || 'Neutral',
      complianceRisk: result.complianceRisk || 'Medium',
      conversionPotential: result.conversionPotential || 'Medium',
      suggestedHeadline: result.suggestedHeadline || '',
      predictedCTR: result.predictedCTR || 0,
      predictedROI: result.predictedROI || 0,
      recommendations: result.recommendations || [],
      engagementLevel: result.engagementLevel || 'Medium',
      adReadinessScore: result.adReadinessScore || 0,
    };
  } catch (error) {
    console.error('AI validation error:', error);
    throw new Error('Failed to validate ad. Please try again.');
  }
}

export async function auditLandingPage(
  landingPageText: string
): Promise<LandingPageAuditResult> {
  const prompt = `You are Dr. Surgly, an expert AI Ads Doctor specializing in Facebook advertising.
Analyze this landing page and generate a realistic pre-launch ad performance evaluation.

LANDING PAGE CONTENT:
${landingPageText}

Provide a comprehensive analysis in the following JSON format (respond ONLY with valid JSON):
{
  "emotionalHooks": ["<hook1>", "<hook2>", "<hook3>"],
  "clarityScore": <number 0-100>,
  "uniqueSellingPoints": ["<usp1>", "<usp2>", "<usp3>"],
  "conversionReadiness": <number 0-100>,
  "complianceLevel": "<Excellent|Good|Fair|Poor>",
  "missingElements": ["<element1>", "<element2>"],
  "suggestedAdCopy": {
    "headline": "<compelling headline>",
    "body": "<engaging body text>",
    "cta": "<strong call to action>"
  },
  "predictedEngagement": <number 0-100>,
  "recommendations": ["<recommendation1>", "<recommendation2>", "<recommendation3>"],
  "drSurglyPrescription": "<1-2 actionable sentences>"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    return {
      suggestedAdCopy: result.suggestedAdCopy || { headline: '', body: '', cta: '' },
      emotionalHooks: result.emotionalHooks || [],
      clarityScore: result.clarityScore || 0,
      complianceLevel: result.complianceLevel || 'Good',
      conversionReadiness: result.conversionReadiness || 0,
      uniqueSellingPoints: result.uniqueSellingPoints || [],
      missingElements: result.missingElements || [],
      recommendations: result.recommendations || [],
      predictedEngagement: result.predictedEngagement || 0,
      drSurglyPrescription: result.drSurglyPrescription || '',
    };
  } catch (error) {
    console.error('Landing page audit error:', error);
    throw new Error('Failed to audit landing page. Please try again.');
  }
}

// Legacy function - kept for backwards compatibility
export async function fetchLandingPageText(url: string): Promise<string> {
  const { fetchLandingContent } = await import('./fetchLandingContent');
  const extraction = await fetchLandingContent(url);
  return extraction.summary;
}

export async function generateImprovedAdCopy(
  originalCopy: string,
  feedback: string[]
): Promise<{ headline: string; body: string }> {
  const prompt = `You are an expert Facebook ad copywriter.
Rewrite this ad copy based on the following feedback:

Original Copy:
"${originalCopy}"

Feedback:
${feedback.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Generate improved ad copy in the following JSON format (respond ONLY with valid JSON):
{
  "headline": "<improved headline>",
  "body": "<improved body text>"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    return {
      headline: result.headline || '',
      body: result.body || '',
    };
  } catch (error) {
    console.error('Failed to generate improved copy:', error);
    throw new Error('Failed to generate improved ad copy. Please try again.');
  }
}
