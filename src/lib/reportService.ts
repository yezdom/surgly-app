import { supabase } from './supabase';
import { LandingPageAuditResult } from './validationService';
import { LandingPageExtraction } from './fetchLandingContent';

export interface AIReport {
  id: string;
  user_id: string;
  ad_account_id?: string;
  report_type: 'pre_launch' | 'facebook_analysis';
  landing_url?: string;
  headline?: string;
  body_text?: string;
  primary_text?: string;
  description?: string;
  cta?: string;
  clarity_score: number;
  compliance?: string;
  conversion_score: number;
  emotional_appeal?: number;
  predicted_engagement?: number;
  recommendations: string[];
  emotional_hooks?: string[];
  unique_selling_points?: string[];
  missing_elements?: string[];
  visual_cohesion?: string;
  dr_surgly_prescription?: string;
  extracted_images?: string[];
  created_at: string;
  updated_at: string;
}

export interface TierLimits {
  maxAccounts: number;
  canExport: boolean;
  canEmail: boolean;
  canWhiteLabel: boolean;
  reportAccess: 'demo' | 'limited' | 'full';
}

export const TIER_LIMITS: Record<string, TierLimits> = {
  Free: {
    maxAccounts: 1,
    canExport: false,
    canEmail: false,
    canWhiteLabel: false,
    reportAccess: 'demo',
  },
  Starter: {
    maxAccounts: 3,
    canExport: false,
    canEmail: true,
    canWhiteLabel: false,
    reportAccess: 'full',
  },
  Pro: {
    maxAccounts: 5,
    canExport: true,
    canEmail: true,
    canWhiteLabel: false,
    reportAccess: 'full',
  },
  Agency: {
    maxAccounts: 10,
    canExport: true,
    canEmail: true,
    canWhiteLabel: true,
    reportAccess: 'full',
  },
};

export function getTierLimits(tier: string): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.Free;
}

export async function savePreLaunchReport(
  userId: string,
  landingUrl: string,
  result: LandingPageAuditResult,
  extraction?: LandingPageExtraction
): Promise<{ success: boolean; reportId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('ai_reports')
      .insert({
        user_id: userId,
        report_type: 'pre_launch',
        landing_url: landingUrl,
        headline: result.suggestedAdCopy.headline,
        body_text: result.suggestedAdCopy.primaryText,
        primary_text: result.suggestedAdCopy.primaryText,
        description: result.suggestedAdCopy.description,
        cta: result.suggestedAdCopy.cta,
        clarity_score: result.clarityScore,
        compliance: result.complianceLevel,
        conversion_score: result.conversionReadiness,
        emotional_appeal: result.emotionalAppeal,
        predicted_engagement: result.predictedEngagement,
        recommendations: result.recommendations,
        emotional_hooks: result.emotionalHooks,
        unique_selling_points: result.uniqueSellingPoints,
        missing_elements: result.missingElements,
        visual_cohesion: result.visualCohesion,
        dr_surgly_prescription: result.drSurglyPrescription,
        extracted_images: extraction?.images || [],
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving pre-launch report:', error);
      return { success: false, error: error.message };
    }

    return { success: true, reportId: data.id };
  } catch (error: any) {
    console.error('Error saving pre-launch report:', error);
    return { success: false, error: error.message };
  }
}

export async function getAIReports(
  userId: string,
  limit: number = 50
): Promise<{ reports: AIReport[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('ai_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching AI reports:', error);
      return { reports: [], error: error.message };
    }

    return { reports: data as AIReport[] };
  } catch (error: any) {
    console.error('Error fetching AI reports:', error);
    return { reports: [], error: error.message };
  }
}

export async function getReportById(
  reportId: string
): Promise<{ report: AIReport | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('ai_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) {
      console.error('Error fetching report:', error);
      return { report: null, error: error.message };
    }

    return { report: data as AIReport };
  } catch (error: any) {
    console.error('Error fetching report:', error);
    return { report: null, error: error.message };
  }
}

export async function deleteReport(
  reportId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('ai_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('Error deleting report:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting report:', error);
    return { success: false, error: error.message };
  }
}

export function canAccessFeature(tier: string, feature: keyof TierLimits): boolean {
  const limits = getTierLimits(tier);
  return limits[feature] as boolean;
}

export function getAccountLimit(tier: string): number {
  return getTierLimits(tier).maxAccounts;
}

export function isWithinAccountLimit(tier: string, currentAccounts: number): boolean {
  return currentAccounts < getAccountLimit(tier);
}
