// Trend Analysis & Historical Tracking for MAX Visibility System
// Analyzes historical performance patterns and provides predictive insights

import { 
  MaxAssessmentResult,
  MaxVisibilityScore,
  ScoringBreakdown
} from '@/types/max-visibility'
import { createClient } from '@/lib/supabase/client'

export interface TrendDataPoint {
  date: string
  overall_score: number
  mention_rate: number
  mention_quality: number
  source_influence: number
  competitive_positioning: number
  response_consistency: number
  questions_analyzed: number
  confidence_score: number
}

export interface TrendAnalysis {
  metric: string
  current_value: number
  trend_direction: 'upward' | 'downward' | 'stable' | 'volatile'
  change_rate: number // Change per time period
  change_percentage: number
  statistical_significance: number // 0-1 confidence in trend
  prediction_confidence: number // 0-1 confidence in forecast
  seasonality_detected: boolean
  volatility_score: number // 0-1, higher = more volatile
}

export interface PerformancePattern {
  pattern_type: 'seasonal' | 'cyclical' | 'growth' | 'decline' | 'plateau' | 'recovery'
  pattern_strength: number // 0-1 confidence in pattern
  pattern_duration: number // Days
  pattern_description: string
  next_expected_change: {
    direction: 'up' | 'down' | 'stable'
    confidence: number
    estimated_date: string
    estimated_magnitude: number
  }
}

export interface TrendAlert {
  alert_id: string
  alert_type: 'significant_change' | 'threshold_breach' | 'pattern_break' | 'anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  metric: string
  current_value: number
  previous_value: number
  change_percentage: number
  threshold: number
  description: string
  actionable_steps: string[]
  triggered_at: string
  company_id: string
}

export interface PredictiveInsight {
  metric: string
  forecast_horizon_days: number
  predictions: Array<{
    date: string
    predicted_value: number
    confidence_interval_lower: number
    confidence_interval_upper: number
    prediction_confidence: number
  }>
  risk_factors: string[]
  opportunity_factors: string[]
  recommendations: string[]
}

export interface TrendSummary {
  company_id: string
  analysis_period: {
    start_date: string
    end_date: string
    data_points: number
  }
  overall_trend: TrendAnalysis
  metric_trends: {
    mention_rate: TrendAnalysis
    mention_quality: TrendAnalysis
    source_influence: TrendAnalysis
    competitive_positioning: TrendAnalysis
    response_consistency: TrendAnalysis
  }
  detected_patterns: PerformancePattern[]
  predictive_insights: PredictiveInsight[]
  active_alerts: TrendAlert[]
  trend_health_score: number // 0-1 overall trend health
  key_insights: string[]
}

export class TrendAnalyzer {
  private supabase: ReturnType<typeof createClient>
  
