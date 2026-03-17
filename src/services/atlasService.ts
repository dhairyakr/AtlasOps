import { LLMService } from './llmService';
import { serperSearch } from './webSearchService';
import { supabase } from './supabaseClient';

export interface AtlasQuery {
  id: string;
  session_id: string;
  question: string;
  brief: string;
  regions: string[];
  mode: 'live' | 'reasoned';
  created_at: string;
}

export interface AtlasWatchlistEntry {
  id: string;
  session_id: string;
  question: string;
  regions: string[];
  last_brief: string;
  created_at: string;
}

export interface AtlasSignal {
  id: string;
  session_id: string;
  region: string;
  category: string;
  summary: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  trend: 'up' | 'down' | 'stable';
  source_query_id: string | null;
  created_at: string;
}

export interface IntelBrief {
  situation_summary: string;
  key_signals: Array<{ signal: string; region: string; severity: 'low' | 'medium' | 'high' | 'critical' }>;
  probability_assessments: Array<{ scenario: string; probability: number; timeframe: string }>;
  watchpoints: string[];
  confidence: number;
  raw_content: string;
}

const SIGNAL_CATEGORIES = ['Geopolitical', 'Economic', 'Environmental', 'Infrastructure', 'Public Health', 'Cyber'];

const REGION_KEYWORDS: Record<string, string[]> = {
  'North America': ['usa', 'united states', 'canada', 'mexico', 'north america'],
  'Europe': ['europe', 'eu', 'european union', 'nato', 'ukraine', 'germany', 'france'],
  'Middle East': ['middle east', 'iran', 'israel', 'saudi', 'iraq', 'syria', 'gulf', 'arab'],
  'East Asia': ['japan', 'south korea', 'taiwan', 'east asia', 'pacific'],
  'South Asia': ['south asia', 'pakistan', 'bangladesh', 'afghanistan', 'nepal', 'sri lanka'],
  'Southeast Asia': ['indonesia', 'vietnam', 'thailand', 'philippines', 'southeast asia', 'asean'],
  'Africa': ['africa', 'nigeria', 'ethiopia', 'kenya', 'south africa', 'sahel'],
  'Latin America': ['argentina', 'colombia', 'venezuela', 'latin america', 'south america'],
  'Central Asia': ['kazakhstan', 'uzbekistan', 'central asia', 'stans'],
  'Global': ['global', 'world', 'international', 'multilateral', 'un', 'united nations'],
  'Jammu & Kashmir': ['jammu', 'kashmir', 'j&k', 'jk', 'srinagar', 'leh'],
  'Ladakh': ['ladakh'],
  'Himachal Pradesh': ['himachal', 'shimla', 'manali'],
  'Punjab': ['punjab', 'amritsar', 'ludhiana', 'chandigarh'],
  'Uttarakhand': ['uttarakhand', 'uttaranchal', 'dehradun', 'haridwar'],
  'Haryana': ['haryana', 'gurugram', 'faridabad', 'panipat'],
  'Delhi': ['delhi', 'new delhi', 'ncr'],
  'Uttar Pradesh': ['uttar pradesh', 'lucknow', 'kanpur', 'varanasi', 'agra', 'noida', 'prayagraj', 'allahabad'],
  'Rajasthan': ['rajasthan', 'jaipur', 'jodhpur', 'udaipur', 'kota', 'bikaner'],
  'Bihar': ['bihar', 'patna', 'gaya', 'muzaffarpur'],
  'Sikkim': ['sikkim', 'gangtok'],
  'Arunachal Pradesh': ['arunachal', 'itanagar'],
  'Assam': ['assam', 'guwahati', 'dibrugarh', 'brahmaputra'],
  'Nagaland': ['nagaland', 'kohima', 'dimapur'],
  'Manipur': ['manipur', 'imphal'],
  'Mizoram': ['mizoram', 'aizawl'],
  'Tripura': ['tripura', 'agartala'],
  'Meghalaya': ['meghalaya', 'shillong'],
  'West Bengal': ['west bengal', 'kolkata', 'calcutta', 'darjeeling'],
  'Jharkhand': ['jharkhand', 'ranchi', 'jamshedpur', 'dhanbad'],
  'Odisha': ['odisha', 'orissa', 'bhubaneswar', 'cuttack', 'puri'],
  'Chhattisgarh': ['chhattisgarh', 'raipur', 'bilaspur'],
  'Madhya Pradesh': ['madhya pradesh', 'bhopal', 'indore', 'jabalpur', 'gwalior'],
  'Gujarat': ['gujarat', 'ahmedabad', 'surat', 'vadodara', 'gandhinagar', 'kutch'],
  'Maharashtra': ['maharashtra', 'mumbai', 'pune', 'nagpur', 'nashik', 'bombay', 'thane'],
  'Telangana': ['telangana', 'hyderabad', 'secunderabad', 'warangal'],
  'Andhra Pradesh': ['andhra pradesh', 'visakhapatnam', 'vijayawada', 'amaravati'],
  'Karnataka': ['karnataka', 'bengaluru', 'bangalore', 'mysuru', 'mysore', 'mangaluru', 'hubli'],
  'Kerala': ['kerala', 'thiruvananthapuram', 'trivandrum', 'kochi', 'cochin', 'kozhikode', 'calicut'],
  'Tamil Nadu': ['tamil nadu', 'chennai', 'madras', 'coimbatore', 'madurai', 'salem'],
  'Goa': ['goa', 'panaji'],
  'Andaman & Nicobar': ['andaman', 'nicobar', 'port blair'],
  'India': ['india', 'indian', 'hindustan', 'bharat', 'subcontinent'],
  'Maine': ['maine', 'augusta'],
  'New Hampshire': ['new hampshire', 'concord nh'],
  'Vermont': ['vermont', 'montpelier'],
  'Massachusetts': ['massachusetts', 'boston', 'cambridge ma'],
  'New York': ['new york', 'nyc', 'manhattan', 'brooklyn', 'albany'],
  'New Jersey': ['new jersey', 'trenton', 'newark'],
  'Pennsylvania': ['pennsylvania', 'philadelphia', 'pittsburgh', 'harrisburg'],
  'Maryland': ['maryland', 'baltimore', 'annapolis'],
  'Washington DC': ['washington dc', 'capitol hill', 'white house', 'pentagon', 'beltway'],
  'Virginia': ['virginia', 'richmond va', 'norfolk', 'arlington va'],
  'North Carolina': ['north carolina', 'raleigh', 'charlotte nc'],
  'South Carolina': ['south carolina', 'columbia sc', 'charleston sc'],
  'Georgia': ['georgia', 'atlanta', 'savannah ga'],
  'Florida': ['florida', 'miami', 'orlando', 'tallahassee', 'tampa', 'jacksonville'],
  'Alabama': ['alabama', 'montgomery', 'birmingham al'],
  'Mississippi': ['mississippi', 'jackson ms'],
  'Tennessee': ['tennessee', 'nashville', 'memphis', 'knoxville'],
  'Kentucky': ['kentucky', 'louisville', 'frankfort'],
  'West Virginia': ['west virginia', 'charleston wv'],
  'Arkansas': ['arkansas', 'little rock'],
  'Louisiana': ['louisiana', 'new orleans', 'baton rouge'],
  'Ohio': ['ohio', 'columbus', 'cleveland', 'cincinnati'],
  'Michigan': ['michigan', 'detroit', 'lansing', 'ann arbor'],
  'Indiana': ['indiana', 'indianapolis'],
  'Illinois': ['illinois', 'chicago', 'springfield il'],
  'Wisconsin': ['wisconsin', 'milwaukee', 'madison'],
  'Minnesota': ['minnesota', 'minneapolis', 'st paul'],
  'Iowa': ['iowa', 'des moines'],
  'Missouri': ['missouri', 'st louis', 'kansas city', 'jefferson city'],
  'North Dakota': ['north dakota', 'bismarck'],
  'South Dakota': ['south dakota', 'pierre sd'],
  'Nebraska': ['nebraska', 'lincoln ne', 'omaha'],
  'Kansas': ['kansas', 'topeka', 'wichita'],
  'Texas': ['texas', 'dallas', 'houston', 'austin', 'san antonio'],
  'Oklahoma': ['oklahoma', 'oklahoma city', 'tulsa'],
  'New Mexico': ['new mexico', 'santa fe', 'albuquerque'],
  'Arizona': ['arizona', 'phoenix', 'tucson', 'scottsdale'],
  'Montana': ['montana', 'helena mt', 'billings'],
  'Idaho': ['idaho', 'boise'],
  'Wyoming': ['wyoming', 'cheyenne'],
  'Colorado': ['colorado', 'denver', 'boulder co'],
  'Utah': ['utah', 'salt lake city'],
  'Nevada': ['nevada', 'las vegas', 'reno', 'carson city'],
  'California': ['california', 'los angeles', 'san francisco', 'san diego', 'sacramento', 'silicon valley'],
  'Oregon': ['oregon', 'portland or', 'salem or'],
  'Washington': ['washington state', 'seattle', 'olympia wa'],
  'Alaska': ['alaska', 'juneau', 'anchorage'],
  'Hawaii': ['hawaii', 'honolulu'],
  'USA': ['usa', 'united states', 'us economy', 'us military', 'american', 'congress', 'senate'],
  'Beijing': ['beijing', 'peking'],
  'Shanghai': ['shanghai'],
  'Guangdong': ['guangdong', 'guangzhou', 'shenzhen', 'canton'],
  'Hong Kong': ['hong kong', 'hksar'],
  'Xinjiang': ['xinjiang', 'uyghur', 'urumqi'],
  'Tibet': ['tibet', 'lhasa', 'tibetan'],
  'Inner Mongolia': ['inner mongolia', 'hohhot'],
  'Liaoning': ['liaoning', 'shenyang', 'dalian'],
  'Jilin': ['jilin', 'changchun'],
  'Heilongjiang': ['heilongjiang', 'harbin'],
  'Shandong': ['shandong', 'jinan', 'qingdao'],
  'Jiangsu': ['jiangsu', 'nanjing', 'suzhou'],
  'Zhejiang': ['zhejiang', 'hangzhou', 'ningbo'],
  'Fujian': ['fujian', 'fuzhou', 'xiamen'],
  'Henan': ['henan', 'zhengzhou'],
  'Hubei': ['hubei', 'wuhan'],
  'Hunan': ['hunan', 'changsha'],
  'Sichuan': ['sichuan', 'chengdu'],
  'Yunnan': ['yunnan', 'kunming'],
  'Shaanxi': ["shaanxi", "xi'an", 'xian'],
  'Chongqing': ['chongqing'],
  'Hainan': ['hainan', 'haikou'],
  'China': ['china', 'chinese', 'prc', 'peoples republic', 'beijing government', 'ccp'],
  'Moscow': ['moscow', 'kremlin', 'red square'],
  'St. Petersburg': ['st petersburg', 'saint petersburg', 'leningrad'],
  'Murmansk Oblast': ['murmansk'],
  'Chechnya': ['chechnya', 'chechen', 'grozny'],
  'Dagestan': ['dagestan', 'makhachkala'],
  'Tatarstan': ['tatarstan', 'kazan'],
  'Sverdlovsk Oblast': ['sverdlovsk', 'yekaterinburg', 'ekaterinburg'],
  'Khabarovsk Krai': ['khabarovsk'],
  'Primorsky Krai': ['primorsky', 'vladivostok'],
  'Sakha (Yakutia)': ['yakutia', 'yakutsk'],
  'Novosibirsk Oblast': ['novosibirsk'],
  'Krasnoyarsk Krai': ['krasnoyarsk'],
  'Irkutsk Oblast': ['irkutsk'],
  'Russia': ['russia', 'russian', 'kremlin policy', 'russian federation', 'moscow policy'],
  'Sao Paulo': ['sao paulo', 'sp state'],
  'Rio de Janeiro': ['rio de janeiro', 'rio'],
  'Minas Gerais': ['minas gerais', 'belo horizonte'],
  'Bahia': ['bahia', 'salvador ba'],
  'Amazonas': ['amazonas', 'manaus'],
  'Para': ['para', 'belem'],
  'Ceara': ['ceara', 'fortaleza'],
  'Pernambuco': ['pernambuco', 'recife'],
  'Rio Grande do Sul': ['rio grande do sul', 'porto alegre'],
  'Parana': ['parana', 'curitiba'],
  'Federal District': ['brasilia', 'federal district', 'distrito federal'],
  'Brazil': ['brazil', 'brazilian', 'brasilia government'],
  'London': ['london', 'greater london', 'whitehall', 'westminster', 'city of london'],
  'South East England': ['south east england', 'kent', 'surrey', 'sussex', 'reading'],
  'South West England': ['south west england', 'bristol', 'exeter', 'cornwall', 'devon', 'somerset'],
  'East of England': ['east of england', 'norfolk', 'suffolk', 'norwich', 'cambridge'],
  'East Midlands': ['east midlands', 'nottingham', 'leicester', 'derby'],
  'West Midlands': ['west midlands', 'birmingham', 'coventry', 'wolverhampton'],
  'Yorkshire & Humber': ['yorkshire', 'leeds', 'sheffield', 'hull', 'bradford'],
  'North West England': ['north west england', 'manchester', 'liverpool', 'lancashire', 'cumbria'],
  'North East England': ['north east england', 'newcastle', 'sunderland', 'durham', 'tyneside'],
  'Scotland': ['scotland', 'scottish', 'edinburgh', 'glasgow', 'dundee', 'aberdeen', 'holyrood'],
  'Scottish Highlands': ['highlands', 'inverness', 'highland council'],
  'Wales': ['wales', 'welsh', 'cardiff', 'swansea', 'newport wa'],
  'Northern Ireland': ['northern ireland', 'belfast', 'ulster', 'stormont'],
  'UK': ['uk', 'united kingdom', 'britain', 'british', 'london policy', 'parliament uk', 'westminster policy'],
};

