import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  Brain, Send, Lock, RefreshCw, Loader2, Clock,
  TrendingUp, TrendingDown, Minus, Heart, AlertTriangle,
  Lightbulb, Wallet, Sparkles, PiggyBank, Shield
} from 'lucide-react';
import { formatCurrency } from '@/lib/constants';
import { useStore } from '@/store/useStore';
import api from '@/lib/api';
import type { SpendingSummary, Anomaly, AiTips, FinancialHealth, RemainingQueries } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Helper to parse tips from AI response into array
const parseTips = (tipsText: string): string[] => {
  if (!tipsText) return [];

  // Try to split by numbered list (1. 2. 3.)
  const numberedPattern = /(?:^|\n)\s*\d+[.)]\s*/;
  const parts = tipsText.split(numberedPattern).filter(t => t.trim().length > 0);

  if (parts.length >= 2) {
    return parts.slice(0, 3).map(t => t.trim());
  }

  // Try splitting by bullet points
  const bulletPattern = /(?:^|\n)\s*[-•*]\s*/;
  const bulletParts = tipsText.split(bulletPattern).filter(t => t.trim().length > 0);

  if (bulletParts.length >= 2) {
    return bulletParts.slice(0, 3).map(t => t.trim());
  }

  // Try splitting by newlines
  const lines = tipsText.split('\n').filter(t => t.trim().length > 10);
  if (lines.length >= 2) {
    return lines.slice(0, 3).map(t => t.trim().replace(/^\d+[.)]\s*/, '').replace(/^[-•*]\s*/, ''));
  }

  // Return as single tip
  return [tipsText.trim()];
};

// Health score ring component
const HealthScoreRing = ({ score }: { score: number }) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };


  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#healthGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className={`${getColor()} [stop-color:currentColor]`} />
            <stop offset="100%" className={`${getColor()} [stop-color:currentColor] [stop-opacity:0.6]`} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-4xl font-display font-bold", getColor())}>{score}</span>
        <span className="text-xs text-muted-foreground">out of 100</span>
      </div>
    </div>
  );
};

// Locked overlay component for premium features - defined outside component to prevent re-renders
const LockedOverlay = React.memo(({ children, isLocked }: { children: React.ReactNode; isLocked: boolean }) => (
  <div className="relative">
    {isLocked && (
      <div className="absolute inset-0 z-10 bg-card/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center">
        <Lock className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm font-semibold text-foreground">Upgrade to unlock</p>
        <p className="text-xs text-muted-foreground">Available on Basic & Premium plans</p>
      </div>
    )}
    {children}
  </div>
));

