import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    BarChart3, Target, Brain, Building2, ArrowRight,
    IndianRupee, Shield, Zap, Check
} from 'lucide-react';

const features = [
    { icon: BarChart3, title: 'Track Everything', desc: 'Monitor every expense and income with beautiful charts and analytics.' },
    { icon: Target, title: 'Budget Goals', desc: 'Set category budgets and get alerts before you overspend.' },
    { icon: Brain, title: 'AI Insights', desc: 'Get smart predictions, anomaly detection, and personalized tips.' },
    { icon: Building2, title: 'Bank Import', desc: 'Import transactions directly from your bank CSV statements.' },
];

const plans = [
    {
        name: 'Free', price: 0, period: '/mo',
        features: ['5 categories', 'Expense & Income tracking', 'Basic analytics', 'Budget goals'],
        cta: 'Get Started', popular: false,
    },
    {
        name: 'Basic', price: 99, period: '/mo',
        features: ['Unlimited categories', '5 AI queries/month', '3 CSV imports/month', 'Smart predictions', 'Anomaly detection'],
        cta: 'Start Basic', popular: true,
    },
    {
        name: 'Premium', price: 299, period: '/mo',
        features: ['Everything in Basic', '50 AI queries/month', 'Unlimited CSV imports', 'Savings strategy', 'Financial health score'],
        cta: 'Go Premium', popular: false,
    },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
                <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 md:px-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <IndianRupee className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-display font-bold text-lg text-foreground">Montrax</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to="/login">
                            <Button variant="ghost">Login</Button>
                        </Link>
                        <Link to="/register">
                            <Button>Sign Up</Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
                <section className="relative py-20 md:py-32 px-4 overflow-hidden">
                    {/* Background Image Layer */}
                    <div
                        className="absolute inset-0 z-0 scale-105"
                        style={{
                            backgroundImage: `url('/background-image.jpg')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            filter: 'blur(8px)',
                        }}
                    />
                    
                    {/* Dark Overlay - makes text readable */}
                    <div className="absolute inset-0 z-[1] bg-gradient-to-br from-background/85 via-background/80 to-primary/30" />
                    
                    <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                        <Zap className="w-4 h-4" />
                        AI-Powered Finance Tracking
                    </div>
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground leading-tight mb-6">
                        Take Control of<br />
                        <span className="text-primary">Your Finances</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                        Track expenses, set budgets, get AI-powered insights, and import bank statements — all in one beautiful dashboard.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Link to="/register">
                            <Button size="lg" className="gap-2 text-base px-8">
                                Get Started Free <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Secure</span>
                        <span className="flex items-center gap-1"><Zap className="w-4 h-4" /> Free to start</span>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-4 bg-muted/50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-display font-bold text-center text-foreground mb-12">
                        Everything you need to manage money
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((f) => (
                            <div key={f.title} className="bg-card rounded-xl p-6 border border-border card-hover">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                    <f.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
                                <p className="text-sm text-muted-foreground">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-display font-bold text-center text-foreground mb-4">Simple Pricing</h2>
                    <p className="text-center text-muted-foreground mb-12">Start free, upgrade when you need more.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`bg-card rounded-xl p-6 border-2 card-hover relative ${
                                    plan.popular ? 'border-primary shadow-lg' : 'border-border'
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                                        Popular
                                    </div>
                                )}
                                <h3 className="text-xl font-display font-bold text-foreground">{plan.name}</h3>
                                <div className="mt-3 mb-6">
                                    <span className="text-3xl font-display font-bold text-foreground">₹{plan.price}</span>
                                    <span className="text-muted-foreground">{plan.period}</span>
                                </div>
                                <ul className="space-y-2.5 mb-8">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                                            <Check className="w-4 h-4 text-income shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link to="/register">
                                    <Button className="w-full" variant={plan.popular ? 'default' : 'outline' as const}>
                                        {plan.cta}
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-border">
                <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
                    © 2026 Montrax. All rights reserved.
                </div>
            </footer>
        </div>
    );
}