const COUNTRY_REGION_GROUPS: Array<{ broadRegions: string[]; countryRegions: string[] }> = [
  {
    broadRegions: ['South Asia'],
    countryRegions: [
      'Jammu & Kashmir', 'Ladakh', 'Himachal Pradesh', 'Punjab', 'Uttarakhand', 'Haryana',
      'Delhi', 'Uttar Pradesh', 'Rajasthan', 'Bihar', 'Sikkim', 'Arunachal Pradesh', 'Assam',
      'Nagaland', 'Manipur', 'Mizoram', 'Tripura', 'Meghalaya', 'West Bengal', 'Jharkhand',
      'Odisha', 'Chhattisgarh', 'Madhya Pradesh', 'Gujarat', 'Maharashtra', 'Telangana',
      'Andhra Pradesh', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Goa', 'Andaman & Nicobar', 'India',
    ],
  },
  {
    broadRegions: ['North America'],
    countryRegions: [
      'Maine', 'New Hampshire', 'Vermont', 'Massachusetts', 'Rhode Island', 'Connecticut',
      'New York', 'New Jersey', 'Pennsylvania', 'Delaware', 'Maryland', 'Washington DC',
      'Virginia', 'North Carolina', 'South Carolina', 'Georgia', 'Florida', 'Alabama',
      'Mississippi', 'Tennessee', 'Kentucky', 'West Virginia', 'Arkansas', 'Louisiana',
      'Ohio', 'Michigan', 'Indiana', 'Illinois', 'Wisconsin', 'Minnesota', 'Iowa', 'Missouri',
      'North Dakota', 'South Dakota', 'Nebraska', 'Kansas', 'Texas', 'Oklahoma', 'New Mexico',
      'Arizona', 'Montana', 'Idaho', 'Wyoming', 'Colorado', 'Utah', 'Nevada',
      'California', 'Oregon', 'Washington', 'Alaska', 'Hawaii', 'USA',
    ],
  },
  {
    broadRegions: ['East Asia'],
    countryRegions: [
      'Beijing', 'Shanghai', 'Guangdong', 'Hong Kong', 'Xinjiang', 'Tibet', 'Inner Mongolia',
      'Liaoning', 'Jilin', 'Heilongjiang', 'Shandong', 'Jiangsu', 'Zhejiang', 'Fujian',
      'Henan', 'Hubei', 'Hunan', 'Sichuan', 'Yunnan', 'Shaanxi', 'Chongqing', 'Hainan', 'China',
    ],
  },
  {
    broadRegions: ['Europe'],
    countryRegions: [
      'Moscow', 'St. Petersburg', 'Murmansk Oblast', 'Chechnya', 'Dagestan', 'Tatarstan',
      'Sverdlovsk Oblast', 'Khabarovsk Krai', 'Primorsky Krai', 'Sakha (Yakutia)',
      'Novosibirsk Oblast', 'Krasnoyarsk Krai', 'Irkutsk Oblast', 'Russia',
      'London', 'South East England', 'South West England', 'East of England',
      'East Midlands', 'West Midlands', 'Yorkshire & Humber', 'North West England',
      'North East England', 'Scotland', 'Scottish Highlands', 'Wales', 'Northern Ireland', 'UK',
    ],
  },
  {
    broadRegions: ['Latin America'],
    countryRegions: [
      'Sao Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Amazonas', 'Para',
      'Ceara', 'Pernambuco', 'Rio Grande do Sul', 'Parana', 'Federal District', 'Brazil',
    ],
  },
];

