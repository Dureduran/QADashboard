import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {
    Send,
    Bot,
    User,
    FileText,
    Database,
    Loader2,
    Workflow,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    GitBranch,
} from 'lucide-react';
import { ChatMessage } from '../../types';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { cn } from '../../lib/utils';
import { getAIResponse, type AIResponse } from '../../services/aiService';

const INITIAL_METRICS: AIResponse = {
    content: '',
    faithfulnessScore: 100,
    recommendation: 'Ready for analyst question',
    confidence: 0,
    abstained: false,
    sources: [
        { name: 'Corp_Protection_Rule_4.2.pdf', matchScore: 99, type: 'Policy', citation: '[Doc: Corp_Protection_Rule_4.2.pdf section 4.2]' },
        { name: 'QR123_Booking_Curve_Snapshot.json', matchScore: 97, type: 'Dashboard', citation: '[Dashboard Snapshot: 2026-01-28 09:00 AST - QR123 DOH-LHR Economy]' },
        { name: 'Google Flights Competitive Fares', matchScore: 94, type: 'Market', citation: '[Google Flights API: 2026-01-28 08:45 AST]' },
    ],
    trace: [
        { name: 'Advisor', role: 'Initial RM action', status: 'complete', detail: 'Waiting for the analyst question.' },
        { name: 'Critic', role: 'RM objection review', status: 'complete', detail: 'Ready to challenge pickup, spill, dilution, and event risk.' },
        { name: 'Rules Engine', role: 'Deterministic checks', status: 'complete', detail: 'Ready to run stale-data, yield-floor, and approval checks.' },
        { name: 'Verifier', role: 'Claim grounding', status: 'complete', detail: 'Ready to verify every claim against cited sources.' },
    ],
    claims: [],
    rules: [],
    objections: [],
    counterfactuals: ['This flips if competitor fares drop, pickup normalizes, or corporate protection is breached.'],
    reviewTriggers: ['Ask: Should we close K/L/M on QR123 DOH-LHR D-7?'],
};

const QUICK_PROMPTS = [
    'Should we close K/L/M on QR123 DOH-LHR D-7?',
    'What if competitor fare data is stale?',
];

const statusClass = {
    complete: 'border-emerald-900/50 bg-emerald-950/20 text-emerald-300',
    warning: 'border-amber-900/50 bg-amber-950/20 text-amber-300',
    blocked: 'border-red-900/50 bg-red-950/20 text-red-300',
};

const statusIcon = {
    complete: CheckCircle2,
    warning: AlertTriangle,
    blocked: XCircle,
};

