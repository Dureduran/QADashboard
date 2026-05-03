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
    Timer,
    Sparkles,
    Lock,
    Activity,
} from 'lucide-react';
import { ChatMessage } from '../../types';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { cn } from '../../lib/utils';
import {
    getAIResponse,
    type AgentRun,
    type AIResponse,
    type VerifiedRecommendation,
} from '../../services/aiService';

type AssistantChatMessage = ChatMessage & {
    response?: AIResponse;
};

const INITIAL_AGENT_RUNS: AgentRun[] = [
    {
        id: 'rm-advisor',
        name: 'RM Advisor',
        shortName: 'A1',
        role: 'Inventory and revenue action',
        status: 'complete',
        detail: 'Ready to evaluate load, pickup, inventory class, and revenue risk.',
        accent: 'from-sky-500 to-cyan-300',
        auditEvents: ['Waiting for an analyst question.'],
    },
    {
        id: 'competitor-fares',
        name: 'Competitor Fares',
        shortName: 'A2',
        role: 'Market fare freshness',
        status: 'complete',
        detail: 'Ready to check competitor fare position and data freshness.',
        accent: 'from-violet-500 to-fuchsia-300',
        auditEvents: ['Waiting for a market context check.'],
    },
    {
        id: 'policy-verifier',
        name: 'Policy Verifier',
        shortName: 'A3',
        role: 'Rules and citations',
        status: 'complete',
        detail: 'Ready to validate corporate protection, yield floor, and stale-data rules.',
        accent: 'from-emerald-500 to-lime-300',
        auditEvents: ['Waiting to verify claims.'],
    },
    {
        id: 'synthesizer',
        name: 'Synthesizer',
        shortName: 'A4',
        role: 'Verified RM response',
        status: 'complete',
        detail: 'Ready to turn verified evidence into an analyst-safe recommendation.',
        accent: 'from-amber-500 to-orange-300',
        auditEvents: ['Waiting to compose the final RM card.'],
    },
];

const INITIAL_RECOMMENDATION: VerifiedRecommendation = {
    status: 'verified',
    action: 'Ready for analyst question',
    rationale: 'Ask an RM decision question and the assistant will show the agent audit trail before recommending an action.',
    confidence: 0,
    groundingScore: 100,
    evidence: ['Four deterministic RM agents are ready.'],
    risks: ['No action has been requested yet.'],
    triggers: ['Ask: Should we close K/L/M on DOH-SFO?'],
};

const INITIAL_METRICS: AIResponse = {
    content: '',
    faithfulnessScore: 100,
    recommendation: INITIAL_RECOMMENDATION.action,
    confidence: 0,
    abstained: false,
    sources: [
        { name: 'Corp_Protection_Rule_4.2.pdf', matchScore: 99, type: 'Policy', citation: '[Doc: Corp_Protection_Rule_4.2.pdf section 4.2]' },
        { name: 'DOH-SFO_Route_KPI_Snapshot.json', matchScore: 97, type: 'Dashboard', citation: '[Dashboard KPI: DOH-SFO]' },
        { name: 'Google Flights Competitive Fares', matchScore: 94, type: 'Market', citation: '[Google Flights API: 2026-01-28 08:45 AST]' },
    ],
    trace: INITIAL_AGENT_RUNS.map(({ name, role, status, detail }) => ({ name, role, status, detail })),
    agentRuns: INITIAL_AGENT_RUNS,
    auditEvents: INITIAL_AGENT_RUNS.flatMap(agent => agent.auditEvents.map(event => `${agent.name}: ${event}`)),
    verifiedRecommendation: INITIAL_RECOMMENDATION,
    claims: [],
    rules: [],
    objections: [],
    counterfactuals: ['This flips if competitor fares drop, pickup normalizes, or corporate protection is breached.'],
    reviewTriggers: INITIAL_RECOMMENDATION.triggers,
};