export function extractRegions(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      found.push(region);
    }
  }
  if (found.length === 0) return ['Global'];
  for (const group of COUNTRY_REGION_GROUPS) {
    const hasSpecific = found.some(r => group.countryRegions.includes(r));
    if (hasSpecific) {
      return found.filter(r => !group.broadRegions.includes(r));
    }
  }
  return found;
}

export class AtlasService {
  private llm: LLMService;
  private sessionId: string;
  private serperKey: string;

  constructor(llm: LLMService, sessionId: string, serperKey: string) {
    this.llm = llm;
    this.sessionId = sessionId;
    this.serperKey = serperKey;
  }

  get isLiveMode(): boolean {
    return !!this.serperKey;
  }

  async generateIntelBrief(question: string): Promise<{ query: AtlasQuery; brief: IntelBrief; signals: AtlasSignal[] }> {
    const regions = extractRegions(question);
    let contextBlock = '';

    if (this.serperKey) {
      const searches = [question];
      if (regions[0] !== 'Global') {
        searches.push(`${regions[0]} current situation ${new Date().getFullYear()}`);
      }

      const searchResults = await Promise.all(
        searches.map(q => serperSearch(q, this.serperKey))
      );
      contextBlock = `LIVE INTELLIGENCE SIGNALS (from web search):\n${searchResults.join('\n\n')}`;
    }

    const prompt = `You are a geopolitical intelligence analyst. Generate a structured intelligence brief for the following query.

QUERY: "${question}"
REGIONS OF FOCUS: ${regions.join(', ')}
${contextBlock}

Generate a comprehensive intelligence brief with:

1. SITUATION SUMMARY (2-3 sentences describing the current state)
2. KEY SIGNALS (5-7 specific, concrete signals. Each with: signal text, region, and severity level: low/medium/high/critical)
3. PROBABILITY ASSESSMENTS (3-4 scenarios with probability % and timeframe)
4. WATCHPOINTS (3-5 indicators to monitor)
5. CONFIDENCE LEVEL (0-100, based on available information quality)

Format your response as valid JSON:
{
  "situation_summary": "...",
  "key_signals": [{"signal": "...", "region": "...", "severity": "medium"}],
  "probability_assessments": [{"scenario": "...", "probability": 65, "timeframe": "3-6 months"}],
  "watchpoints": ["...", "..."],
  "confidence": 75
}

Return ONLY the JSON object.`;

    let brief: IntelBrief;
    try {
      const raw = await this.llm.generateResponse(prompt);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const parsed = JSON.parse(jsonMatch[0]);
      brief = {
        situation_summary: parsed.situation_summary || '',
        key_signals: parsed.key_signals || [],
        probability_assessments: parsed.probability_assessments || [],
        watchpoints: parsed.watchpoints || [],
        confidence: parsed.confidence || 50,
        raw_content: raw,
      };
    } catch {
      brief = {
        situation_summary: 'Analysis could not be completed at this time.',
        key_signals: [],
        probability_assessments: [],
        watchpoints: [],
        confidence: 0,
        raw_content: '',
      };
    }

    const briefText = JSON.stringify(brief);
    const mode = this.serperKey ? 'live' : 'reasoned';

    const { data: queryData } = await supabase
      .from('atlas_queries')
      .insert({
        session_id: this.sessionId,
        question,
        brief: briefText,
        regions,
        mode,
      })
      .select()
      .maybeSingle();

    const savedQuery = queryData as AtlasQuery | null;

    const signalsToInsert = brief.key_signals.map(s => ({
      session_id: this.sessionId,
      region: s.region || regions[0],
      category: detectCategory(s.signal),
      summary: s.signal,
      severity: s.severity || 'medium',
      trend: 'stable' as const,
      source_query_id: savedQuery?.id || null,
    }));

    let savedSignals: AtlasSignal[] = [];
    if (signalsToInsert.length > 0) {
      const { data: signalData } = await supabase
        .from('atlas_signals')
        .insert(signalsToInsert)
        .select();
      savedSignals = (signalData as AtlasSignal[]) || [];
    }

    const fallbackQuery: AtlasQuery = {
      id: crypto.randomUUID(),
      session_id: this.sessionId,
      question,
      brief: briefText,
      regions,
      mode,
      created_at: new Date().toISOString(),
    };

    return {
      query: savedQuery || fallbackQuery,
      brief,
      signals: savedSignals,
    };
  }