export default function InsightsPage() {
  const { isPremiumFeatureAllowed } = useStore();
  const [summary, setSummary] = useState<SpendingSummary | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [predictions, setPredictions] = useState<any>(null);
  const [tips, setTips] = useState<AiTips | null>(null);
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [remaining, setRemaining] = useState<RemainingQueries | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [refreshingHealth, setRefreshingHealth] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canUseAI = isPremiumFeatureAllowed('ai-basic');

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = (seconds: number) => {
    setCooldownSeconds(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const refreshFinancialHealth = async () => {
    if (refreshingHealth) return;
    setRefreshingHealth(true);
    try {
      const res = await api.get('/api/ai/financial-health?refresh=true');
      setHealth(res.data);
      toast.success('Financial health updated!');
      const remRes = await api.get('/api/ai/remaining-queries').catch(() => null);
      if (remRes) setRemaining(remRes.data);
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || '';
      if (message.includes('rate') || message.includes('busy')) {
        toast.error('AI service is busy. Try again later.');
      } else {
        toast.error(message || 'Failed to refresh health score');
      }
    } finally {
      setRefreshingHealth(false);
    }
  };

  useEffect(() => {
    const promises = [
      api.get('/api/insights/summary').catch(() => null),
      api.get('/api/ai/remaining-queries').catch(() => null),
    ];
    if (canUseAI) {
      promises.push(
        api.get('/api/insights/predictions').catch(() => null),
        api.get('/api/insights/anomalies').catch(() => null),
        api.get('/api/insights/tips').catch(() => null),
        api.get('/api/ai/financial-health').catch(() => null),
      );
    }
    Promise.all(promises).then(([sumRes, remRes, predRes, anomRes, tipRes, healthRes]) => {
      if (sumRes) setSummary(sumRes.data);
      if (remRes) setRemaining(remRes.data);
      if (predRes) setPredictions(predRes.data);
      if (anomRes) setAnomalies(anomRes.data || []);
      if (tipRes) setTips(tipRes.data);
      if (healthRes) setHealth(healthRes.data);
    }).finally(() => setLoading(false));
  }, [canUseAI]);

  const askAI = async () => {
    if (!question.trim() || cooldownSeconds > 0) return;
    setAsking(true);
    setAnswer('');
    try {
      const res = await api.post('/api/ai/ask', { question });
      setAnswer(res.data.answer);
      setQuestion('');
      const remRes = await api.get('/api/ai/remaining-queries').catch(() => null);
      if (remRes) setRemaining(remRes.data);
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.response?.data?.error || '';

      if (status === 403) {
        toast.error('Upgrade to use AI features');
      } else if (status === 429 || message.includes('rate') || message.includes('busy')) {
        const minutesMatch = message.match(/(\d+)\s*minute/);
        const cooldownMinutes = minutesMatch ? parseInt(minutesMatch[1]) : 2;
        startCooldown(cooldownMinutes * 60);
        toast.error(`AI service is rate limited. Please wait ${cooldownMinutes} minutes.`);
        setAnswer(`⏳ The AI service is currently rate limited. Please wait ${cooldownMinutes} minutes before trying again.`);
      } else if (message.includes('temporarily unavailable')) {
        startCooldown(60);
        toast.error('AI service temporarily unavailable');
        setAnswer('⏳ ' + message);
      } else {
        toast.error(message || 'Failed to get answer. Please try again.');
      }
    } finally { setAsking(false); }
  };

  if (loading) return <LoadingSpinner />;


  // Parse tips into array
  const tipsList = tips ? parseTips(tips.tips) : [];


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-foreground">AI Insights</h2>
        {remaining && (
          <Badge variant="outline" className="gap-1">
            <Brain className="w-3 h-3" />
            {remaining.remaining} queries left
          </Badge>
        )}
      </div>

      {/* Query Usage Bar */}
      {remaining && (
        <Card className="bg-gradient-to-r from-primary/5 to-income/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">AI Query Usage</span>
              </div>
              <span className="text-sm text-muted-foreground">{remaining.used}/{remaining.limit} used</span>
            </div>
            <Progress value={(remaining.used / remaining.limit) * 100} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Spending Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Spending Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">This Month</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(summary.currentMonthSpending)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Last Month</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(summary.lastMonthSpending)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Daily Average</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(summary.dailyAverage)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Month Projection</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(summary.projectedMonthTotal)}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Badge
                variant={summary.trend === 'DOWN' ? 'default' : summary.trend === 'UP' ? 'destructive' : 'secondary' as 'default' | 'destructive' | 'secondary'}
                className="gap-1"
              >
                {summary.trend === 'DOWN' ? <TrendingDown className="w-3 h-3" /> :
                 summary.trend === 'UP' ? <TrendingUp className="w-3 h-3" /> :
                 <Minus className="w-3 h-3" />}
                {Math.abs(summary.comparedToLastMonth)}% vs last month
              </Badge>
              <span className="text-xs text-muted-foreground">
                Day {summary.daysPassed} of month • {summary.daysRemaining} days left
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Health - Improved */}
      <LockedOverlay isLocked={!canUseAI}>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-display flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Financial Health Score
            </CardTitle>
            {canUseAI && health && (
              <div className="flex items-center gap-2">
                {health.cached && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Clock className="w-3 h-3" />
                    Cached
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshFinancialHealth}
                  disabled={refreshingHealth}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={cn("w-4 h-4", refreshingHealth && "animate-spin")} />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {health ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left - Score Ring */}
                <div className="flex flex-col items-center justify-center py-4">
                  <HealthScoreRing score={health.healthScore} />
                  <Badge
                    className={cn(
                      "mt-4 text-sm px-4 py-1",
                      health.healthStatus === 'EXCELLENT' && "bg-green-500",
                      health.healthStatus === 'GOOD' && "bg-blue-500",
                      health.healthStatus === 'FAIR' && "bg-yellow-500",
                      health.healthStatus === 'POOR' && "bg-orange-500",
                      health.healthStatus === 'CRITICAL' && "bg-red-500"
                    )}
                  >
                    {health.healthStatus}
                  </Badge>
                </div>

                {/* Right - Details */}
                <div className="space-y-4">
                  {/* Savings Rate */}
                  <div className="p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Savings Rate</span>
                      <span className={cn(
                        "text-lg font-bold",
                        health.savingsRate >= 20 ? "text-green-500" :
                        health.savingsRate >= 10 ? "text-blue-500" :
                        health.savingsRate >= 0 ? "text-yellow-500" : "text-red-500"
                      )}>
                        {health.savingsRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(100, Math.max(0, health.savingsRate * 2))}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {health.savingsRate >= 20 ? "Excellent! You're saving well." :
                       health.savingsRate >= 10 ? "Good progress. Aim for 20%." :
                       health.savingsRate >= 0 ? "Try to increase your savings." :
                       "You're spending more than earning."}
                    </p>
                  </div>

                  {/* AI Analysis */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-2 mb-2">
                      <Brain className="w-4 h-4 text-primary mt-0.5" />
                      <span className="text-sm font-medium text-foreground">AI Analysis</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {health.analysis}
                    </p>
                  </div>

                  {health.calculatedAt && (
                    <p className="text-xs text-muted-foreground text-right">
                      Updated: {new Date(health.calculatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No health data yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add some transactions to see your financial health</p>
              </div>
            )}
          </CardContent>
        </Card>
      </LockedOverlay>

      {/* AI Tips - Improved with cards */}
      <LockedOverlay isLocked={!canUseAI}>
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              AI Money-Saving Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tipsList.length > 0 ? (
              <div className="grid gap-4">
                {tipsList.map((tip, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-border/50"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-white",
                      index === 0 && "bg-gradient-to-br from-yellow-500 to-orange-500",
                      index === 1 && "bg-gradient-to-br from-blue-500 to-cyan-500",
                      index === 2 && "bg-gradient-to-br from-green-500 to-emerald-500"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground leading-relaxed">{tip}</p>
                    </div>
                  </div>
                ))}
                {tips && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <PiggyBank className="w-3 h-3" />
                      Based on ₹{tips.basedOnSpending?.toLocaleString()} spending
                    </span>
                    {tips.topCategory && (
                      <span>Top category: {tips.topCategory}</span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No tips available yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add more transactions to get personalized tips</p>
              </div>
            )}
          </CardContent>
        </Card>
      </LockedOverlay>

      {/* Anomalies */}
      <LockedOverlay isLocked={!canUseAI}>
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Unusual Spending Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            {anomalies.length > 0 ? (
              <div className="space-y-3">
                {anomalies.map((a) => (
                  <div key={a.transactionId} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        a.severity === 'HIGH' ? "bg-red-500/10" : "bg-yellow-500/10"
                      )}>
                        <AlertTriangle className={cn(
                          "w-5 h-5",
                          a.severity === 'HIGH' ? "text-red-500" : "text-yellow-500"
                        )} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.category} · {a.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-expense">{formatCurrency(a.amount)}</p>
                      <Badge variant={a.severity === 'HIGH' ? 'destructive' : 'secondary' as 'destructive' | 'secondary'} className="text-xs">
                        {a.percentageAboveAverage}% above avg
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-foreground font-medium">All Clear!</p>
                <p className="text-sm text-muted-foreground mt-1">No unusual spending patterns detected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </LockedOverlay>

      {/* Ask AI */}
      <LockedOverlay isLocked={!canUseAI}>
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Ask AI Anything
              </CardTitle>
              {cooldownSeconds > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.floor(cooldownSeconds / 60)}:{(cooldownSeconds % 60).toString().padStart(2, '0')}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); askAI(); }} className="flex gap-2">
              <Input
                placeholder="How can I save more money this month?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={asking || cooldownSeconds > 0}
                className="h-11"
              />
              <Button type="submit" disabled={asking || !question.trim() || cooldownSeconds > 0} className="h-11 px-6">
                {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>

            {cooldownSeconds > 0 && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Rate limited. Please wait {Math.ceil(cooldownSeconds / 60)} minute(s).
              </p>
            )}

            {answer && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-income/5 border border-primary/20">
                <div className="flex items-start gap-2 mb-2">
                  <Brain className="w-4 h-4 text-primary mt-0.5" />
                  <span className="text-sm font-medium text-foreground">AI Response</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{answer}</p>
              </div>
            )}

            {/* Quick questions */}
            <div className="mt-4 flex flex-wrap gap-2">
              {['How can I reduce expenses?', 'Should I invest more?', 'What is 50-30-20 rule?'].map((q) => (
                <Button
                  key={q}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setQuestion(q)}
                  disabled={asking || cooldownSeconds > 0}
                >
                  {q}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </LockedOverlay>
    </div>
  );
}