export const Assistant = () => {
    const [input, setInput] = React.useState('');
    const [messages, setMessages] = React.useState<ChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Ask an RM decision question. I will show the Advisor, Critic, Rules Engine, Verifier, and final Decision Rationale.',
            timestamp: new Date()
        }
    ]);
    const [isTyping, setIsTyping] = React.useState(false);
    const [processingStep, setProcessingStep] = React.useState('');
    const [currentMetrics, setCurrentMetrics] = React.useState<AIResponse>(INITIAL_METRICS);
    const toast = useToast();
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        const userInput = input;
        setInput('');
        setIsTyping(true);

        try {
            setProcessingStep('Research Agent building RM Snapshot...');
            await new Promise(resolve => setTimeout(resolve, 300));

            setProcessingStep('Advisor proposing one RM action...');
            await new Promise(resolve => setTimeout(resolve, 300));

            setProcessingStep('Critic challenging the action...');
            await new Promise(resolve => setTimeout(resolve, 300));

            setProcessingStep('Rules Engine and Verifier grounding claims...');

            const conversationHistory = messages
                .filter(m => m.id !== '1')
                .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

            const response = await getAIResponse(userInput, conversationHistory);

            setCurrentMetrics(response);

            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.content,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to generate response. Please try again.');
        } finally {
            setIsTyping(false);
            setProcessingStep('');
        }
    };

    const handleViewCitations = () => {
        const grounded = currentMetrics.claims?.filter(claim => claim.grounded).length || 0;
        const total = currentMetrics.claims?.length || currentMetrics.sources.length;
        toast.info(`${grounded}/${total} claims grounded. Citations are visible in the Verifier panel.`);
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 min-h-[700px]">
            <Card className="flex flex-col h-[700px] bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800 py-4">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Bot className="w-5 h-5 text-indigo-400" />
                                <CardTitle className="text-slate-200 text-base">RM Assistant: Decision Rationale</CardTitle>
                            </div>
                            <Badge variant={currentMetrics.abstained ? 'destructive' : 'outline'} className="text-[10px]">
                                {currentMetrics.abstained ? 'Abstained' : 'Grounded'}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_PROMPTS.map(prompt => (
                                <button
                                    key={prompt}
                                    type="button"
                                    onClick={() => setInput(prompt)}
                                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-2 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-indigo-900/50'}`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-400" />}
                                </div>
                                <div className={`p-3 rounded-lg text-sm leading-relaxed ${msg.role === 'user' ? 'bg-slate-800 text-slate-100' : 'bg-indigo-950/30 border border-indigo-900/50 text-indigo-100'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="flex gap-2 items-center">
                                <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>{processingStep || 'Processing...'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>
                <div className="p-4 border-t border-slate-800">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask: Should we close K/L/M on QR123 DOH-LHR D-7?"
                            className="flex-1 bg-slate-950 border-slate-700"
                            disabled={isTyping}
                        />
                        <Button type="submit" size="icon" disabled={isTyping || !input.trim()} className="bg-indigo-600 hover:bg-indigo-500">
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </Card>

            <div className="space-y-4">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <Workflow className="w-4 h-4 text-indigo-400" />
                            Agent Pipeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {currentMetrics.trace?.map(step => {
                            const Icon = statusIcon[step.status];
                            return (
                                <div key={step.name} className={cn('rounded border p-3', statusClass[step.status])}>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-3.5 h-3.5" />
                                            <span className="text-xs font-bold">{step.name}</span>
                                        </div>
                                        <span className="text-[10px] opacity-80">{step.role}</span>
                                    </div>
                                    <p className="mt-1 text-[11px] leading-relaxed opacity-90">{step.detail}</p>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Verifier & Rules
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded border border-slate-800 bg-slate-950 p-3">
                                <div className="text-[10px] text-slate-500 uppercase">Grounding</div>
                                <div className="text-lg font-bold text-slate-100">{currentMetrics.faithfulnessScore}%</div>
                            </div>
                            <div className="rounded border border-slate-800 bg-slate-950 p-3">
                                <div className="text-[10px] text-slate-500 uppercase">Confidence</div>
                                <div className="text-lg font-bold text-slate-100">{Math.round((currentMetrics.confidence || 0) * 100)}%</div>
                            </div>
                        </div>
                        {(currentMetrics.rules || []).slice(0, 4).map(rule => (
                            <div key={rule.name} className="rounded border border-slate-800 bg-slate-950/60 p-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-medium text-slate-300">{rule.name}</span>
                                    <Badge variant={rule.status === 'blocked' ? 'destructive' : 'outline'} className="text-[9px]">{rule.status}</Badge>
                                </div>
                                <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">{rule.detail}</p>
                            </div>
                        ))}
                        {(currentMetrics.claims || []).slice(0, 5).map((claim, idx) => (
                            <div key={`${claim.claim}-${idx}`} className="flex items-start gap-2">
                                {claim.grounded ? <CheckCircle2 className="mt-0.5 w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <XCircle className="mt-0.5 w-3.5 h-3.5 text-red-400 shrink-0" />}
                                <div>
                                    <p className="text-[11px] text-slate-300 leading-relaxed">{claim.claim}</p>
                                    <p className="text-[10px] text-slate-500">{claim.citation}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <GitBranch className="w-4 h-4 text-amber-400" />
                            Counterfactuals
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {(currentMetrics.objections || []).map(item => (
                            <p key={item} className="rounded border border-amber-900/40 bg-amber-950/10 p-2 text-[11px] text-amber-200 leading-relaxed">{item}</p>
                        ))}
                        {(currentMetrics.counterfactuals || []).map(item => (
                            <p key={item} className="rounded border border-slate-800 bg-slate-950/60 p-2 text-[11px] text-slate-300 leading-relaxed">{item}</p>
                        ))}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <Database className="w-4 h-4 text-indigo-400" />
                            Grounded Sources
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {currentMetrics.sources.map((source, idx) => (
                            <div key={idx} className="flex flex-col gap-1 p-3 bg-slate-950/50 rounded border border-slate-800/50">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="w-3 h-3 text-indigo-400 shrink-0" />
                                        <span className="text-xs text-slate-300 truncate font-medium">{source.name}</span>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] h-4 px-1">{source.type}</Badge>
                                </div>
                                <p className="text-[10px] text-slate-500 truncate">{source.citation || 'Source attached to verified claim'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 transition-all duration-500"
                                            style={{ width: `${source.matchScore}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-500">{source.matchScore}% Match</span>
                                </div>
                            </div>
                        ))}

                        <Button variant="ghost" size="sm" onClick={handleViewCitations} className="w-full text-xs text-slate-400 h-8 mt-2">
                            View All Citations
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