  async loadRecentSignals(): Promise<AtlasSignal[]> {
    const { data } = await supabase
      .from('atlas_signals')
      .select('*')
      .eq('session_id', this.sessionId)
      .order('created_at', { ascending: false })
      .limit(50);

    return (data as AtlasSignal[]) || [];
  }

  async loadWatchlist(): Promise<AtlasWatchlistEntry[]> {
    const { data } = await supabase
      .from('atlas_watchlist')
      .select('*')
      .eq('session_id', this.sessionId)
      .order('created_at', { ascending: false });

    return (data as AtlasWatchlistEntry[]) || [];
  }

  async saveToWatchlist(question: string, regions: string[], lastBrief: string): Promise<void> {
    await supabase.from('atlas_watchlist').insert({
      session_id: this.sessionId,
      question,
      regions,
      last_brief: lastBrief,
    });
  }

  async removeFromWatchlist(id: string): Promise<void> {
    await supabase
      .from('atlas_watchlist')
      .delete()
      .eq('id', id)
      .eq('session_id', this.sessionId);
  }

  async loadQueryHistory(): Promise<AtlasQuery[]> {
    const { data } = await supabase
      .from('atlas_queries')
      .select('id, session_id, question, regions, mode, created_at')
      .eq('session_id', this.sessionId)
      .order('created_at', { ascending: false })
      .limit(20);

    return (data as AtlasQuery[]) || [];
  }
}

function detectCategory(signal: string): string {
  const lower = signal.toLowerCase();
  if (lower.includes('cyber') || lower.includes('hack') || lower.includes('ransomware') || lower.includes('attack')) return 'Cyber';
  if (lower.includes('health') || lower.includes('disease') || lower.includes('epidemic') || lower.includes('pandemic')) return 'Public Health';
  if (lower.includes('economic') || lower.includes('trade') || lower.includes('gdp') || lower.includes('inflation') || lower.includes('currency') || lower.includes('market')) return 'Economic';
  if (lower.includes('climate') || lower.includes('flood') || lower.includes('earthquake') || lower.includes('drought') || lower.includes('environment')) return 'Environmental';
  if (lower.includes('infrastructure') || lower.includes('energy') || lower.includes('grid') || lower.includes('pipeline') || lower.includes('supply chain')) return 'Infrastructure';
  return 'Geopolitical';
}

export { SIGNAL_CATEGORIES };