  // Alert thresholds configuration
  private alertThresholds = {
    significant_change: 0.1, // 10% change
    critical_change: 0.25,   // 25% change
    low_performance: 0.3,    // Below 30%
    volatility: 0.15         // 15% volatility threshold
  }

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Analyze trends for a company across specified time period
   */
  async analyzeTrends(
    companyId: string,
    options: {
      days?: number
      include_predictions?: boolean
      alert_check?: boolean
    } = {}
  ): Promise<TrendSummary> {
    const { days = 90, include_predictions = true, alert_check = true } = options

    // Get historical data
    const historicalData = await this.getHistoricalData(companyId, days)
    
    if (historicalData.length < 2) {
      throw new Error('Insufficient historical data for trend analysis')
    }

    // Analyze overall trend
    const overallTrend = this.calculateTrendAnalysis(
      historicalData.map(d => ({ date: d.date, value: d.overall_score })),
      'overall_score'
    )

    // Analyze individual metric trends
    const metricTrends = {
      mention_rate: this.calculateTrendAnalysis(
        historicalData.map(d => ({ date: d.date, value: d.mention_rate })),
        'mention_rate'
      ),
      mention_quality: this.calculateTrendAnalysis(
        historicalData.map(d => ({ date: d.date, value: d.mention_quality })),
        'mention_quality'
      ),
      source_influence: this.calculateTrendAnalysis(
        historicalData.map(d => ({ date: d.date, value: d.source_influence })),
        'source_influence'
      ),
      competitive_positioning: this.calculateTrendAnalysis(
        historicalData.map(d => ({ date: d.date, value: d.competitive_positioning })),
        'competitive_positioning'
      ),
      response_consistency: this.calculateTrendAnalysis(
        historicalData.map(d => ({ date: d.date, value: d.response_consistency })),
        'response_consistency'
      )
    }

    // Detect patterns
    const detectedPatterns = this.detectPerformancePatterns(historicalData)

    // Generate predictive insights
    let predictiveInsights: PredictiveInsight[] = []
    if (include_predictions) {
      predictiveInsights = await this.generatePredictiveInsights(historicalData, metricTrends)
    }

    // Check for alerts
    let activeAlerts: TrendAlert[] = []
    if (alert_check) {
      activeAlerts = await this.checkAndGenerateAlerts(companyId, historicalData, metricTrends)
    }

    // Calculate trend health score
    const trendHealthScore = this.calculateTrendHealthScore(metricTrends, detectedPatterns)

    // Generate key insights
    const keyInsights = this.generateKeyInsights(overallTrend, metricTrends, detectedPatterns)

    return {
      company_id: companyId,
      analysis_period: {
        start_date: historicalData[0].date,
        end_date: historicalData[historicalData.length - 1].date,
        data_points: historicalData.length
      },
      overall_trend: overallTrend,
      metric_trends: metricTrends,
      detected_patterns: detectedPatterns,
      predictive_insights: predictiveInsights,
      active_alerts: activeAlerts,
      trend_health_score: trendHealthScore,
      key_insights: keyInsights
    }
  }

  /**
   * Get historical assessment data for trend analysis
   */
  private async getHistoricalData(companyId: string, days: number): Promise<TrendDataPoint[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await this.supabase
      .from('max_assessments')
      .select(`
        completed_at,
        visibility_scores,
        config
      `)
      .eq('company_id', companyId)
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString())
      .order('completed_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch historical data: ${error.message}`)
    }