const QUICK_PROMPTS = [
    'Should we close K/L/M on DOH-SFO?',
    'How should we protect DOH-JFK?',
    'What should we do on DOH-PVG?',
    'How should we handle DOH-LOS?',
    'What is the right action for DOH-ZAG?',
    'Give recommendations for all dashboard routes.',
    'What if competitor fare data is stale for DOH-SFO?',
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

const ruleBadgeClass = {
    pass: 'border-emerald-900/50 bg-emerald-950/20 text-emerald-300',
    warning: 'border-amber-900/50 bg-amber-950/20 text-amber-300',
    blocked: 'border-red-900/50 bg-red-950/20 text-red-300',
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function formatElapsed(seconds: number) {
    return `${Math.max(seconds, 1)}s`;
}

function AgentAvatar({ agent, muted = false }: { agent: AgentRun; muted?: boolean }) {
    return (
        <div
            className={cn(
                'h-8 w-8 rounded-full bg-gradient-to-br p-[1px] shadow-sm',
                agent.accent,
                muted && 'opacity-35 grayscale'
            )}
            title={`${agent.name}: ${agent.role}`}
        >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950 text-[10px] font-bold text-slate-100">
                {agent.shortName}
            </div>
        </div>
    );
}

function AgentThinkingCard({
    agents,
    elapsedSeconds,
    isLive,
}: {
    agents: AgentRun[];
    elapsedSeconds: number;
    isLive: boolean;
}) {
    const visibleAgents = agents.length ? agents : INITIAL_AGENT_RUNS.slice(0, 1);
    const activeAgent = visibleAgents[visibleAgents.length - 1];
    const auditEvents = visibleAgents.flatMap(agent => agent.auditEvents.map(event => ({ agent, event })));
    const hasBlocker = visibleAgents.some(agent => agent.status === 'blocked');

    return (
        <div className="w-full rounded-md border border-slate-700/80 bg-slate-950/85 p-3 shadow-lg shadow-slate-950/30">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex -space-x-2">
                        {INITIAL_AGENT_RUNS.map(agent => (
                            <AgentAvatar key={agent.id} agent={agent} muted={!visibleAgents.some(item => item.id === agent.id)} />
                        ))}
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-slate-100">Agents thinking</span>
                            <span className="text-xs text-slate-500">{formatElapsed(elapsedSeconds)}</span>
                            {isLive && <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />}
                        </div>
                        <p className="truncate text-[11px] text-slate-500">
                            {activeAgent.name} - {activeAgent.role}
                        </p>
                    </div>
                </div>
                <Badge variant={hasBlocker ? 'destructive' : 'outline'} className="text-[10px]">
                    {hasBlocker ? 'Blocked check' : isLive ? 'Verifying' : 'Complete'}
                </Badge>
            </div>

            <div className="mt-3 grid gap-2 lg:grid-cols-2">
                {visibleAgents.map(agent => {
                    const Icon = statusIcon[agent.status];
                    return (
                        <div key={agent.id} className={cn('rounded-md border p-2.5', statusClass[agent.status])}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-bold">{agent.name}</p>
                                        <p className="truncate text-[10px] opacity-75">{agent.role}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] capitalize opacity-80">{agent.status}</span>
                            </div>
                            <p className="mt-2 text-[11px] leading-relaxed opacity-90">{agent.detail}</p>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 rounded-md border border-slate-800 bg-slate-900/70 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Activity className="h-3.5 w-3.5 text-indigo-400" />
                    Audit trail
                </div>
                <ul className="space-y-2">
                    {auditEvents.slice(-8).map(({ agent, event }, index) => (
                        <li key={`${agent.id}-${event}-${index}`} className="flex gap-2 text-[11px] leading-relaxed text-slate-400">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                            <span><span className="font-medium text-slate-300">{agent.name}:</span> {event}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function VerifiedRecommendationCard({ response }: { response: AIResponse }) {
    const recommendation = response.verifiedRecommendation;
    if (!recommendation) return null;

    const withheld = recommendation.status === 'withheld';
    const supportingClaims = response.claims?.filter(claim => claim.grounded).length || 0;
    const totalClaims = response.claims?.length || response.sources.length;

    return (
        <div className={cn(
            'w-full rounded-md border p-4',
            withheld ? 'border-amber-900/60 bg-amber-950/10' : 'border-emerald-900/60 bg-emerald-950/10'
        )}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {withheld ? <Lock className="h-3.5 w-3.5 text-amber-400" /> : <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}
                        Verified Recommendation
                    </div>
                    <h3 className="mt-2 text-base font-semibold leading-snug text-slate-100">{recommendation.action}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{recommendation.rationale}</p>
                </div>
                <Badge variant={withheld ? 'destructive' : 'outline'} className="text-[10px]">
                    {withheld ? 'Withheld' : 'Verified'}
                </Badge>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-2.5">
                    <div className="text-[10px] uppercase text-slate-500">Confidence</div>
                    <div className="text-lg font-bold text-slate-100">{Math.round(recommendation.confidence * 100)}%</div>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-2.5">
                    <div className="text-[10px] uppercase text-slate-500">Grounding</div>
                    <div className="text-lg font-bold text-slate-100">{recommendation.groundingScore}%</div>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-2.5">
                    <div className="text-[10px] uppercase text-slate-500">Claims</div>
                    <div className="text-lg font-bold text-slate-100">{supportingClaims}/{totalClaims || 0}</div>
                </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        Supporting evidence
                    </div>
                    <ul className="space-y-2">
                        {recommendation.evidence.map(item => (
                            <li key={item} className="text-[11px] leading-relaxed text-slate-400">{item}</li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-300">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                        Risks and triggers
                    </div>
                    <ul className="space-y-2">
                        {[...recommendation.risks, ...recommendation.triggers.slice(0, 2)].slice(0, 5).map(item => (
                            <li key={item} className="text-[11px] leading-relaxed text-slate-400">{item}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export const Assistant = () => {
    const [input, setInput] = React.useState('');
    const [messages, setMessages] = React.useState<AssistantChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Ask an RM decision question. I will show the RM Advisor, Competitor Fares, Policy Verifier, Synthesizer, and a final verified recommendation.',
            timestamp: new Date()
        }
    ]);
    const [isTyping, setIsTyping] = React.useState(false);
    const [currentMetrics, setCurrentMetrics] = React.useState<AIResponse>(INITIAL_METRICS);
    const [visibleAgentRuns, setVisibleAgentRuns] = React.useState<AgentRun[]>([]);
    const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
    const toast = useToast();
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages, visibleAgentRuns]);

    React.useEffect(() => {
        if (!isTyping) return;
        setElapsedSeconds(1);
        const timer = window.setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
        return () => window.clearInterval(timer);
    }, [isTyping]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMsg: AssistantChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        const userInput = input;
        setInput('');
        setVisibleAgentRuns([]);
        setElapsedSeconds(1);
        setIsTyping(true);

        try {
            const conversationHistory = messages
                .filter(m => m.id !== '1')
                .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

            const response = await getAIResponse(userInput, conversationHistory);
            const agentRuns = response.agentRuns || [];

            for (let index = 0; index < agentRuns.length; index += 1) {
                const partialAgents = agentRuns.slice(0, index + 1);
                setVisibleAgentRuns(partialAgents);
                setCurrentMetrics({
                    ...response,
                    agentRuns: partialAgents,
                    trace: partialAgents.map(({ name, role, status, detail }) => ({ name, role, status, detail })),
                });
                await wait(520);
            }

            await wait(220);
            setCurrentMetrics(response);

            const botMsg: AssistantChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.content,
                response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to generate response. Please try again.');
        } finally {
            setIsTyping(false);
            setVisibleAgentRuns([]);
        }
    };

    const handleViewCitations = () => {
        const grounded = currentMetrics.claims?.filter(claim => claim.grounded).length || 0;
        const total = currentMetrics.claims?.length || currentMetrics.sources.length;
        toast.info(`${grounded}/${total} claims grounded. Citations are visible in the Verifier panel.`);
    };

    const sidebarAgents = currentMetrics.agentRuns?.length ? currentMetrics.agentRuns : INITIAL_AGENT_RUNS;

    return (
        <div className="grid min-h-[760px] grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <Card className="flex h-[760px] min-w-0 flex-col overflow-hidden bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800 py-4">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <Bot className="h-5 w-5 shrink-0 text-indigo-400" />
                                <CardTitle className="truncate text-base text-slate-200">RM Assistant: Agent Decision Council</CardTitle>
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
                                    className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                <div className={cn('flex max-w-[92%] gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', msg.role === 'user' ? 'bg-slate-700' : 'bg-indigo-900/50')}>
                                        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-indigo-400" />}
                                    </div>
                                    <div className={cn(
                                        'min-w-0 rounded-md border p-3 text-sm leading-relaxed',
                                        msg.role === 'user'
                                            ? 'border-slate-700 bg-slate-800 text-slate-100'
                                            : 'border-indigo-900/50 bg-indigo-950/20 text-indigo-100'
                                    )}>
                                        <p>{msg.content}</p>
                                        {msg.response && (
                                            <div className="mt-4 space-y-3">
                                                <AgentThinkingCard agents={msg.response.agentRuns || []} elapsedSeconds={elapsedSeconds} isLive={false} />
                                                <VerifiedRecommendationCard response={msg.response} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="flex max-w-[92%] gap-2">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-900/50">
                                        <Sparkles className="h-4 w-4 text-indigo-400" />
                                    </div>
                                    <AgentThinkingCard agents={visibleAgentRuns} elapsedSeconds={elapsedSeconds} isLive />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </CardContent>
                <div className="border-t border-slate-800 p-4">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask: Should we close K/L/M on DOH-SFO?"
                            className="flex-1 bg-slate-950 border-slate-700"
                            disabled={isTyping}
                        />
                        <Button type="submit" size="icon" disabled={isTyping || !input.trim()} className="bg-indigo-600 hover:bg-indigo-500">
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </Card>

            <div className="h-[760px] min-w-0 space-y-4 overflow-y-auto pr-1">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-200">
                            <Workflow className="h-4 w-4 text-indigo-400" />
                            Agent Pipeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-2">
                        {sidebarAgents.map(step => {
                            const Icon = statusIcon[step.status];
                            return (
                                <div key={step.name} className={cn('rounded-md border p-2.5', statusClass[step.status])}>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Icon className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate text-xs font-bold">{step.name}</span>
                                        </div>
                                        <span className="shrink-0 text-[10px] opacity-80">{step.role}</span>
                                    </div>
                                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed opacity-90">{step.detail}</p>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-200">
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            Verifier & Rules
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
                                <div className="text-[10px] uppercase text-slate-500">Grounding</div>
                                <div className="text-lg font-bold text-slate-100">{currentMetrics.faithfulnessScore}%</div>
                            </div>
                            <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
                                <div className="text-[10px] uppercase text-slate-500">Confidence</div>
                                <div className="text-lg font-bold text-slate-100">{Math.round((currentMetrics.confidence || 0) * 100)}%</div>
                            </div>
                        </div>
                        {(currentMetrics.rules || []).slice(0, 4).map(rule => (
                            <div key={rule.name} className={cn('rounded-md border p-2', ruleBadgeClass[rule.status])}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-medium">{rule.name}</span>
                                    <span className="text-[10px] capitalize opacity-80">{rule.status}</span>
                                </div>
                                <p className="mt-1 text-[10px] leading-relaxed opacity-85">{rule.detail}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-200">
                                <GitBranch className="h-4 w-4 text-amber-400" />
                                Counterfactuals
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {(currentMetrics.objections || []).map(item => (
                                <p key={item} className="rounded-md border border-amber-900/40 bg-amber-950/10 p-2 text-[11px] leading-relaxed text-amber-200">{item}</p>
                            ))}
                            {(currentMetrics.counterfactuals || []).map(item => (
                                <p key={item} className="rounded-md border border-slate-800 bg-slate-950/60 p-2 text-[11px] leading-relaxed text-slate-300">{item}</p>
                            ))}
                        </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-200">
                                <Database className="h-4 w-4 text-indigo-400" />
                                Grounded Sources
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {currentMetrics.sources.map((source, idx) => (
                                <div key={`${source.name}-${idx}`} className="flex flex-col gap-1 rounded-md border border-slate-800/50 bg-slate-950/50 p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <FileText className="h-3 w-3 shrink-0 text-indigo-400" />
                                            <span className="truncate text-xs font-medium text-slate-300">{source.name}</span>
                                        </div>
                                        <Badge variant="outline" className="h-4 px-1 text-[9px]">{source.type}</Badge>
                                    </div>
                                    <p className="truncate text-[10px] text-slate-500">{source.citation || 'Source attached to verified claim'}</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
                                            <div
                                                className="h-full bg-indigo-500 transition-all duration-500"
                                                style={{ width: `${source.matchScore}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-slate-500">{source.matchScore}% Match</span>
                                    </div>
                                </div>
                            ))}

                            <Button variant="ghost" size="sm" onClick={handleViewCitations} className="mt-2 h-8 w-full text-xs text-slate-400">
                                View All Citations
                            </Button>
                        </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-200">
                                <Timer className="h-4 w-4 text-cyan-400" />
                                Verified Claims
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {(currentMetrics.claims || []).slice(0, 5).map((claim, idx) => (
                                <div key={`${claim.claim}-${idx}`} className="flex items-start gap-2 rounded-md border border-slate-800 bg-slate-950/60 p-2">
                                    {claim.grounded ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />}
                                    <div className="min-w-0">
                                        <p className="text-[11px] leading-relaxed text-slate-300">{claim.claim}</p>
                                        <p className="truncate text-[10px] text-slate-500">{claim.citation}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                </Card>
            </div>
        </div>
    );
};
