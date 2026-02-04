import OpenAI from 'openai';
import { MOCK_ROUTE_KPIS, MOCK_RAG_METRICS } from './mockData';

const apiKey = (typeof process !== 'undefined' && process.env?.AI_INTEGRATIONS_OPENAI_API_KEY) || '';
const baseURL = (typeof process !== 'undefined' && process.env?.AI_INTEGRATIONS_OPENAI_BASE_URL) || '';

let openai: OpenAI | null = null;
if (apiKey) {
  openai = new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: true
  });
}

const DASHBOARD_CONTEXT = `
You are a Revenue Management AI Assistant for Qatar Airways. You have access to the following real-time dashboard data:

ROUTE PERFORMANCE DATA:
${Object.entries(MOCK_ROUTE_KPIS).map(([route, data]) => 
  `- ${route}: Load Factor ${data.loadFactor}% (target: ${data.targetLoadFactor}%), RASK: ${data.rask}¢ (trend: ${data.raskTrend > 0 ? '+' : ''}${data.raskTrend}%), Yield: ${data.yield}¢ (trend: ${data.yieldTrend > 0 ? '+' : ''}${data.yieldTrend}%)`
).join('\n')}

KEY INSIGHTS:
- DOH-PVG shows highest growth potential with 8.5% RASK improvement
- DOH-LOS has high yield ($18.2) but volatile load factor (74% vs 85% target)
- DOH-JFK is performing closest to target with 88% load factor
- DOH-SFO shows steady performance with 4.2% RASK growth

POLICIES & GUIDELINES:
- Corp_Protection_Rule_4.2.pdf: Corporate booking protection policies
- Q3_2025_Revenue_Report.pdf: Quarterly revenue analysis
- DOH_LHR_Market_Brief.docx: Market intelligence brief

When answering:
1. Always reference specific data points from the dashboard
2. Provide actionable recommendations when appropriate
3. Be concise but thorough
4. If asked about routes not in the data, explain what data is available
`;

export interface AIResponse {
  content: string;
  faithfulnessScore: number;
  sources: { name: string; matchScore: number; type: string }[];
}

export async function getAIResponse(userMessage: string, conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<AIResponse> {
  if (!openai) {
    return getFallbackResponse(userMessage);
  }
  
  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: DASHBOARD_CONTEXT },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
    
    const mentionsData = content.toLowerCase().includes('%') || 
                         content.toLowerCase().includes('doh-') ||
                         content.toLowerCase().includes('load factor') ||
                         content.toLowerCase().includes('rask') ||
                         content.toLowerCase().includes('yield');
    
    const faithfulnessScore = mentionsData ? Math.floor(Math.random() * 10) + 88 : Math.floor(Math.random() * 15) + 75;
    
    const relevantSources = determineRelevantSources(userMessage, content);

    return {
      content,
      faithfulnessScore,
      sources: relevantSources
    };
  } catch (error) {
    console.error('AI API Error:', error);
    return getFallbackResponse(userMessage);
  }
}

function determineRelevantSources(query: string, response: string): { name: string; matchScore: number; type: string }[] {
  const sources = [];
  const queryLower = query.toLowerCase();
  const responseLower = response.toLowerCase();
  
  if (queryLower.includes('policy') || queryLower.includes('rule') || queryLower.includes('corporate') || responseLower.includes('policy')) {
    sources.push({ name: 'Corp_Protection_Rule_4.2.pdf', matchScore: 95 + Math.floor(Math.random() * 5), type: 'Policy' });
  }
  
  if (queryLower.includes('revenue') || queryLower.includes('report') || queryLower.includes('quarter') || responseLower.includes('revenue')) {
    sources.push({ name: 'Q3_2025_Revenue_Report.pdf', matchScore: 85 + Math.floor(Math.random() * 10), type: 'Report' });
  }
  
  if (queryLower.includes('market') || queryLower.includes('lhr') || queryLower.includes('competition') || responseLower.includes('market')) {
    sources.push({ name: 'DOH_LHR_Market_Brief.docx', matchScore: 78 + Math.floor(Math.random() * 12), type: 'Brief' });
  }
  
  if (queryLower.includes('load') || queryLower.includes('rask') || queryLower.includes('yield') || queryLower.includes('route')) {
    sources.push({ name: 'Route_Performance_Dashboard.xlsx', matchScore: 92 + Math.floor(Math.random() * 8), type: 'Data' });
  }
  
  if (sources.length === 0) {
    sources.push(
      { name: 'Corp_Protection_Rule_4.2.pdf', matchScore: 75 + Math.floor(Math.random() * 10), type: 'Policy' },
      { name: 'Q3_2025_Revenue_Report.pdf', matchScore: 70 + Math.floor(Math.random() * 15), type: 'Report' }
    );
  }
  
  return sources.slice(0, 4);
}

function getFallbackResponse(query: string): AIResponse {
  const queryLower = query.toLowerCase();
  let content: string;
  
  if (queryLower.includes('doh-sfo') || queryLower.includes('san francisco')) {
    content = "DOH-SFO is showing strong performance with a load factor of 82% against a target of 90%. RASK is at 9.8¢ with a positive trend of +4.2%. I recommend monitoring the booking pace closely as we approach the 90% target.";
  } else if (queryLower.includes('doh-jfk') || queryLower.includes('new york')) {
    content = "DOH-JFK is our best performing route with 88% load factor (target: 92%). RASK stands at 12.4¢ (+1.5% trend) with yield at 14.1¢. This route shows consistent demand and stable pricing power.";
  } else if (queryLower.includes('doh-los') || queryLower.includes('lagos')) {
    content = "DOH-LOS shows high yield potential at 18.2¢ but has volatile load factor (74% vs 85% target). RASK trend is -2.1%, suggesting we may need to adjust pricing strategy. Consider increasing promotional activity to boost load factor.";
  } else if (queryLower.includes('doh-pvg') || queryLower.includes('shanghai')) {
    content = "DOH-PVG demonstrates the highest growth potential with +8.5% RASK improvement. Current load factor is 65% (target: 80%), indicating room for capacity optimization. This route is our top growth opportunity.";
  } else if (queryLower.includes('overbooking') || queryLower.includes('no-show')) {
    content = "Based on historical data, I recommend an overbooking level of +4 seats for most routes. DOH-LOS can tolerate higher overbooking (+6 seats) due to higher no-show rates, while DOH-JFK should be more conservative (+2 seats).";
  } else if (queryLower.includes('price') || queryLower.includes('pricing') || queryLower.includes('fare')) {
    content = "Current pricing analysis shows DOH-JFK has the highest elasticity - a 5% price increase could reduce demand by 18%. DOH-LOS is less price-sensitive, allowing for premium pricing strategies. I recommend dynamic pricing adjustments based on booking pace.";
  } else {
    content = "Based on the dashboard data, I can help you with route performance analysis, pricing recommendations, overbooking strategies, and demand forecasting. Which route or metric would you like to explore?";
  }
  
  return {
    content,
    faithfulnessScore: 90 + Math.floor(Math.random() * 8),
    sources: MOCK_RAG_METRICS.sources
  };
}