    return (data || []).map(assessment => ({
      date: assessment.completed_at,
      overall_score: assessment.visibility_scores?.overall_score || 0,
      mention_rate: assessment.visibility_scores?.mention_rate || 0,
      mention_quality: assessment.visibility_scores?.mention_quality || 0,
      source_influence: assessment.visibility_scores?.source_influence || 0,
      competitive_positioning: assessment.visibility_scores?.competitive_positioning || 0,
      response_consistency: assessment.visibility_scores?.response_consistency || 0,
      questions_analyzed: assessment.visibility_scores?.total_questions || 0,
      confidence_score: assessment.config?.confidence_threshold || 0.8
    }))
  }

  /**
   * Calculate trend analysis for a specific metric
   */
  private calculateTrendAnalysis(
    dataPoints: Array<{ date: string; value: number }>,
    metric: string
  ): TrendAnalysis {
    if (dataPoints.length < 2) {
      throw new Error('Insufficient data points for trend analysis')
    }

    // Calculate basic statistics
    const values = dataPoints.map(d => d.value)
    const currentValue = values[values.length - 1]
    const previousValue = values[values.length - 2]
    const firstValue = values[0]

    // Calculate linear regression for trend direction
    const { slope, rSquared } = this.calculateLinearRegression(dataPoints)
    
    // Determine trend direction
    let trendDirection: TrendAnalysis['trend_direction'] = 'stable'
    if (Math.abs(slope) > 0.001) { // Significant slope threshold
      trendDirection = slope > 0 ? 'upward' : 'downward'
    }
    
    // Check for volatility
    const volatility = this.calculateVolatility(values)
    if (volatility > this.alertThresholds.volatility) {
      trendDirection = 'volatile'
    }

    // Calculate change metrics
    const changeRate = slope * 30 // Change per 30 days
    const changePercentage = previousValue !== 0 
      ? ((currentValue - previousValue) / previousValue) * 100 
      : 0

    // Check for seasonality
    const seasonalityDetected = this.detectSeasonality(dataPoints)

    return {
      metric,
      current_value: currentValue,
      trend_direction: trendDirection,
      change_rate: changeRate,
      change_percentage: changePercentage,
      statistical_significance: Math.min(rSquared, 1.0),
      prediction_confidence: this.calculatePredictionConfidence(dataPoints, volatility),
      seasonality_detected: seasonalityDetected,
      volatility_score: volatility
    }
  }

  /**
   * Detect performance patterns in historical data
   */
  private detectPerformancePatterns(historicalData: TrendDataPoint[]): PerformancePattern[] {
    const patterns: PerformancePattern[] = []

    // Detect growth patterns
    const growthPattern = this.detectGrowthPattern(historicalData)
    if (growthPattern) patterns.push(growthPattern)

    // Detect seasonal patterns
    const seasonalPattern = this.detectSeasonalPattern(historicalData)
    if (seasonalPattern) patterns.push(seasonalPattern)

    // Detect plateau patterns
    const plateauPattern = this.detectPlateauPattern(historicalData)
    if (plateauPattern) patterns.push(plateauPattern)

    // Detect recovery patterns
    const recoveryPattern = this.detectRecoveryPattern(historicalData)
    if (recoveryPattern) patterns.push(recoveryPattern)

    return patterns
  }

  /**
   * Generate predictive insights using trend analysis
   */
  private async generatePredictiveInsights(
    historicalData: TrendDataPoint[],
    metricTrends: TrendSummary['metric_trends']
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = []
    const forecastHorizon = 30 // 30 days

    // Generate predictions for each metric
    for (const [metricName, trend] of Object.entries(metricTrends)) {
      if (trend.prediction_confidence > 0.6) { // Only predict if confident
        const predictions = this.generateMetricPredictions(
          historicalData.map(d => ({ date: d.date, value: d[metricName as keyof TrendDataPoint] as number })),
          forecastHorizon
        )

        const riskFactors = this.identifyRiskFactors(trend, historicalData)
        const opportunityFactors = this.identifyOpportunityFactors(trend, historicalData)
        const recommendations = this.generatePredictiveRecommendations(trend, predictions)

        insights.push({
          metric: metricName,
          forecast_horizon_days: forecastHorizon,
          predictions,
          risk_factors: riskFactors,
          opportunity_factors: opportunityFactors,
          recommendations
        })
      }
    }

    return insights
  }

  /**
   * Check for alerts and generate new ones if needed
   */
  private async checkAndGenerateAlerts(
    companyId: string,
    historicalData: TrendDataPoint[],
    metricTrends: TrendSummary['metric_trends']
  ): Promise<TrendAlert[]> {
    const alerts: TrendAlert[] = []

    // Check each metric for alert conditions
    for (const [metricName, trend] of Object.entries(metricTrends)) {
      // Significant change alert
      if (Math.abs(trend.change_percentage) > this.alertThresholds.significant_change * 100) {
        alerts.push(this.createAlert(
          companyId,
          'significant_change',
          trend.change_percentage > this.alertThresholds.critical_change * 100 ? 'high' : 'medium',
          metricName,
          trend.current_value,
          trend.current_value * (1 - trend.change_percentage / 100),
          trend.change_percentage,
          this.alertThresholds.significant_change * 100,
          `Significant ${trend.change_percentage > 0 ? 'improvement' : 'decline'} in ${metricName}`
        ))
      }

      // Low performance alert
      if (trend.current_value < this.alertThresholds.low_performance) {
        alerts.push(this.createAlert(
          companyId,
          'threshold_breach',
          'high',
          metricName,
          trend.current_value,
          this.alertThresholds.low_performance,
          ((trend.current_value - this.alertThresholds.low_performance) / this.alertThresholds.low_performance) * 100,
          this.alertThresholds.low_performance,
          `${metricName} performance below acceptable threshold`
        ))
      }

      // Volatility alert
      if (trend.volatility_score > this.alertThresholds.volatility) {
        alerts.push(this.createAlert(
          companyId,
          'anomaly',
          'medium',
          metricName,
          trend.volatility_score,
          this.alertThresholds.volatility,
          ((trend.volatility_score - this.alertThresholds.volatility) / this.alertThresholds.volatility) * 100,
          this.alertThresholds.volatility,
          `High volatility detected in ${metricName}`
        ))
      }
    }

    return alerts
  }

  // Helper methods for trend calculations

  private calculateLinearRegression(dataPoints: Array<{ date: string; value: number }>): { slope: number; rSquared: number } {
    const n = dataPoints.length
    const xValues = dataPoints.map((_, i) => i) // Use index as x value
    const yValues = dataPoints.map(d => d.value)

    const sumX = xValues.reduce((sum, x) => sum + x, 0)
    const sumY = yValues.reduce((sum, y) => sum + y, 0)
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)
    const sumYY = yValues.reduce((sum, y) => sum + y * y, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate R-squared
    const yMean = sumY / n
    const totalSumSquares = yValues.reduce((sum, y) => sum + (y - yMean) ** 2, 0)
    const residualSumSquares = yValues.reduce((sum, y, i) => {
      const predicted = slope * xValues[i] + intercept
      return sum + (y - predicted) ** 2
    }, 0)
    const rSquared = 1 - (residualSumSquares / totalSumSquares)

    return { slope, rSquared }
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length
    const standardDeviation = Math.sqrt(variance)

    return mean > 0 ? standardDeviation / mean : 0 // Coefficient of variation
  }

  private detectSeasonality(dataPoints: Array<{ date: string; value: number }>): boolean {
    // Simple seasonality detection - would use more sophisticated methods in production
    if (dataPoints.length < 14) return false // Need at least 2 weeks of data

    const values = dataPoints.map(d => d.value)
    const weeklyPattern = this.checkWeeklyPattern(dataPoints)
    
    return weeklyPattern > 0.3 // 30% correlation threshold
  }

  private checkWeeklyPattern(dataPoints: Array<{ date: string; value: number }>): number {
    // Group by day of week and check for patterns
    const dayOfWeekGroups: { [key: number]: number[] } = {}
    
    dataPoints.forEach(point => {
      const dayOfWeek = new Date(point.date).getDay()
      if (!dayOfWeekGroups[dayOfWeek]) {
        dayOfWeekGroups[dayOfWeek] = []
      }
      dayOfWeekGroups[dayOfWeek].push(point.value)
    })

    // Calculate variance between days vs within days
    const dayAverages = Object.values(dayOfWeekGroups).map(values => 
      values.reduce((sum, val) => sum + val, 0) / values.length
    )
    
    if (dayAverages.length < 3) return 0 // Need at least 3 different days

    const overallMean = dayAverages.reduce((sum, avg) => sum + avg, 0) / dayAverages.length
    const betweenDayVariance = dayAverages.reduce((sum, avg) => sum + (avg - overallMean) ** 2, 0) / dayAverages.length

    const withinDayVariance = Object.values(dayOfWeekGroups).reduce((totalVar, values) => {
      if (values.length < 2) return totalVar
      const dayMean = values.reduce((sum, val) => sum + val, 0) / values.length
      const dayVar = values.reduce((sum, val) => sum + (val - dayMean) ** 2, 0) / values.length
      return totalVar + dayVar
    }, 0) / Object.keys(dayOfWeekGroups).length

    return withinDayVariance > 0 ? betweenDayVariance / withinDayVariance : 0
  }

  private calculatePredictionConfidence(dataPoints: Array<{ date: string; value: number }>, volatility: number): number {
    // Base confidence on data quantity, trend strength, and volatility
    const dataQualityScore = Math.min(dataPoints.length / 30, 1) // More data = higher confidence
    const volatilityPenalty = Math.max(0, 1 - volatility * 2) // Higher volatility = lower confidence
    
    return Math.max(0.1, dataQualityScore * volatilityPenalty)
  }

  private detectGrowthPattern(historicalData: TrendDataPoint[]): PerformancePattern | null {
    const scores = historicalData.map(d => d.overall_score)
    const { slope, rSquared } = this.calculateLinearRegression(
      historicalData.map((d, i) => ({ date: d.date, value: d.overall_score }))
    )

    if (slope > 0.001 && rSquared > 0.5) { // Positive growth with good fit
      return {
        pattern_type: 'growth',
        pattern_strength: rSquared,
        pattern_duration: historicalData.length,
        pattern_description: `Consistent growth pattern detected with ${(slope * 30 * 100).toFixed(1)}% monthly improvement`,
        next_expected_change: {
          direction: 'up',
          confidence: rSquared,
          estimated_date: this.addDays(new Date(historicalData[historicalData.length - 1].date), 7).toISOString(),
          estimated_magnitude: slope * 7 // 7 days forecast
        }
      }
    }

    return null
  }

  private detectSeasonalPattern(historicalData: TrendDataPoint[]): PerformancePattern | null {
    const seasonalStrength = this.checkWeeklyPattern(
      historicalData.map(d => ({ date: d.date, value: d.overall_score }))
    )

    if (seasonalStrength > 0.4) {
      return {
        pattern_type: 'seasonal',
        pattern_strength: seasonalStrength,
        pattern_duration: 7, // Weekly pattern
        pattern_description: `Weekly seasonal pattern detected with ${(seasonalStrength * 100).toFixed(1)}% regularity`,
        next_expected_change: {
          direction: 'stable',
          confidence: seasonalStrength,
          estimated_date: this.addDays(new Date(historicalData[historicalData.length - 1].date), 7).toISOString(),
          estimated_magnitude: 0.02 // Small seasonal variation
        }
      }
    }

    return null
  }

  private detectPlateauPattern(historicalData: TrendDataPoint[]): PerformancePattern | null {
    if (historicalData.length < 5) return null

    const recentData = historicalData.slice(-5) // Last 5 data points
    const volatility = this.calculateVolatility(recentData.map(d => d.overall_score))

    if (volatility < 0.05) { // Very low volatility = plateau
      return {
        pattern_type: 'plateau',
        pattern_strength: 1 - volatility,
        pattern_duration: recentData.length,
        pattern_description: `Performance plateau detected with low volatility (${(volatility * 100).toFixed(1)}%)`,
        next_expected_change: {
          direction: 'stable',
          confidence: 0.8,
          estimated_date: this.addDays(new Date(historicalData[historicalData.length - 1].date), 14).toISOString(),
          estimated_magnitude: 0.01
        }
      }
    }

    return null
  }

  private detectRecoveryPattern(historicalData: TrendDataPoint[]): PerformancePattern | null {
    if (historicalData.length < 6) return null

    const scores = historicalData.map(d => d.overall_score)
    const midPoint = Math.floor(scores.length / 2)
    const firstHalf = scores.slice(0, midPoint)
    const secondHalf = scores.slice(midPoint)

    const firstHalfAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length

    // Check if there was a dip followed by recovery
    const minScore = Math.min(...scores)
    const minIndex = scores.indexOf(minScore)
    const scoresAfterMin = scores.slice(minIndex + 1)

    if (scoresAfterMin.length > 0 && secondHalfAvg > firstHalfAvg * 1.1) {
      const recoveryStrength = (secondHalfAvg - firstHalfAvg) / firstHalfAvg

      return {
        pattern_type: 'recovery',
        pattern_strength: Math.min(recoveryStrength, 1),
        pattern_duration: scoresAfterMin.length,
        pattern_description: `Recovery pattern detected with ${(recoveryStrength * 100).toFixed(1)}% improvement`,
        next_expected_change: {
          direction: 'up',
          confidence: 0.7,
          estimated_date: this.addDays(new Date(historicalData[historicalData.length - 1].date), 7).toISOString(),
          estimated_magnitude: recoveryStrength / 4 // Conservative estimate
        }
      }
    }

    return null
  }

  private generateMetricPredictions(
    dataPoints: Array<{ date: string; value: number }>,
    horizonDays: number
  ): PredictiveInsight['predictions'] {
    const { slope } = this.calculateLinearRegression(dataPoints)
    const lastValue = dataPoints[dataPoints.length - 1].value
    const volatility = this.calculateVolatility(dataPoints.map(d => d.value))

    const predictions: PredictiveInsight['predictions'] = []
    const lastDate = new Date(dataPoints[dataPoints.length - 1].date)

    for (let i = 1; i <= horizonDays; i += 7) { // Weekly predictions
      const predictedValue = lastValue + (slope * i)
      const confidenceInterval = predictedValue * volatility * 2 // 2 sigma

      predictions.push({
        date: this.addDays(lastDate, i).toISOString(),
        predicted_value: Math.max(0, Math.min(1, predictedValue)), // Clamp to 0-1
        confidence_interval_lower: Math.max(0, predictedValue - confidenceInterval),
        confidence_interval_upper: Math.min(1, predictedValue + confidenceInterval),
        prediction_confidence: Math.max(0.1, 1 - (volatility * i / horizonDays)) // Confidence decreases over time
      })
    }

    return predictions
  }

  private identifyRiskFactors(trend: TrendAnalysis, historicalData: TrendDataPoint[]): string[] {
    const risks: string[] = []

    if (trend.trend_direction === 'downward') {
      risks.push('Declining performance trend detected')
    }

    if (trend.volatility_score > 0.15) {
      risks.push('High performance volatility may indicate instability')
    }

    if (trend.current_value < 0.3) {
      risks.push('Current performance below industry standards')
    }

    const recentPerformance = historicalData.slice(-3).map(d => d.overall_score)
    if (recentPerformance.every((score, i, arr) => i === 0 || score < arr[i - 1])) {
      risks.push('Consecutive performance decreases in recent assessments')
    }

    return risks
  }

  private identifyOpportunityFactors(trend: TrendAnalysis, historicalData: TrendDataPoint[]): string[] {
    const opportunities: string[] = []

    if (trend.trend_direction === 'upward') {
      opportunities.push('Positive momentum that can be accelerated')
    }

    if (trend.statistical_significance > 0.7) {
      opportunities.push('Strong statistical confidence in trend predictions')
    }

    if (trend.seasonality_detected) {
      opportunities.push('Predictable patterns can be leveraged for planning')
    }

    const recentImprovement = historicalData.slice(-2)
    if (recentImprovement.length === 2 && recentImprovement[1].overall_score > recentImprovement[0].overall_score) {
      opportunities.push('Recent improvement suggests effective optimizations')
    }

    return opportunities
  }

  private generatePredictiveRecommendations(trend: TrendAnalysis, predictions: PredictiveInsight['predictions']): string[] {
    const recommendations: string[] = []

    if (trend.trend_direction === 'downward') {
      recommendations.push('Implement immediate intervention strategies to reverse declining trend')
      recommendations.push('Conduct root cause analysis to identify performance inhibitors')
    }

    if (trend.volatility_score > 0.1) {
      recommendations.push('Focus on consistency improvements to reduce performance volatility')
      recommendations.push('Establish more predictable content and engagement strategies')
    }

    if (predictions.some(p => p.predicted_value < 0.4)) {
      recommendations.push('Proactive measures needed to prevent predicted performance decline')
    }

    if (trend.trend_direction === 'upward') {
      recommendations.push('Maintain current successful strategies and consider scaling')
      recommendations.push('Document successful practices for replication')
    }

    return recommendations
  }

  private calculateTrendHealthScore(
    metricTrends: TrendSummary['metric_trends'],
    patterns: PerformancePattern[]
  ): number {
    let healthScore = 0.5 // Base score

    // Positive trend directions increase health
    Object.values(metricTrends).forEach(trend => {
      if (trend.trend_direction === 'upward') healthScore += 0.1
      if (trend.trend_direction === 'downward') healthScore -= 0.15
      if (trend.volatility_score > 0.15) healthScore -= 0.05
    })

    // Positive patterns increase health
    patterns.forEach(pattern => {
      if (pattern.pattern_type === 'growth' || pattern.pattern_type === 'recovery') {
        healthScore += 0.1 * pattern.pattern_strength
      }
      if (pattern.pattern_type === 'decline') {
        healthScore -= 0.15 * pattern.pattern_strength
      }
    })

    return Math.max(0, Math.min(1, healthScore))
  }

  private generateKeyInsights(
    overallTrend: TrendAnalysis,
    metricTrends: TrendSummary['metric_trends'],
    patterns: PerformancePattern[]
  ): string[] {
    const insights: string[] = []

    // Overall trend insight
    if (overallTrend.trend_direction !== 'stable') {
      const direction = overallTrend.trend_direction === 'upward' ? 'improving' : 'declining'
      insights.push(`Overall AI visibility is ${direction} with ${Math.abs(overallTrend.change_percentage).toFixed(1)}% change`)
    }

    // Best performing metric
    const bestMetric = Object.entries(metricTrends).reduce((best, [name, trend]) => 
      trend.current_value > best.trend.current_value ? { name, trend } : best
    )
    insights.push(`${bestMetric.name.replace('_', ' ')} is your strongest metric at ${(bestMetric.trend.current_value * 100).toFixed(1)}%`)

    // Areas needing attention
    const weakMetrics = Object.entries(metricTrends).filter(([_, trend]) => 
      trend.current_value < 0.4 || trend.trend_direction === 'downward'
    )
    if (weakMetrics.length > 0) {
      insights.push(`Focus needed on: ${weakMetrics.map(([name]) => name.replace('_', ' ')).join(', ')}`)
    }

    // Pattern insights
    const growthPatterns = patterns.filter(p => p.pattern_type === 'growth')
    if (growthPatterns.length > 0) {
      insights.push(`Consistent growth patterns detected - maintain current strategies`)
    }

    const volatileMetrics = Object.entries(metricTrends).filter(([_, trend]) => trend.volatility_score > 0.15)
    if (volatileMetrics.length > 0) {
      insights.push(`High volatility in ${volatileMetrics.map(([name]) => name.replace('_', ' ')).join(', ')} - focus on consistency`)
    }

    return insights
  }

  private createAlert(
    companyId: string,
    alertType: TrendAlert['alert_type'],
    severity: TrendAlert['severity'],
    metric: string,
    currentValue: number,
    previousValue: number,
    changePercentage: number,
    threshold: number,
    description: string
  ): TrendAlert {
    const actionableSteps = this.getActionableStepsForAlert(alertType, metric, severity)

    return {
      alert_id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      alert_type: alertType,
      severity,
      metric,
      current_value: currentValue,
      previous_value: previousValue,
      change_percentage: changePercentage,
      threshold,
      description,
      actionable_steps: actionableSteps,
      triggered_at: new Date().toISOString(),
      company_id: companyId
    }
  }

  private getActionableStepsForAlert(alertType: TrendAlert['alert_type'], metric: string, severity: TrendAlert['severity']): string[] {
    const steps: string[] = []

    switch (alertType) {
      case 'significant_change':
        if (severity === 'high') {
          steps.push('Investigate immediate causes of performance change')
          steps.push('Review recent content and strategy modifications')
        }
        steps.push('Monitor closely over next 7 days')
        break

      case 'threshold_breach':
        steps.push(`Implement targeted improvements for ${metric.replace('_', ' ')}`)
        steps.push('Review competitor strategies and industry benchmarks')
        steps.push('Consider increasing content creation frequency')
        break

      case 'anomaly':
        steps.push('Investigate unusual performance patterns')
        steps.push('Check for external factors affecting visibility')
        steps.push('Validate data quality and measurement accuracy')
        break

      case 'pattern_break':
        steps.push('Analyze factors that disrupted established patterns')
        steps.push('Adjust strategies based on new performance dynamics')
        break
    }

    return steps
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }
} 