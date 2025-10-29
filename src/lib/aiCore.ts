import OpenAI from 'openai';
import { supabase } from './supabase';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

interface CampaignData {
  name: string;
  objective?: string;
  spend?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  ctr?: number;
  cpc?: number;
  cpa?: number;
  roas?: number;
}

interface AdData {
  ad_name: string;
  creative_url?: string;
  ad_copy?: string;
  headline?: string;
  cta_type?: string;
  performance?: {
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
  };
}

interface AIResponse {
  content: string;
  cached: boolean;
  timestamp: Date;
}

export class AICore {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  private async getCachedResponse(cacheKey: string): Promise<string | null> {
    try {
      const { data } = await supabase
        .from('ai_response_cache')
        .select('response, created_at')
        .eq('cache_key', cacheKey)
        .eq('user_id', this.userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      return data?.response || null;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  private async setCachedResponse(cacheKey: string, response: string): Promise<void> {
    try {
      await supabase.from('ai_response_cache').upsert({
        user_id: this.userId,
        cache_key: cacheKey,
        response,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  async analyzeCampaign(campaign: CampaignData): Promise<AIResponse> {
    const cacheKey = `campaign_analysis_${campaign.name}_${campaign.spend}`;
    const cached = await this.getCachedResponse(cacheKey);

    if (cached) {
      return { content: cached, cached: true, timestamp: new Date() };
    }

    const prompt = `You are Dr. Surgly, an expert AI advertising consultant. Analyze this Facebook ad campaign and provide actionable insights.

Campaign: ${campaign.name}
Objective: ${campaign.objective || 'Not specified'}
Spend: $${campaign.spend?.toFixed(2) || 0}
Impressions: ${campaign.impressions?.toLocaleString() || 0}
Clicks: ${campaign.clicks?.toLocaleString() || 0}
Conversions: ${campaign.conversions || 0}
CTR: ${campaign.ctr?.toFixed(2) || 0}%
CPC: $${campaign.cpc?.toFixed(2) || 0}
CPA: $${campaign.cpa?.toFixed(2) || 0}
ROAS: ${campaign.roas?.toFixed(2) || 0}x

Provide:
1. Overall health score (0-100) with reasoning
2. Top 3 strengths
3. Top 3 areas for improvement
4. Specific actionable recommendations
5. Predicted impact of recommendations

Be empathetic, practical, and data-driven. Use plain language.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are Dr. Surgly, a world-class advertising AI consultant who helps businesses optimize their ad campaigns. You are empathetic, insightful, and always provide actionable advice.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || 'Unable to generate analysis';
      await this.setCachedResponse(cacheKey, content);

      return { content, cached: false, timestamp: new Date() };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        content: 'Unable to connect to AI service. Please try again.',
        cached: false,
        timestamp: new Date(),
      };
    }
  }

  async diagnoseAd(ad: AdData): Promise<AIResponse> {
    const cacheKey = `ad_diagnosis_${ad.ad_name}_${ad.performance?.clicks}`;
    const cached = await this.getCachedResponse(cacheKey);

    if (cached) {
      return { content: cached, cached: true, timestamp: new Date() };
    }

    const prompt = `You are Dr. Surgly, diagnosing an underperforming ad. Act like a medical doctor examining symptoms.

Ad Name: ${ad.ad_name}
Headline: ${ad.headline || 'Not provided'}
Ad Copy: ${ad.ad_copy || 'Not provided'}
CTA: ${ad.cta_type || 'Not provided'}

Performance:
- Impressions: ${ad.performance?.impressions?.toLocaleString() || 0}
- Clicks: ${ad.performance?.clicks?.toLocaleString() || 0}
- Spend: $${ad.performance?.spend?.toFixed(2) || 0}
- Conversions: ${ad.performance?.conversions || 0}

Provide a medical-style diagnosis:
1. SYMPTOMS: What's wrong with this ad?
2. DIAGNOSIS: Root causes (creative fatigue, poor targeting, weak copy, etc.)
3. PRESCRIPTION: Specific treatments with expected outcomes
4. PROGNOSIS: What happens if changes are made vs. not made

Use medical terminology creatively but keep it accessible.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are Dr. Surgly, the AI Ads Doctor. You diagnose advertising problems like a skilled physician diagnoses patients. You are thorough, compassionate, and always provide a clear treatment plan.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1200,
      });

      const content = response.choices[0]?.message?.content || 'Unable to generate diagnosis';
      await this.setCachedResponse(cacheKey, content);

      return { content, cached: false, timestamp: new Date() };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        content: 'Unable to connect to AI service. Please try again.',
        cached: false,
        timestamp: new Date(),
      };
    }
  }

  async generateCreativeInsights(creative: {
    headline?: string;
    body?: string;
    imageUrl?: string;
    cta?: string;
  }): Promise<AIResponse> {
    const cacheKey = `creative_insights_${creative.headline}_${creative.body}`;
    const cached = await this.getCachedResponse(cacheKey);

    if (cached) {
      return { content: cached, cached: true, timestamp: new Date() };
    }

    const prompt = `Analyze this ad creative and provide insights:

Headline: ${creative.headline || 'Not provided'}
Body Copy: ${creative.body || 'Not provided'}
CTA: ${creative.cta || 'Not provided'}
Has Image: ${creative.imageUrl ? 'Yes' : 'No'}

Provide:
1. Creative Health Score (0-100) with breakdown
2. Emotional tone analysis
3. Psychological triggers identified
4. Clarity and persuasion rating
5. 3 specific headline variations to test
6. 2 CTA improvements
7. Overall creative strategy recommendation

Be specific and actionable.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are Dr. Surgly, an expert in advertising psychology and creative optimization. You understand what makes ads convert and can articulate it clearly.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content || 'Unable to generate insights';
      await this.setCachedResponse(cacheKey, content);

      return { content, cached: false, timestamp: new Date() };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        content: 'Unable to connect to AI service. Please try again.',
        cached: false,
        timestamp: new Date(),
      };
    }
  }

  async validatePreLaunch(campaign: {
    objective: string;
    budget: number;
    targeting: string;
    creative: string;
    headline: string;
  }): Promise<AIResponse> {
    const prompt = `You are Dr. Surgly, conducting a pre-launch validation check. Be thorough but encouraging.

Campaign Details:
- Objective: ${campaign.objective}
- Budget: $${campaign.budget}
- Targeting: ${campaign.targeting}
- Creative: ${campaign.creative}
- Headline: ${campaign.headline}

Provide:
1. Readiness Score (0-100) with detailed breakdown
2. Traffic light assessment: 🟢 Green (good), 🟡 Yellow (caution), 🔴 Red (fix needed)
3. Estimated CTR range
4. Confidence level (Low/Medium/High)
5. Critical issues that must be fixed
6. Recommendations for improvement
7. Go/No-Go recommendation with reasoning

Be direct and helpful.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are Dr. Surgly, the gatekeeper who ensures campaigns are ready for launch. You prevent costly mistakes by catching issues early.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 1200,
      });

      const content = response.choices[0]?.message?.content || 'Unable to generate validation';

      return { content, cached: false, timestamp: new Date() };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        content: 'Unable to connect to AI service. Please try again.',
        cached: false,
        timestamp: new Date(),
      };
    }
  }

  async summarizePerformance(data: {
    period: string;
    totalSpend: number;
    totalConversions: number;
    avgRoas: number;
    campaigns: number;
  }): Promise<AIResponse> {
    const prompt = `Summarize this advertising performance period in a conversational, insightful way:

Period: ${data.period}
Total Spend: $${data.totalSpend.toFixed(2)}
Total Conversions: ${data.totalConversions}
Average ROAS: ${data.avgRoas.toFixed(2)}x
Active Campaigns: ${data.campaigns}

Provide:
1. Executive summary (2-3 sentences)
2. Key wins
3. Areas of concern
4. Strategic recommendations for next period
5. One surprising insight

Write as if speaking to a business owner who needs clarity, not complexity.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are Dr. Surgly, translating complex ad data into clear business insights. You help advertisers understand what their numbers actually mean.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content || 'Unable to generate summary';

      return { content, cached: false, timestamp: new Date() };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        content: 'Unable to connect to AI service. Please try again.',
        cached: false,
        timestamp: new Date(),
      };
    }
  }

  async trackUsage(feature: string): Promise<void> {
    try {
      await supabase.from('feature_usage').upsert({
        user_id: this.userId,
        feature_name: feature,
        usage_count: 1,
        last_used_at: new Date().toISOString(),
        reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch (error) {
      console.error('Usage tracking error:', error);
    }
  }
}

export function createAICore(userId: string): AICore {
  return new AICore(userId);
}

export function calculateHealthScore(metrics: {
  ctr?: number;
  cpc?: number;
  roas?: number;
  conversions?: number;
}): number {
  let score = 0;
  let factors = 0;

  if (metrics.ctr !== undefined) {
    factors++;
    if (metrics.ctr > 2) score += 30;
    else if (metrics.ctr > 1) score += 20;
    else if (metrics.ctr > 0.5) score += 10;
  }

  if (metrics.roas !== undefined) {
    factors++;
    if (metrics.roas > 4) score += 30;
    else if (metrics.roas > 2) score += 20;
    else if (metrics.roas > 1) score += 10;
  }

  if (metrics.cpc !== undefined) {
    factors++;
    if (metrics.cpc < 0.5) score += 20;
    else if (metrics.cpc < 1) score += 15;
    else if (metrics.cpc < 2) score += 10;
  }

  if (metrics.conversions !== undefined) {
    factors++;
    if (metrics.conversions > 50) score += 20;
    else if (metrics.conversions > 20) score += 15;
    else if (metrics.conversions > 5) score += 10;
  }

  return factors > 0 ? Math.round(score * (100 / (factors * 30))) : 50;
}
