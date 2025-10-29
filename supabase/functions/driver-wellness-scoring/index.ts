import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WellnessAnalysisRequest {
  driver_id: string;
  period_days?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { driver_id, period_days = 30 }: WellnessAnalysisRequest = await req.json();

    console.log('Analyzing driver wellness:', { driver_id, period_days });

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period_days);

    // Fetch wellness logs for the period
    const { data: wellnessLogs, error: logsError } = await supabase
      .from('driver_wellbeing_logs')
      .select('*')
      .eq('driver_id', driver_id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (logsError) throw logsError;

    if (!wellnessLogs || wellnessLogs.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No wellness data found for this period'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate scores
    const totalLogs = wellnessLogs.length;
    
    // Mood score (inverted: higher mood = better score)
    const avgMood = wellnessLogs.reduce((sum, log) => sum + (log.mood_rating || 5), 0) / totalLogs;
    const moodScore = (avgMood / 10) * 100;

    // Fatigue score (inverted: lower fatigue = better score)
    const avgFatigue = wellnessLogs.reduce((sum, log) => sum + (log.fatigue_level || 5), 0) / totalLogs;
    const fatigueScore = (1 - (avgFatigue / 10)) * 100;

    // Stress score (inverted: lower stress = better score)
    const avgStress = wellnessLogs.reduce((sum, log) => sum + (log.stress_level || 5), 0) / totalLogs;
    const stressScore = (1 - (avgStress / 10)) * 100;

    // Driving hours compliance
    const totalDrivingHours = wellnessLogs.reduce((sum, log) => sum + (log.driving_hours || 0), 0);
    const avgDailyHours = totalDrivingHours / period_days;
    const complianceScore = avgDailyHours <= 8 ? 100 : Math.max(0, 100 - ((avgDailyHours - 8) * 10));

    // Break compliance
    const totalBreakTime = wellnessLogs.reduce((sum, log) => sum + (log.break_duration_minutes || 0), 0);
    const avgBreakTimePerDay = totalBreakTime / period_days;
    const breakComplianceScore = Math.min(100, (avgBreakTimePerDay / 30) * 100); // 30 min/day target

    // Overall wellness score (weighted average)
    const wellnessScore = (
      (moodScore * 0.25) +
      (fatigueScore * 0.25) +
      (stressScore * 0.20) +
      (complianceScore * 0.20) +
      (breakComplianceScore * 0.10)
    );

    // Analyze trends
    const recentLogs = wellnessLogs.slice(-7); // Last 7 logs
    const recentAvgMood = recentLogs.reduce((sum, log) => sum + (log.mood_rating || 5), 0) / recentLogs.length;
    const recentAvgFatigue = recentLogs.reduce((sum, log) => sum + (log.fatigue_level || 5), 0) / recentLogs.length;
    
    const moodTrend = recentAvgMood > avgMood ? 'improving' : recentAvgMood < avgMood ? 'declining' : 'stable';
    const fatigueTrend = recentAvgFatigue < avgFatigue ? 'improving' : recentAvgFatigue > avgFatigue ? 'declining' : 'stable';

    // Generate recommendations
    const recommendations = [];
    const alerts = [];

    if (wellnessScore < 50) {
      alerts.push({
        severity: 'high',
        message: 'Overall wellness score is low. Immediate attention required.'
      });
      recommendations.push('Schedule a wellness consultation with your supervisor');
    }

    if (fatigueScore < 40) {
      alerts.push({
        severity: 'high',
        message: 'High fatigue levels detected consistently'
      });
      recommendations.push('Reduce driving hours and increase rest periods');
      recommendations.push('Ensure minimum 8 hours of sleep per night');
    }

    if (stressScore < 40) {
      alerts.push({
        severity: 'medium',
        message: 'Elevated stress levels detected'
      });
      recommendations.push('Practice stress management techniques');
      recommendations.push('Consider talking to a counselor or support staff');
    }

    if (avgDailyHours > 8) {
      alerts.push({
        severity: 'high',
        message: 'Exceeding maximum daily driving hours'
      });
      recommendations.push('Reduce daily driving hours to comply with regulations');
    }

    if (avgBreakTimePerDay < 15) {
      alerts.push({
        severity: 'medium',
        message: 'Insufficient break time'
      });
      recommendations.push('Take regular breaks - minimum 15 minutes every 4 hours');
    }

    if (moodTrend === 'declining') {
      recommendations.push('Monitor mood changes and seek support if needed');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current wellness practices');
      recommendations.push('Continue regular wellness check-ins');
    }

    const analyticsData = {
      driver_id,
      analysis_period_start: startDate.toISOString(),
      analysis_period_end: endDate.toISOString(),
      wellness_score: Math.round(wellnessScore * 10) / 10,
      fatigue_score: Math.round(fatigueScore * 10) / 10,
      stress_score: Math.round(stressScore * 10) / 10,
      mood_score: Math.round(moodScore * 10) / 10,
      compliance_score: Math.round(complianceScore * 10) / 10,
      total_driving_hours: totalDrivingHours,
      total_break_time_minutes: totalBreakTime,
      average_daily_hours: Math.round(avgDailyHours * 10) / 10,
      incidents_count: 0, // Would need to fetch from incidents table
      wellness_trends: {
        mood: { current: avgMood, trend: moodTrend },
        fatigue: { current: avgFatigue, trend: fatigueTrend },
        stress: { current: avgStress, trend: 'stable' }
      },
      recommendations,
      alerts
    };

    // Insert analytics
    const { error: insertError } = await supabase
      .from('driver_wellness_analytics')
      .insert(analyticsData);

    if (insertError) {
      console.error('Error inserting analytics:', insertError);
    }

    console.log('Wellness analysis completed:', { wellness_score: wellnessScore });

    return new Response(JSON.stringify({
      success: true,
      analytics: analyticsData,
      summary: {
        overall_score: Math.round(wellnessScore),
        risk_level: wellnessScore >= 70 ? 'low' : wellnessScore >= 50 ? 'medium' : 'high',
        total_logs: totalLogs,
        analysis_period_days: period_days
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in driver-wellness-scoring function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});