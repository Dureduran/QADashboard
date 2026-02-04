import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Send, Bot, User, FileText, ShieldCheck, Database, Loader2 } from 'lucide-react';
import { ChatMessage } from '../../types';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { getAIResponse, type AIResponse } from '../../services/aiService';

export const Assistant = () => {
    const [input, setInput] = React.useState('');
    const [messages, setMessages] = React.useState<ChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hello. I can assist with policy queries, historical comparisons, route analysis, or demand simulations. How can I help today?',
            timestamp: new Date()
        }
    ]);
    const [isTyping, setIsTyping] = React.useState(false);
    const [processingStep, setProcessingStep] = React.useState('');
    const [currentMetrics, setCurrentMetrics] = React.useState<AIResponse>({
        content: '',
        faithfulnessScore: 92,
        sources: [
            { name: 'Corp_Protection_Rule_4.2.pdf', matchScore: 98, type: 'Policy' },
            { name: 'Q3_2025_Revenue_Report.pdf', matchScore: 85, type: 'Report' },
            { name: 'DOH_LHR_Market_Brief.docx', matchScore: 78, type: 'Brief' }
        ]
    });
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
            setProcessingStep('Retrieving relevant documents...');
            await new Promise(resolve => setTimeout(resolve, 400));

            setProcessingStep('Analyzing dashboard context...');
            await new Promise(resolve => setTimeout(resolve, 300));

            setProcessingStep('Generating response with RAG...');
            
            const conversationHistory = messages
                .filter(m => m.id !== '1')
                .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
            
            const response = await getAIResponse(userInput, conversationHistory);

            setCurrentMetrics({
                content: response.content,
                faithfulnessScore: response.faithfulnessScore,
                sources: response.sources
            });

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

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[700px]">
            <Card className="flex-1 flex flex-col h-full bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800 py-4">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-indigo-400" />
                        <CardTitle className="text-slate-200 text-base">RM Co-Pilot (Beta)</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-indigo-900/50'}`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-400" />}
                                </div>
                                <div className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-slate-800 text-slate-100' : 'bg-indigo-950/30 border border-indigo-900/50 text-indigo-100'}`}>
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
                            placeholder="Ask about routes, pricing, or demand..."
                            className="flex-1 bg-slate-950 border-slate-700"
                            disabled={isTyping}
                        />
                        <Button type="submit" size="icon" disabled={isTyping || !input.trim()} className="bg-indigo-600 hover:bg-indigo-500">
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </Card>

            <div className="w-full lg:w-80 flex flex-col gap-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Faithfulness Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-4 pb-6">
                        <div className="relative w-40 h-24 flex items-end justify-center">
                            <svg viewBox="0 0 200 100" className="w-full h-full">
                                <path
                                    d="M 20 100 A 80 80 0 0 1 180 100"
                                    fill="none"
                                    stroke="#334155"
                                    strokeWidth="16"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M 20 100 A 80 80 0 0 1 180 100"
                                    fill="none"
                                    stroke="url(#gaugeGradient)"
                                    strokeWidth="16"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(currentMetrics.faithfulnessScore / 100) * 251.2} 251.2`}
                                    className="transition-all duration-1000"
                                />
                                <defs>
                                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#ef4444" />
                                        <stop offset="50%" stopColor="#f59e0b" />
                                        <stop offset="100%" stopColor="#10b981" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute bottom-0 text-center">
                                <div className="text-3xl font-bold text-slate-100">{currentMetrics.faithfulnessScore}%</div>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 mt-3 text-center px-4">
                            Probability that the answer is derived solely from retrieved context.
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 flex-1">
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

                        <Button variant="ghost" size="sm" className="w-full text-xs text-slate-400 h-8 mt-2">
                            View All Citations
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
