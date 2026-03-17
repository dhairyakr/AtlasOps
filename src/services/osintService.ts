import { supabase } from './supabaseClient';
import { LLMService } from './llmService';

export type EntityType = 'domain' | 'ip' | 'email' | 'username' | 'person' | 'org' | 'wallet' | 'url' | 'social_post' | 'unknown';
export type ScanStatus = 'idle' | 'scanning' | 'complete' | 'error';
export type Confidence = 'high' | 'medium' | 'unverified';
export type InvestigationStatus = 'active' | 'archived' | 'flagged';

export type OsintStepType =
  | 'think' | 'whois' | 'dns' | 'ip_geo' | 'wayback' | 'search'
  | 'ssl' | 'social' | 'social_fetch' | 'breach' | 'extract' | 'synthesize'
  | 'email_enrich' | 'cert_transparency' | 'identity_card';

export type SocialPlatform = 'instagram' | 'twitter' | 'facebook' | 'linkedin' | 'reddit' | 'youtube' | 'tiktok' | 'unknown';

export interface SocialPostMeta {
  platform: SocialPlatform;
  is_post: boolean;
  is_profile: boolean;
  handle?: string;
}

export function detectSocialPlatform(url: string): SocialPostMeta {
  const u = url.toLowerCase();
  const isInstagramPost = /instagram\.com\/(p|reel|tv)\//.test(u);
  const isInstagramProfile = /instagram\.com\/[^/]+\/?$/.test(u) && !isInstagramPost;
  const isTwitterPost = /(twitter|x)\.com\/[^/]+\/status\//.test(u);
  const isTwitterProfile = /(twitter|x)\.com\/[^/]+\/?$/.test(u) && !isTwitterPost;
  const isFacebookPost = /facebook\.com\/(photo|permalink|posts|story|video|watch)/.test(u) || /facebook\.com\/[^/]+\/posts\//.test(u);
  const isFacebookProfile = /facebook\.com\/[^/]+\/?$/.test(u) && !isFacebookPost;
  const isLinkedinProfile = /linkedin\.com\/(in|company|pub)\//.test(u);
  const isLinkedinPost = /linkedin\.com\/feed\/update\//.test(u) || /linkedin\.com\/posts\//.test(u);
  const isReddit = /reddit\.com/.test(u);
  const isYoutube = /(youtube\.com|youtu\.be)/.test(u);
  const isTiktok = /tiktok\.com/.test(u);

  const handleMatch = url.match(/(?:instagram|twitter|x|facebook|linkedin|reddit|tiktok)\.com\/(?:in\/|company\/)?([^/?#]+)/);
  const handle = handleMatch?.[1];

  if (isInstagramPost) return { platform: 'instagram', is_post: true, is_profile: false, handle };
  if (isInstagramProfile) return { platform: 'instagram', is_post: false, is_profile: true, handle };
  if (isTwitterPost) return { platform: 'twitter', is_post: true, is_profile: false, handle };
  if (isTwitterProfile) return { platform: 'twitter', is_post: false, is_profile: true, handle };
  if (isFacebookPost) return { platform: 'facebook', is_post: true, is_profile: false, handle };
  if (isFacebookProfile) return { platform: 'facebook', is_post: false, is_profile: true, handle };
  if (isLinkedinPost) return { platform: 'linkedin', is_post: true, is_profile: false, handle };
  if (isLinkedinProfile) return { platform: 'linkedin', is_post: false, is_profile: true, handle };
  if (isReddit) return { platform: 'reddit', is_post: /reddit\.com\/r\/[^/]+\/comments\//.test(u), is_profile: /reddit\.com\/user\//.test(u), handle };
  if (isYoutube) return { platform: 'youtube', is_post: false, is_profile: true, handle };
  if (isTiktok) return { platform: 'tiktok', is_post: /tiktok\.com\/@[^/]+\/video\//.test(u), is_profile: /tiktok\.com\/@/.test(u), handle };
  return { platform: 'unknown', is_post: false, is_profile: false };
}

export function isSocialUrl(url: string): boolean {
  return /(instagram|twitter|x\.com|facebook|linkedin|reddit|tiktok|youtube)\.com/.test(url.toLowerCase());
}

export interface OsintStep {
  id: string;
  type: OsintStepType;
  label: string;
  detail?: string;
  status: 'pending' | 'running' | 'done' | 'error';
  result?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface OsintInvestigation {
  id: string;
  session_id: string;
  title: string;
  description: string;
  status: InvestigationStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ContextProfile {
  aliases?: string[];
  known_emails?: string[];
  known_usernames?: string[];
  known_domains?: string[];
  employer_org?: string;
  locations?: string[];
  occupation?: string;
  associates?: string[];
  context_tags?: string[];
  intel_brief?: string;
  date_of_birth_approx?: string;
  nationality?: string;
}

export interface OsintTarget {
  id: string;
  investigation_id: string;
  session_id: string;
  value: string;
  entity_type: EntityType;
  label: string;
  notes: string;
  scan_status: ScanStatus;
  finding_count: number;
  context_profile: ContextProfile;
  created_at: string;
}

export interface OsintFinding {
  id: string;
  target_id: string;
  investigation_id: string;
  session_id: string;
  category: string;
  title: string;
  content: string;
  source_url: string;
  confidence: Confidence;
  extracted_date?: string;
  pivot_value?: string;
  pivot_type?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface GraphNode {
  id: string;
  type: EntityType;
  value: string;
  label: string;
  x?: number;
  y?: number;
  isTarget?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  strength: number;
}

export interface OsintGraph {
  id: string;
  investigation_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface OsintReport {
  id: string;
  investigation_id: string;
  title: string;
  content_md: string;
  created_at: string;
}

function getOrCreateSessionId(): string {
  const key = 'osint-session-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `osint-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export function detectEntityType(value: string): EntityType {
  const v = value.trim();
  if (/^(https?:\/\/)/.test(v)) {
    if (isSocialUrl(v)) return 'social_post';
    return 'url';
  }
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(v)) return 'ip';
  if (/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(v) || /^::/.test(v)) return 'ip';
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'email';
  if (/^(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{6,87})$/.test(v)) return 'wallet';
  if (/^@[a-zA-Z0-9_]{1,50}$/.test(v) || /^[a-zA-Z0-9_]{2,30}$/.test(v) && !v.includes(' ') && !v.includes('.')) return 'username';
  if (/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(v)) return 'domain';
  if (/\s/.test(v) && v.split(' ').length >= 2 && v.split(' ').length <= 5) return 'person';
  return 'org';
}

export const ENTITY_COLORS: Record<EntityType, string> = {
  domain: '#22d3ee',
  ip: '#f59e0b',
  email: '#38bdf8',
  username: '#14b8a6',
  person: '#10b981',
  org: '#f97316',
  wallet: '#fbbf24',
  url: '#67e8f9',
  social_post: '#ec4899',
  unknown: '#94a3b8',
};

export const ENTITY_ICONS: Record<EntityType, string> = {
  domain: 'G',
  ip: 'S',
  email: 'M',
  username: '@',
  person: 'P',
  org: 'O',
  wallet: 'W',
  url: 'U',
  social_post: '#',
  unknown: '?',
};

export const SOCIAL_PLATFORM_COLORS: Record<SocialPlatform, string> = {
  instagram: '#e1306c',
  twitter: '#1da1f2',
  facebook: '#1877f2',
  linkedin: '#0a66c2',
  reddit: '#ff4500',
  youtube: '#ff0000',
  tiktok: '#69c9d0',
  unknown: '#94a3b8',
};

async function fetchWhois(domain: string): Promise<string> {
  try {
    const clean = domain.replace(/^https?:\/\//, '').replace(/\/.*/, '').split(':')[0];
    const res = await fetch(`https://rdap.org/domain/${clean}`);
    if (!res.ok) throw new Error('RDAP lookup failed');
    const data = await res.json();
    const registrar = data.entities?.find((e: { roles?: string[] }) => e.roles?.includes('registrar'))?.vcardArray?.[1]?.find((a: string[]) => a[0] === 'fn')?.[3] || 'Unknown';
    const registered = data.events?.find((e: { eventAction: string }) => e.eventAction === 'registration')?.eventDate;
    const expires = data.events?.find((e: { eventAction: string }) => e.eventAction === 'expiration')?.eventDate;
    const nameservers = data.nameservers?.map((n: { ldhName: string }) => n.ldhName).join(', ') || 'N/A';
    return `Registrar: ${registrar}\nRegistered: ${registered || 'N/A'}\nExpires: ${expires || 'N/A'}\nNameservers: ${nameservers}`;
  } catch {
    return 'WHOIS/RDAP lookup unavailable for this domain.';
  }
}

async function fetchDns(domain: string): Promise<string> {
  try {
    const clean = domain.replace(/^https?:\/\//, '').replace(/\/.*/, '').split(':')[0];
    const types = ['A', 'MX', 'NS', 'TXT', 'CNAME'];
    const results: string[] = [];
    for (const type of types) {
      try {
        const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${clean}&type=${type}`, {
          headers: { Accept: 'application/dns-json' },
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (data.Answer?.length) {
          const vals = data.Answer.map((a: { data: string }) => a.data).join(', ');
          results.push(`${type}: ${vals}`);
        }
      } catch {
        // skip this record type
      }
    }
    return results.length ? results.join('\n') : 'No DNS records found.';
  } catch {
    return 'DNS lookup unavailable.';
  }
}

async function fetchIpGeo(ip: string): Promise<string> {
  try {
    const res = await fetch(`https://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,org,as,proxy,hosting,mobile`);
    if (!res.ok) throw new Error('IP geo lookup failed');
    const data = await res.json();
    if (data.status !== 'success') return 'IP geolocation lookup failed.';
    const flags = [data.proxy && 'Proxy/VPN', data.hosting && 'Hosting/DC', data.mobile && 'Mobile'].filter(Boolean).join(', ');
    return `Country: ${data.country}\nRegion: ${data.regionName}, ${data.city}\nISP: ${data.isp}\nOrg: ${data.org}\nASN: ${data.as}${flags ? `\nFlags: ${flags}` : ''}`;
  } catch {
    return 'IP geolocation unavailable.';
  }
}

async function fetchWayback(url: string): Promise<string> {
  try {
    const clean = url.replace(/^https?:\/\//, '');
    const res = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(clean)}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const snap = data.archived_snapshots?.closest;
    if (!snap) return 'No Wayback Machine snapshots found.';
    const cdxRes = await fetch(`https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(clean)}&output=json&limit=5&fl=timestamp,statuscode`);
    let count = 'unknown count of';
    if (cdxRes.ok) {
      const cdxData = await cdxRes.json();
      if (Array.isArray(cdxData)) count = `${Math.max(0, cdxData.length - 1)}`;
    }
    return `Latest snapshot: ${snap.timestamp}\nStatus: ${snap.status}\nURL: ${snap.url}\nTotal snapshots (sample): ${count}`;
  } catch {
    return 'Wayback Machine lookup unavailable.';
  }
}

async function fetchGravatar(email: string): Promise<{ found: boolean; name?: string; displayName?: string; about?: string; accounts?: string[] }> {
  try {
    const normalized = email.trim().toLowerCase();
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const res = await fetch(`https://gravatar.com/${hash}.json`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { found: false };
    const json = await res.json();
    const entry = json.entry?.[0];
    if (!entry) return { found: false };
    const accounts: string[] = (entry.accounts || []).map((a: { shortname: string; url: string }) => `${a.shortname}: ${a.url}`);
    return {
      found: true,
      name: entry.name?.formatted || entry.preferredUsername,
      displayName: entry.displayName,
      about: entry.aboutMe,
      accounts,
    };
  } catch {
    return { found: false };
  }
}

async function fetchCertTransparency(domain: string): Promise<{ found: boolean; certs: { common_name: string; issuer: string; not_before: string; not_after: string }[] }> {
  try {
    const clean = domain.replace(/^https?:\/\//, '').replace(/\/.*/, '').split(':')[0];
    const res = await fetch(`https://crt.sh/?q=%25.${encodeURIComponent(clean)}&output=json`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { found: false, certs: [] };
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return { found: false, certs: [] };
    const seen = new Set<string>();
    const certs: { common_name: string; issuer: string; not_before: string; not_after: string }[] = [];
    for (const cert of data) {
      const key = cert.common_name || cert.name_value;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      certs.push({
        common_name: cert.common_name || cert.name_value,
        issuer: cert.issuer_name || 'Unknown',
        not_before: cert.not_before || '',
        not_after: cert.not_after || '',
      });
      if (certs.length >= 30) break;
    }
    return { found: certs.length > 0, certs };
  } catch {
    return { found: false, certs: [] };
  }
}

async function serperSearch(query: string, serperKey: string): Promise<string> {
  if (!serperKey) return 'Search unavailable: no Serper API key configured.';
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': serperKey },
      body: JSON.stringify({ q: query, num: 8 }),
    });
    if (!res.ok) throw new Error(`Serper error ${res.status}`);
    const data = await res.json();
    const results = data.organic?.slice(0, 6).map((r: { title: string; snippet: string; link: string }) =>
      `[${r.title}]\n${r.snippet}\n${r.link}`
    ).join('\n\n') || '';
    return results || 'No results found.';
  } catch (err) {
    return `Search error: ${String(err)}`;
  }
}

async function fetchSocialPageContent(url: string): Promise<{ html: string; source: 'direct' | 'wayback' | 'cache_search' | 'failed' }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const text = await res.text();
      if (text.length > 500) return { html: text.slice(0, 30000), source: 'direct' };
    }
  } catch {
    // try wayback
  }

  try {
    const clean = url.replace(/^https?:\/\//, '');
    const wbRes = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(clean)}`);
    if (wbRes.ok) {
      const data = await wbRes.json();
      const snap = data.archived_snapshots?.closest;
      if (snap?.url) {
        const snapRes = await fetch(snap.url, { signal: AbortSignal.timeout(10000) });
        if (snapRes.ok) {
          const text = await snapRes.text();
          if (text.length > 500) return { html: text.slice(0, 30000), source: 'wayback' };
        }
      }
    }
  } catch {
    // all fetches failed
  }

  return { html: '', source: 'failed' };
}

function extractSocialPivotsFromHtml(html: string, platform: SocialPlatform): {
  tagged_handles: string[];
  mentioned_handles: string[];
  mentioned_names: string[];
  hashtags: string[];
  linked_profiles: string[];
} {
  const tagged_handles: string[] = [];
  const mentioned_handles: string[] = [];
  const mentioned_names: string[] = [];
  const hashtags: string[] = [];
  const linked_profiles: string[] = [];

  const handleRegex = /@([a-zA-Z0-9_.]{1,50})/g;
  const hashtagRegex = /#([a-zA-Z0-9_]{2,50})/g;

  let m: RegExpExecArray | null;
  while ((m = handleRegex.exec(html)) !== null) {
    const handle = m[1];
    if (!mentioned_handles.includes(handle)) mentioned_handles.push(handle);
  }
  while ((m = hashtagRegex.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    if (!hashtags.includes(tag)) hashtags.push(tag);
  }

  const platformBase: Record<SocialPlatform, string> = {
    instagram: 'instagram.com',
    twitter: 'twitter.com',
    facebook: 'facebook.com',
    linkedin: 'linkedin.com',
    reddit: 'reddit.com',
    youtube: 'youtube.com',
    tiktok: 'tiktok.com',
    unknown: '',
  };

  const base = platformBase[platform];
  if (base) {
    const profileLinkRegex = new RegExp(`https?://(?:www\\.)?${base.replace('.', '\\.')}/([a-zA-Z0-9_./-]{1,80})`, 'g');
    while ((m = profileLinkRegex.exec(html)) !== null) {
      const path = m[1];
      const fullUrl = `https://${base}/${path}`;
      if (!linked_profiles.includes(fullUrl) && linked_profiles.length < 20) {
        linked_profiles.push(fullUrl);
      }
    }
  }

  const ogTaggedRegex = /"tagged_users":\s*\[([^\]]+)\]/;
  const ogTaggedMatch = html.match(ogTaggedRegex);
  if (ogTaggedMatch) {
    const usernameRegex = /"username":\s*"([^"]+)"/g;
    while ((m = usernameRegex.exec(ogTaggedMatch[1])) !== null) {
      if (!tagged_handles.includes(m[1])) tagged_handles.push(m[1]);
    }
  }

  const nameRegex = /"full_name":\s*"([^"]+)"/g;
  while ((m = nameRegex.exec(html)) !== null) {
    if (m[1].includes(' ') && !mentioned_names.includes(m[1])) mentioned_names.push(m[1]);
  }

  return {
    tagged_handles: tagged_handles.slice(0, 30),
    mentioned_handles: mentioned_handles.slice(0, 30),
    mentioned_names: mentioned_names.slice(0, 20),
    hashtags: hashtags.slice(0, 20),
    linked_profiles: linked_profiles.slice(0, 15),
  };
}

export class OsintService {
  private llm: LLMService;
  private sessionId: string;
  private serperKey: string;

  constructor(llm: LLMService, serperKey: string) {
    this.llm = llm;
    this.sessionId = getOrCreateSessionId();
    this.serperKey = serperKey;
  }

  async loadInvestigations(): Promise<OsintInvestigation[]> {
    const { data } = await supabase
      .from('osint_investigations')
      .select()
      .eq('session_id', this.sessionId)
      .order('updated_at', { ascending: false });
    return (data || []) as OsintInvestigation[];
  }

  async createInvestigation(title: string, description: string): Promise<OsintInvestigation> {
    const { data, error } = await supabase
      .from('osint_investigations')
      .insert({ session_id: this.sessionId, title, description, status: 'active', tags: [] })
      .select()
      .maybeSingle();
    if (error || !data) throw new Error('Failed to create investigation');
    return data as OsintInvestigation;
  }

  async updateInvestigation(id: string, updates: Partial<OsintInvestigation>): Promise<void> {
    await supabase
      .from('osint_investigations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('session_id', this.sessionId);
  }

  async deleteInvestigation(id: string): Promise<void> {
    await supabase
      .from('osint_investigations')
      .delete()
      .eq('id', id)
      .eq('session_id', this.sessionId);
  }

  async loadTargets(investigationId: string): Promise<OsintTarget[]> {
    const { data } = await supabase
      .from('osint_targets')
      .select()
      .eq('investigation_id', investigationId)
      .eq('session_id', this.sessionId)
      .order('created_at', { ascending: true });
    return (data || []) as OsintTarget[];
  }

  async addTarget(investigationId: string, value: string): Promise<OsintTarget> {
    const type = detectEntityType(value);
    const { data, error } = await supabase
      .from('osint_targets')
      .insert({
        investigation_id: investigationId,
        session_id: this.sessionId,
        value,
        entity_type: type,
        label: value,
        scan_status: 'idle',
        finding_count: 0,
        context_profile: {},
      })
      .select()
      .maybeSingle();
    if (error || !data) throw new Error('Failed to add target');
    await supabase
      .from('osint_investigations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', investigationId);
    return data as OsintTarget;
  }

  async updateTargetProfile(targetId: string, profile: ContextProfile): Promise<void> {
    await supabase
      .from('osint_targets')
      .update({ context_profile: profile })
      .eq('id', targetId);
  }

  async deleteTarget(targetId: string): Promise<void> {
    await supabase.from('osint_targets').delete().eq('id', targetId);
  }

  async loadFindings(investigationId: string): Promise<OsintFinding[]> {
    const { data } = await supabase
      .from('osint_findings')
      .select()
      .eq('investigation_id', investigationId)
      .eq('session_id', this.sessionId)
      .order('created_at', { ascending: false });
    return (data || []) as OsintFinding[];
  }

  async loadGraph(investigationId: string): Promise<OsintGraph | null> {
    const { data } = await supabase
      .from('osint_graphs')
      .select()
      .eq('investigation_id', investigationId)
      .eq('session_id', this.sessionId)
      .maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      investigation_id: data.investigation_id,
      nodes: (data.nodes as GraphNode[]) || [],
      edges: (data.edges as GraphEdge[]) || [],
    };
  }

  async saveGraph(investigationId: string, nodes: GraphNode[], edges: GraphEdge[]): Promise<void> {
    const existing = await this.loadGraph(investigationId);
    if (existing) {
      await supabase
        .from('osint_graphs')
        .update({ nodes, edges, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('osint_graphs')
        .insert({ investigation_id: investigationId, session_id: this.sessionId, nodes, edges });
    }
  }

  async loadReports(investigationId: string): Promise<OsintReport[]> {
    const { data } = await supabase
      .from('osint_reports')
      .select()
      .eq('investigation_id', investigationId)
      .eq('session_id', this.sessionId)
      .order('created_at', { ascending: false });
    return (data || []) as OsintReport[];
  }

  async runScan(
    target: OsintTarget,
    investigationId: string,
    onStepUpdate: (steps: OsintStep[]) => void,
    contextProfile?: ContextProfile,
    selectedPlatforms?: string[]
  ): Promise<OsintFinding[]> {
    const profile = contextProfile || target.context_profile || {};
    const steps: OsintStep[] = [];
    const findings: OsintFinding[] = [];

    const updateSteps = () => onStepUpdate([...steps]);

    const addStep = (step: Omit<OsintStep, 'id'>): OsintStep => {
      const s: OsintStep = { ...step, id: `step_${Date.now()}_${Math.random().toString(36).slice(2)}` };
      steps.push(s);
      updateSteps();
      return s;
    };

    const updateStep = (id: string, updates: Partial<OsintStep>) => {
      const idx = steps.findIndex(s => s.id === id);
      if (idx !== -1) {
        steps[idx] = { ...steps[idx], ...updates };
        updateSteps();
      }
    };

    const saveFinding = async (finding: Omit<OsintFinding, 'id' | 'created_at'>): Promise<void> => {
      const { data } = await supabase
        .from('osint_findings')
        .insert(finding)
        .select()
        .maybeSingle();
      if (data) findings.push(data as OsintFinding);
    };

    await supabase.from('osint_targets').update({ scan_status: 'scanning' }).eq('id', target.id);

    const profileKeys = Object.keys(profile).filter(k => {
      const v = (profile as Record<string, unknown>)[k];
      return Array.isArray(v) ? v.length > 0 : !!v;
    });
    const hasProfile = profileKeys.length > 0;

    const thinkStep = addStep({
      type: 'think',
      label: `Analyzing target: ${target.value}`,
      detail: hasProfile
        ? `Entity type: ${target.entity_type} · ${profileKeys.length} profile fields loaded`
        : `Entity type: ${target.entity_type}`,
      status: 'running',
      startedAt: Date.now(),
    });
    await new Promise(r => setTimeout(r, 400));
    updateStep(thinkStep.id, {
      status: 'done',
      result: hasProfile
        ? `Context profile active — expanding queries with known aliases and associations`
        : `Running OSINT modules for ${target.entity_type}`,
      completedAt: Date.now(),
    });

    const isDomain = target.entity_type === 'domain' || target.entity_type === 'url';
    const isIp = target.entity_type === 'ip';
    const isEmail = target.entity_type === 'email';
    const isUsername = target.entity_type === 'username';
    const isPerson = target.entity_type === 'person';
    const isSocialPost = target.entity_type === 'social_post';

    const socialKnownHandles: string[] = [];

    if (isSocialPost) {
      const socialMeta = detectSocialPlatform(target.value);
      const platformLabel = socialMeta.platform.charAt(0).toUpperCase() + socialMeta.platform.slice(1);
      const contentTypeLabel = socialMeta.is_post ? 'Post' : 'Profile';

      const fetchStep = addStep({
        type: 'social_fetch',
        label: `Fetching ${platformLabel} ${contentTypeLabel}`,
        detail: `Attempting to retrieve public content from ${target.value}`,
        status: 'running',
        startedAt: Date.now(),
      });

      try {
        const { html, source } = await fetchSocialPageContent(target.value);
        const sourceLabel = source === 'direct' ? 'direct fetch' : source === 'wayback' ? 'Wayback Machine snapshot' : 'cache search fallback';

        if (source === 'failed' || html.length < 200) {
          updateStep(fetchStep.id, {
            status: 'done',
            result: `Direct fetch blocked — using Wayback + search fallback`,
            completedAt: Date.now(),
          });
          await saveFinding({
            target_id: target.id, investigation_id: investigationId, session_id: this.sessionId,
            category: 'social_post',
            title: `${platformLabel} ${contentTypeLabel} — Fetch Blocked`,
            content: `Direct content retrieval was blocked by ${platformLabel}. Investigation will rely on search-based discovery. URL: ${target.value}`,
            source_url: target.value,
            confidence: 'unverified',
            metadata: { platform: socialMeta.platform, is_post: socialMeta.is_post, is_profile: socialMeta.is_profile, fetch_source: 'failed' },
          });

          const wbResult = await fetchWayback(target.value);
          if (wbResult && !wbResult.includes('unavailable') && !wbResult.includes('No Wayback')) {
            await saveFinding({
              target_id: target.id, investigation_id: investigationId, session_id: this.sessionId,
              category: 'history',
              title: `Wayback Machine: ${platformLabel} ${contentTypeLabel} Snapshots`,
              content: `Archive history for ${target.value}\n${wbResult}\nHandle: ${socialMeta.handle || 'unknown'}`,
              source_url: `https://web.archive.org/web/*/${target.value}`,
              confidence: 'medium',
              metadata: { platform: socialMeta.platform, handle: socialMeta.handle, pivot_source: 'wayback' },
            });
          }
        } else {
          const extracted = extractSocialPivotsFromHtml(html, socialMeta.platform);
          const summary = [
            `Platform: ${platformLabel}`,
            `Content type: ${contentTypeLabel}`,
            `Fetch source: ${sourceLabel}`,
            `Tagged handles found: ${extracted.tagged_handles.length}`,
            `Mentioned handles: ${extracted.mentioned_handles.length}`,
            `Mentioned names: ${extracted.mentioned_names.length}`,
            `Hashtags: ${extracted.hashtags.length}`,
            `Linked profiles: ${extracted.linked_profiles.length}`,
          ].join('\n');

          updateStep(fetchStep.id, {
            status: 'done',
            result: `${sourceLabel} — found ${extracted.tagged_handles.length + extracted.mentioned_handles.length} handles`,
            completedAt: Date.now(),
          });

          await saveFinding({
            target_id: target.id, investigation_id: investigationId, session_id: this.sessionId,
            category: 'social_post',
            title: `${platformLabel} ${contentTypeLabel} — Content Retrieved`,
            content: summary,
            source_url: target.value,
            confidence: source === 'direct' ? 'high' : 'medium',
            metadata: {
              platform: socialMeta.platform,
              is_post: socialMeta.is_post,
              is_profile: socialMeta.is_profile,
              fetch_source: source,
              handle: socialMeta.handle,
              ...extracted,
            },
          });

          const tagStep = addStep({
            type: 'social_fetch',
            label: `Extracting tagged accounts from ${platformLabel} ${contentTypeLabel}`,
            detail: `${extracted.tagged_handles.length} tagged, ${extracted.mentioned_handles.length} mentioned`,
            status: 'running',
            startedAt: Date.now(),
          });

          const allHandles = [...new Set([...extracted.tagged_handles, ...extracted.mentioned_handles])];
          const allNames = extracted.mentioned_names;

          socialKnownHandles.push(...allHandles.map(h => `@${h}`), ...allNames);

          for (const handle of allHandles.slice(0, 15)) {
            const profileUrl = `https://${socialMeta.platform === 'twitter' ? 'x.com' : `${socialMeta.platform}.com`}/${handle}`;
            const isTagged = extracted.tagged_handles.includes(handle);
            await saveFinding({
              target_id: target.id, investigation_id: investigationId, session_id: this.sessionId,
              category: 'social_post',
              title: `${isTagged ? 'Tagged Account' : 'Mentioned Account'}: @${handle}`,
              content: `@${handle} was ${isTagged ? 'directly tagged' : 'mentioned'} in this ${platformLabel} ${contentTypeLabel.toLowerCase()}.\nPlatform profile: ${profileUrl}`,
              source_url: target.value,
              confidence: isTagged ? 'high' : 'medium',
              pivot_value: `@${handle}`,
              pivot_type: 'username',
              metadata: {
                platform: socialMeta.platform,
                tagged: isTagged,
                source_post: target.value,
                pivot_source: 'social_tag',
              },
            });
          }

          for (const name of allNames.slice(0, 10)) {
            await saveFinding({
              target_id: target.id, investigation_id: investigationId, session_id: this.sessionId,
              category: 'social_post',
              title: `Person Identified: ${name}`,
              content: `"${name}" was identified as a named individual in this ${platformLabel} ${contentTypeLabel.toLowerCase()}.\nSource: ${target.value}`,
              source_url: target.value,
              confidence: 'medium',
              pivot_value: name,
              pivot_type: 'person',
              metadata: {
                platform: socialMeta.platform,
                source_post: target.value,
                pivot_source: 'social_tag',
              },
            });
          }

          for (const tag of extracted.hashtags.slice(0, 5)) {
            await saveFinding({
              target_id: target.id, investigation_id: investigationId, session_id: this.sessionId,
              category: 'social_post',
              title: `Hashtag: #${tag}`,
              content: `Hashtag #${tag} was used in this ${platformLabel} ${contentTypeLabel.toLowerCase()}. Searching this hashtag may reveal related accounts and activity.\nSource: ${target.value}`,
              source_url: target.value,
              confidence: 'medium',
              metadata: { platform: socialMeta.platform, hashtag: tag, pivot_source: 'social_tag' },
            });
          }

          updateStep(tagStep.id, {
            status: 'done',
            result: `Surfaced ${allHandles.length} handle(s), ${allNames.length} name(s) as pivot targets`,
            completedAt: Date.now(),
          });
        }

        if (this.llm && html.length > 200) {
          const aiStep = addStep({
            type: 'social_fetch',
            label: `AI: Deep extraction of social content`,
            detail: `LLM analyzing post content for additional identifiers`,
            status: 'running',
            startedAt: Date.now(),
          });

          try {
            const cleanHtml = html
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .slice(0, 4000);

            const aiPivotPrompt = `You are an OSINT analyst examining a ${platformLabel} ${contentTypeLabel.toLowerCase()} page.

URL: ${target.value}
Platform: ${platformLabel}
Raw text content (cleaned HTML):
${cleanHtml}

Extract ALL identifiers that could be pivot targets for further investigation:
1. Usernames/handles (any @mentions, tagged accounts, profile references)
2. Real person names
3. Organizations or companies mentioned
4. Email addresses
5. Locations
6. URLs to other profiles or external sites
7. Any other investigatively relevant identifiers

For each identifier, output JSON:
{ "value": "...", "type": "username|person|org|email|url|domain", "context": "brief explanation of how it appeared", "tagged": true|false }

Output ONLY a JSON array. If nothing found, output [].`;

            const aiResponse = await this.llm.generateResponse(aiPivotPrompt);
            const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const aiPivots = JSON.parse(cleaned);

            if (Array.isArray(aiPivots) && aiPivots.length > 0) {
              for (const pivot of aiPivots.slice(0, 20)) {
                if (!pivot.value || !pivot.type) continue;
                await saveFinding({
                  target_id: target.id, investigation_id: investigationId, session_id: this.sessionId,
                  category: 'social_post',
                  title: `${pivot.tagged ? 'Tagged' : 'AI-Extracted'}: ${pivot.value}`,
                  content: `${pivot.context}\nExtracted from ${platformLabel} ${contentTypeLabel.toLowerCase()}: ${target.value}`,
                  source_url: target.value,
                  confidence: pivot.tagged ? 'high' : 'medium',
                  pivot_value: pivot.value,
                  pivot_type: pivot.type,
                  metadata: {
                    platform: socialMeta.platform,
                    source_post: target.value,
                    pivot_source: 'social_ai',
                    tagged: pivot.tagged || false,
                  },
                });
              }
              updateStep(aiStep.id, {
                status: 'done',
                result: `AI found ${aiPivots.length} additional identifier(s)`,
                completedAt: Date.now(),
              });
            } else {
              updateStep(aiStep.id, { status: 'done', result: 'No additional identifiers found', completedAt: Date.now() });
            }
          } catch {
            updateStep(aiStep.id, { status: 'done', result: 'AI extraction skipped', completedAt: Date.now() });
          }
        }
      } catch (e) {
        updateStep(fetchStep.id, { status: 'error', result: String(e) });
      }
    }

    if (isDomain) {
      const step = addStep({ type: 'whois', label: 'WHOIS / RDAP Lookup', detail: 'Querying domain registration data', status: 'running', startedAt: Date.now() });
      try {
        const result = await fetchWhois(target.value);
        updateStep(step.id, { status: 'done', result: result.slice(0, 200), completedAt: Date.now() });
        await saveFinding({
          target_id: target.id, investigation_id: investigationId, session_id: this.sessionId,
          category: 'whois', title: 'WHOIS / RDAP Registration Data', content: result,
          source_url: `https://rdap.org/domain/${target.value}`, confidence: 'high', metadata: {},
        });
      } catch (e) {
        updateStep(step.id, { status: 'error', result: String(e) });
      }

      const dnsStep = addStep({ type: 'dns', label: 'DNS Records', detail: 'A, MX, NS, TXT, CNAME records', status: 'running', startedAt: Date.now() });
      try {
        const result = await fetchDns(target.value);
        updateStep(dnsStep.id, { status: 'done', result: result.slice(0, 200), completedAt: Date.now() });
        await saveFinding({
          target_id: target.id, investigation_id: investigationId, session_id: this.sessionId,
          category: 'dns', title: 'DNS Records', content: result,
          source_url: '', confidence: 'high', metadata: {},
        });
      } catch (e) {
        updateStep(dnsStep.id, { status: 'error', result: String(e) });
      }

      const waybackStep = addStep({ type: 'wayback', label: 'Wayback Machine', detail: 'Historical web snapshots', status: 'running', startedAt: Date.now() });
      try {
        const result = await fetchWayback(target.value);
        updateStep(waybackStep.id, { status: 'done', result: result.slice(0, 200), completedAt: Date.now() });
        await saveFinding({
          target_id: target.id, investigation_id: investigationId, session_id: this.sessionId,
          category: 'history', title: 'Wayback Machine Snapshots', content: result,
          source_url: `https://web.archive.org/web/*/${target.value}`, confidence: 'high', metadata: {},
        });
      } catch (e) {
        updateStep(waybackStep.id, { status: 'error', result: String(e) });
      }
    }

    if (isIp) {
      const geoStep = addStep({ type: 'ip_geo', label: 'IP Geolocation & ASN', detail: 'Location, ISP, proxy/VPN detection', status: 'running', startedAt: Date.now() });
      try {
        const result = await fetchIpGeo(target.value);
        updateStep(geoStep.id, { status: 'done', result: result.slice(0, 200), completedAt: Date.now() });
        await saveFinding({
          target_id: target.id, investigation_id: investigationId, session_id: this.sessionId,
          category: 'ip_intel', title: 'IP Geolocation & Network Info', content: result,
          source_url: `https://ip-api.com/#${target.value}`, confidence: 'high', metadata: {},
        });
      } catch (e) {
        updateStep(geoStep.id, { status: 'error', result: String(e) });
      }
    }

    if (isEmail) {
      const gravatarStep = addStep({ type: 'email_enrich', label: 'Gravatar Profile Lookup', detail: 'Checking Gravatar for linked profile and accounts', status: 'running', startedAt: Date.now() });
      try {
        const gravatar = await fetchGravatar(target.value);
        if (gravatar.found) {
          const lines = [
            `Email: ${target.value}`,
            gravatar.name ? `Name: ${gravatar.name}` : '',
            gravatar.displayName ? `Display Name: ${gravatar.displayName}` : '',
            gravatar.about ? `About: ${gravatar.about}` : '',
            gravatar.accounts && gravatar.accounts.length > 0 ? `Linked Accounts:\n${gravatar.accounts.join('\n')}` : '',
          ].filter(Boolean).join('\n');
          updateStep(gravatarStep.id, { status: 'done', result: `Gravatar profile found: ${gravatar.name || gravatar.displayName}`, completedAt: Date.now() });
          await saveFinding({
            target_id: target.id, investigation_id: investigationId, session_id: this.sessionId,
            category: 'email_enrich', title: 'Gravatar Profile Linked to Email', content: lines,
            source_url: `https://gravatar.com/${target.value}`, confidence: 'high',
            metadata: { email: target.value, gravatar_name: gravatar.name, linked_accounts: gravatar.accounts },
            pivot_value: gravatar.name || undefined,
            pivot_type: gravatar.name ? 'person' : undefined,
          });
        } else {
          updateStep(gravatarStep.id, { status: 'done', result: 'No Gravatar profile found', completedAt: Date.now() });
        }
      } catch (e) {
        updateStep(gravatarStep.id, { status: 'error', result: String(e) });
      }
    }

    if (isDomain) {
      const certStep = addStep({ type: 'cert_transparency', label: 'Certificate Transparency (crt.sh)', detail: 'Scanning SSL certificate logs for subdomains and registrant data', status: 'running', startedAt: Date.now() });
      try {
        const certData = await fetchCertTransparency(target.value);
        if (certData.found && certData.certs.length > 0) {
          const subdomains = [...new Set(certData.certs.map(c => c.common_name).filter(cn => cn !== target.value))];
          const summary = [
            `Domain: ${target.value}`,
            `Total certificates found: ${certData.certs.length}`,
            `Unique subdomains/SANs: ${subdomains.length}`,
            '',
            'Recent certificates:',
            ...certData.certs.slice(0, 15).map(c => `  ${c.common_name} (Issuer: ${c.issuer.split(',')[0]}, Valid: ${c.not_before?.slice(0, 10)} — ${c.not_after?.slice(0, 10)})`),
            '',
            subdomains.length > 0 ? `Subdomains discovered:\n${subdomains.slice(0, 20).join('\n')}` : '',
          ].filter(s => s !== '').join('\n');
          updateStep(certStep.id, { status: 'done', result: `Found ${certData.certs.length} certificates, ${subdomains.length} subdomains`, completedAt: Date.now() });
          await saveFinding({
            target_id: target.id, investigation_id: investigationId, session_id: this.sessionId,
            category: 'cert_transparency', title: `Certificate Transparency — ${certData.certs.length} Certs Found`, content: summary,
            source_url: `https://crt.sh/?q=%25.${target.value}`, confidence: 'high',
            metadata: { domain: target.value, cert_count: certData.certs.length, subdomains: subdomains.slice(0, 20) },
          });
          for (const subdomain of subdomains.slice(0, 5)) {
            await saveFinding({
              target_id: target.id, investigation_id: investigationId, session_id: this.sessionId,
              category: 'cert_transparency', title: `Subdomain via Cert: ${subdomain}`, content: `${subdomain} was found in SSL certificate transparency logs for ${target.value}`,
              source_url: `https://crt.sh/?q=${encodeURIComponent(subdomain)}`, confidence: 'high',
              pivot_value: subdomain, pivot_type: 'domain',
              metadata: { domain: target.value, pivot_source: 'cert_transparency' },
            });
          }
        } else {
          updateStep(certStep.id, { status: 'done', result: 'No certificate transparency records found', completedAt: Date.now() });
        }
      } catch (e) {
        updateStep(certStep.id, { status: 'error', result: String(e) });
      }
    }

    if (this.serperKey) {
      const searchQueries = this.buildSearchQueries(target, profile, selectedPlatforms);
      for (const q of searchQueries) {
        const sStep = addStep({
          type: 'search',
          label: `Searching: "${q.label}"`,
          detail: q.fromProfile ? `[profile] ${q.query}` : q.query,
          status: 'running',
          startedAt: Date.now(),
        });
        try {
          const result = await serperSearch(q.query, this.serperKey);
          updateStep(sStep.id, { status: 'done', result: result.slice(0, 180), completedAt: Date.now() });
          if (result && !result.includes('unavailable')) {
            await saveFinding({
              target_id: target.id, investigation_id: investigationId, session_id: this.sessionId,
              category: q.category, title: q.label, content: result,
              source_url: '', confidence: 'medium',
              metadata: { query: q.query, from_profile: q.fromProfile || false },
            });
          }
        } catch (e) {
          updateStep(sStep.id, { status: 'error', result: String(e) });
        }
      }
    }

    const extractStep = addStep({ type: 'extract', label: 'AI Analysis & Pivot Detection', detail: 'Extracting structured findings and pivot targets', status: 'running', startedAt: Date.now() });
    try {
      const rawContent = findings.map(f => `[${f.category}] ${f.title}: ${f.content}`).join('\n\n');
      const augmentedProfile: ContextProfile = socialKnownHandles.length > 0
        ? { ...profile, known_usernames: [...(profile.known_usernames || []), ...socialKnownHandles] }
        : profile;
      const extractedPivots = await this.extractPivots(target.value, target.entity_type, rawContent, augmentedProfile);
      for (const pivot of extractedPivots) {
        await saveFinding({
          target_id: target.id, investigation_id: investigationId, session_id: this.sessionId,
          category: 'pivot', title: `Pivot: ${pivot.value}`, content: pivot.context,
          source_url: '', confidence: 'medium', pivot_value: pivot.value, pivot_type: pivot.type, metadata: {},
        });
      }
      updateStep(extractStep.id, {
        status: 'done',
        result: `Found ${extractedPivots.length} pivot target(s)`,
        completedAt: Date.now(),
      });
    } catch (e) {
      updateStep(extractStep.id, { status: 'error', result: String(e) });
    }

    if ((isPerson || isEmail) && this.llm && findings.length > 0) {
      const idCardStep = addStep({ type: 'identity_card', label: 'AI Identity Card Synthesis', detail: 'Building structured identity card from all gathered intelligence', status: 'running', startedAt: Date.now() });
      try {
        const allContent = findings.map(f => `[${f.category}/${f.confidence}] ${f.title}: ${f.content.slice(0, 400)}`).join('\n\n');
        const idPrompt = `You are an OSINT analyst. Synthesize the following intelligence into a structured identity card for the target: "${target.value}" (${target.entity_type}).

Intelligence gathered:
${allContent.slice(0, 5000)}

Generate a structured identity card with ONLY fields where you have evidence. Use this exact JSON format:
{
  "full_names": ["string"],
  "age_estimate": "string or null",
  "current_locations": ["string"],
  "past_locations": ["string"],
  "employers": ["string"],
  "occupation": "string or null",
  "emails_found": ["string"],
  "phones_found": ["string"],
  "usernames_found": ["string"],
  "social_profiles": ["platform: url"],
  "associates": ["string"],
  "breach_exposure": "string or null",
  "confidence_summary": "string"
}

Output ONLY the JSON object. No explanation.`;

        const idResponse = await this.llm.generateResponse(idPrompt);
        const cleanedId = idResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const idCard = JSON.parse(cleanedId);

        const cardLines: string[] = [];
        if (idCard.full_names?.length) cardLines.push(`Full Name(s): ${idCard.full_names.join(', ')}`);
        if (idCard.age_estimate) cardLines.push(`Age Estimate: ${idCard.age_estimate}`);
        if (idCard.current_locations?.length) cardLines.push(`Current Location(s): ${idCard.current_locations.join(', ')}`);
        if (idCard.past_locations?.length) cardLines.push(`Past Location(s): ${idCard.past_locations.join(', ')}`);
        if (idCard.employers?.length) cardLines.push(`Employer(s): ${idCard.employers.join(', ')}`);
        if (idCard.occupation) cardLines.push(`Occupation: ${idCard.occupation}`);
        if (idCard.emails_found?.length) cardLines.push(`Email(s): ${idCard.emails_found.join(', ')}`);
        if (idCard.phones_found?.length) cardLines.push(`Phone(s): ${idCard.phones_found.join(', ')}`);
        if (idCard.usernames_found?.length) cardLines.push(`Username(s): ${idCard.usernames_found.join(', ')}`);
        if (idCard.social_profiles?.length) cardLines.push(`Social Profiles:\n${idCard.social_profiles.join('\n')}`);
        if (idCard.associates?.length) cardLines.push(`Associates: ${idCard.associates.join(', ')}`);
        if (idCard.breach_exposure) cardLines.push(`Breach Exposure: ${idCard.breach_exposure}`);
        if (idCard.confidence_summary) cardLines.push(`\nAnalyst Assessment: ${idCard.confidence_summary}`);

        if (cardLines.length > 0) {
          await saveFinding({
            target_id: target.id, investigation_id: investigationId, session_id: this.sessionId,
            category: 'identity_card', title: `Identity Card: ${target.value}`, content: cardLines.join('\n'),
            source_url: '', confidence: 'medium', metadata: { ...idCard, ai_generated: true },
          });
          updateStep(idCardStep.id, { status: 'done', result: `Identity card synthesized — ${cardLines.length} fields populated`, completedAt: Date.now() });
        } else {
          updateStep(idCardStep.id, { status: 'done', result: 'Insufficient data for identity card', completedAt: Date.now() });
        }
      } catch {
        updateStep(idCardStep.id, { status: 'done', result: 'Identity card synthesis skipped', completedAt: Date.now() });
      }
    }

    await supabase
      .from('osint_targets')
      .update({ scan_status: 'complete', finding_count: findings.length })
      .eq('id', target.id);

    await supabase
      .from('osint_investigations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', investigationId);

    return findings;
  }

  private buildSearchQueries(
    target: OsintTarget,
    profile: ContextProfile = {},
    selectedPlatforms?: string[]
  ): { label: string; query: string; category: string; fromProfile?: boolean }[] {
    const v = target.value;
    let base: { label: string; query: string; category: string; fromProfile?: boolean }[] = [];

    switch (target.entity_type) {
      case 'domain':
        base = [
          { label: 'Domain reputation & news', query: `"${v}" site reputation security`, category: 'social' },
          { label: 'Email addresses on domain', query: `"@${v}" email contact`, category: 'people' },
          { label: 'Subdomains & services', query: `site:${v}`, category: 'dns' },
          { label: 'Data breaches & leaks', query: `"${v}" breach leak pastebin`, category: 'breach' },
        ];
        break;
      case 'ip':
        base = [
          { label: 'IP abuse & security reports', query: `"${v}" abuse malware security reports`, category: 'ip_intel' },
          { label: 'Services & open ports', query: `"${v}" server service port scan`, category: 'ip_intel' },
        ];
        break;
      case 'email':
        base = [
          { label: 'Email mentions & profiles', query: `"${v}"`, category: 'social' },
          { label: 'Data breach exposure', query: `"${v}" leaked breach data`, category: 'breach' },
          { label: 'Paste sites exposure', query: `"${v}" site:pastebin.com OR site:paste.ee OR site:ghostbin.com`, category: 'breach' },
          { label: 'Social media profiles', query: `"${v}" site:linkedin.com OR site:twitter.com OR site:github.com`, category: 'social' },
          { label: 'Public records & registrations', query: `"${v}" registration OR whois OR contact OR owner`, category: 'people' },
        ];
        break;
      case 'username': {
        const activePlatforms = selectedPlatforms && selectedPlatforms.length > 0 ? selectedPlatforms : ['twitter', 'instagram', 'reddit', 'github', 'linkedin', 'tiktok', 'facebook', 'youtube'];
        const platformDomainMap: Record<string, string> = {
          twitter: 'x.com', instagram: 'instagram.com', facebook: 'facebook.com', tiktok: 'tiktok.com',
          snapchat: 'snapchat.com', pinterest: 'pinterest.com', tumblr: 'tumblr.com',
          linkedin: 'linkedin.com', github: 'github.com', gitlab: 'gitlab.com',
          stackoverflow: 'stackoverflow.com', hackernews: 'news.ycombinator.com',
          producthunt: 'producthunt.com', keybase: 'keybase.io',
          reddit: 'reddit.com', quora: 'quora.com',
          medium: 'medium.com', substack: 'substack.com', youtube: 'youtube.com',
          twitch: 'twitch.tv', steam: 'steamcommunity.com', flickr: 'flickr.com',
          soundcloud: 'soundcloud.com', behance: 'behance.net', deviantart: 'deviantart.com',
          mastodon: 'mastodon.social', telegram: 't.me',
        };
        const platformQueries = activePlatforms.slice(0, 8).map(pid => {
          const domain = platformDomainMap[pid];
          if (!domain) return null;
          return { label: `${pid.charAt(0).toUpperCase() + pid.slice(1)}: "${v}"`, query: `"${v}" site:${domain}`, category: 'username_enum' };
        }).filter(Boolean) as { label: string; query: string; category: string }[];
        base = [
          ...platformQueries,
          { label: 'Username cross-platform presence', query: `"${v}" profile OR username`, category: 'username_enum' },
          { label: 'Username — dev & open source', query: `"${v}" site:github.com OR site:gitlab.com OR site:stackoverflow.com`, category: 'username_enum' },
          { label: 'Forum & community activity', query: `"${v}" forum community OR profile`, category: 'social' },
        ];
        break;
      }
      case 'person':
        base = [
          { label: 'LinkedIn professional profile', query: `"${v}" site:linkedin.com`, category: 'people' },
          { label: 'News & public mentions', query: `"${v}" news`, category: 'news' },
          { label: 'Public records & court filings', query: `"${v}" court OR arrest OR case site:*.gov OR site:*.us`, category: 'people' },
          { label: 'People aggregators', query: `"${v}" site:whitepages.com OR site:spokeo.com OR site:fastpeoplesearch.com OR site:mylife.com`, category: 'people' },
          { label: 'Property & voter records', query: `"${v}" property owner OR voter registration`, category: 'people' },
          ...(selectedPlatforms && selectedPlatforms.length > 0
            ? selectedPlatforms.slice(0, 3).map(pid => {
                const domMap: Record<string, string> = { twitter: 'x.com', instagram: 'instagram.com', facebook: 'facebook.com', tiktok: 'tiktok.com', linkedin: 'linkedin.com', github: 'github.com', reddit: 'reddit.com', youtube: 'youtube.com' };
                const dom = domMap[pid];
                return dom ? { label: `${pid.charAt(0).toUpperCase() + pid.slice(1)} profile`, query: `"${v}" site:${dom}`, category: 'social' } : null;
              }).filter(Boolean) as { label: string; query: string; category: string }[]
            : [
                { label: 'Instagram profile', query: `"${v}" site:instagram.com`, category: 'social' },
                { label: 'Facebook profile', query: `"${v}" site:facebook.com`, category: 'social' },
                { label: 'Twitter / X profile', query: `"${v}" site:twitter.com OR site:x.com`, category: 'social' },
              ]
          ),
        ];
        break;
      case 'org':
        base = [
          { label: 'Company info & news', query: `"${v}" company news`, category: 'news' },
          { label: 'Leadership & contacts', query: `"${v}" CEO founder employees`, category: 'people' },
          { label: 'Breaches & incidents', query: `"${v}" security breach incident`, category: 'breach' },
        ];
        break;
      case 'social_post': {
        const sm = detectSocialPlatform(v);
        const platformDomain = sm.platform === 'twitter' ? 'x.com' : sm.platform !== 'unknown' ? `${sm.platform}.com` : '';
        const handleQ = sm.handle ? `"${sm.handle}"` : '';
        const platformLabel2 = sm.platform !== 'unknown' ? sm.platform.charAt(0).toUpperCase() + sm.platform.slice(1) : '';
        base = [
          { label: 'Exact URL cached / indexed mentions', query: `"${v}"`, category: 'social_post' },
          ...(sm.handle && platformDomain ? [
            { label: `${platformLabel2} handle profile search`, query: `"${sm.handle}" site:${platformDomain}`, category: 'social_post' },
            { label: `${platformLabel2} handle — tagged & mentions`, query: `"${sm.handle}" tagged OR mentioned OR "with" ${platformLabel2}`, category: 'social_post' },
            { label: 'Cross-platform presence', query: `${handleQ} site:twitter.com OR site:instagram.com OR site:linkedin.com OR site:reddit.com`, category: 'social_post' },
            { label: `${platformLabel2} handle — news & identity`, query: `"${sm.handle}" ${platformLabel2} identity OR real name OR profile`, category: 'people' },
          ] : []),
          ...(sm.handle ? [
            { label: `GitHub / dev presence of "${sm.handle}"`, query: `"${sm.handle}" site:github.com OR site:gitlab.com`, category: 'social_post' },
          ] : []),
        ].filter(Boolean) as { label: string; query: string; category: string }[];
        break;
      }
      default:
        base = [
          { label: 'General search', query: `"${v}"`, category: 'general' },
        ];
    }

    const profileQueries: { label: string; query: string; category: string; fromProfile: boolean }[] = [];

    if (profile.aliases && profile.aliases.length > 0) {
      for (const alias of profile.aliases.slice(0, 2)) {
        profileQueries.push({
          label: `Alias: "${alias}"`,
          query: `"${alias}"`,
          category: 'social',
          fromProfile: true,
        });
      }
    }

    if (profile.known_usernames && profile.known_usernames.length > 0) {
      const handles = profile.known_usernames.slice(0, 3).map(u => `"${u}"`).join(' OR ');
      profileQueries.push({
        label: 'Known usernames — Twitter / Reddit / GitHub',
        query: `${handles} site:twitter.com OR site:reddit.com OR site:github.com`,
        category: 'social',
        fromProfile: true,
      });
      for (const username of profile.known_usernames.slice(0, 2)) {
        profileQueries.push({
          label: `Instagram: @${username}`,
          query: `"${username}" site:instagram.com`,
          category: 'social',
          fromProfile: true,
        });
        if (target.entity_type === 'person') {
          profileQueries.push({
            label: `Identity link: name + @${username}`,
            query: `"${v}" "${username}"`,
            category: 'social',
            fromProfile: true,
          });
        }
      }
    }

    if (profile.known_emails && profile.known_emails.length > 0) {
      for (const email of profile.known_emails.slice(0, 2)) {
        profileQueries.push({
          label: `Known email: ${email}`,
          query: `"${email}" breach leak OR profile`,
          category: 'breach',
          fromProfile: true,
        });
      }
    }

    if (profile.employer_org) {
      profileQueries.push({
        label: `Name + employer/school co-mention`,
        query: `"${v}" "${profile.employer_org}"`,
        category: 'people',
        fromProfile: true,
      });
      if (target.entity_type === 'person') {
        profileQueries.push({
          label: `LinkedIn: name at employer/school`,
          query: `"${v}" "${profile.employer_org}" site:linkedin.com`,
          category: 'people',
          fromProfile: true,
        });
        profileQueries.push({
          label: `Employer/school email contact`,
          query: `"${v}" "${profile.employer_org}" email contact`,
          category: 'people',
          fromProfile: true,
        });
      }
    }

    if (profile.locations && profile.locations.length > 0) {
      const loc = profile.locations[0];
      profileQueries.push({
        label: `Name + known location`,
        query: `"${v}" "${loc}"`,
        category: 'people',
        fromProfile: true,
      });
      if (profile.employer_org && target.entity_type === 'person') {
        profileQueries.push({
          label: `Name + employer + location`,
          query: `"${v}" "${profile.employer_org}" "${loc}"`,
          category: 'people',
          fromProfile: true,
        });
      }
    }

    if (profile.known_domains && profile.known_domains.length > 0) {
      for (const domain of profile.known_domains.slice(0, 2)) {
        profileQueries.push({
          label: `Associated domain: ${domain}`,
          query: `site:${domain} OR "${v}" "${domain}"`,
          category: 'dns',
          fromProfile: true,
        });
      }
    }

    if (profile.known_usernames && profile.known_usernames.length > 0 && profile.employer_org && target.entity_type === 'person') {
      const firstHandle = profile.known_usernames[0];
      profileQueries.push({
        label: `Username + employer/school cross-link`,
        query: `"${firstHandle}" "${profile.employer_org}"`,
        category: 'social',
        fromProfile: true,
      });
    }

    if (profile.intel_brief && profile.intel_brief.trim().length > 20) {
      const words = profile.intel_brief.trim().split(/\s+/).slice(0, 8).join(' ');
      profileQueries.push({
        label: 'Intel brief context search',
        query: `"${v}" ${words}`,
        category: 'general',
        fromProfile: true,
      });
    }

    const cap = target.entity_type === 'person' ? 16 : 12;
    return [...base, ...profileQueries].slice(0, cap);
  }

  private async extractPivots(
    value: string,
    type: EntityType,
    rawContent: string,
    profile: ContextProfile = {}
  ): Promise<{ value: string; type: EntityType; context: string }[]> {
    if (!rawContent.trim() || rawContent.length < 50) return [];

    const knownEntities: string[] = [
      ...(profile.aliases || []),
      ...(profile.known_emails || []),
      ...(profile.known_usernames || []),
      ...(profile.known_domains || []),
      ...(profile.associates || []),
    ];
    const knownContext = knownEntities.length > 0
      ? `\n\nAlready known entities (DO NOT suggest these as new pivots): ${knownEntities.join(', ')}`
      : '';

    try {
      const prompt = `You are an OSINT analyst. Given raw intelligence data about "${value}" (type: ${type}), extract NEW pivot targets that could be investigated further.

Raw data:
${rawContent.slice(0, 3000)}${knownContext}

Extract up to 5 pivot entities that are NEW discoveries not already known. For each, output JSON:
{ "value": "entity value", "type": "domain|ip|email|username|person|org", "context": "one sentence explaining why this is relevant" }

Output ONLY a JSON array. No explanation.`;
      const response = await this.llm.generateResponse(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((p: { value: string; type: string; context: string }) => p.value && p.type && p.context && p.value !== value)
        .map((p: { value: string; type: string; context: string }) => ({ value: p.value, type: p.type as EntityType, context: p.context }))
        .slice(0, 5);
    } catch {
      return [];
    }
  }

  async generateReport(
    investigation: OsintInvestigation,
    targets: OsintTarget[],
    findings: OsintFinding[]
  ): Promise<OsintReport> {
    const findingsByCategory: Record<string, OsintFinding[]> = {};
    for (const f of findings) {
      if (!findingsByCategory[f.category]) findingsByCategory[f.category] = [];
      findingsByCategory[f.category].push(f);
    }

    const summaryData = targets.map(t => {
      const tFindings = findings.filter(f => f.target_id === t.id);
      const prof = t.context_profile || {};
      const profileSummary = Object.keys(prof).length > 0 ? `  Prior Intel: ${JSON.stringify(prof)}` : '';
      return `TARGET: ${t.value} (${t.entity_type})\n${profileSummary}\n${tFindings.map(f => `  [${f.category}/${f.confidence}] ${f.title}: ${f.content.slice(0, 300)}`).join('\n')}`;
    }).join('\n\n');

    const hasProfiles = targets.some(t => Object.keys(t.context_profile || {}).length > 0);

    const prompt = `You are a professional OSINT analyst. Generate a comprehensive intelligence report in Markdown format.${hasProfiles ? ' Some targets have pre-existing intelligence profiles — integrate this prior knowledge naturally into the narrative, clearly distinguishing what was known before investigation versus newly discovered.' : ''}

Investigation: "${investigation.title}"
Description: ${investigation.description}
Targets: ${targets.length}
Total Findings: ${findings.length}

Intelligence Data:
${summaryData.slice(0, 6000)}

Generate a report with these sections:
# ${investigation.title} — Intelligence Report

## Classification
UNCLASSIFIED // FOR OFFICIAL USE ONLY

## Executive Summary
(2-3 paragraph narrative)

## Target Profiles
(One section per target with key identifiers and findings summary)

## Key Findings
(Organized by category with confidence levels)

## Digital Timeline
(Chronological summary of events if dates are available)

## Entity Relationships
(Describe connections between targets and findings)

## Confidence Assessment
(Breakdown by high/medium/unverified)

## Recommended Next Steps
(3-5 AI-suggested further investigation paths)

## OPSEC Advisory
(What information exposure risks exist from this investigation)

---
*Generated by OSINT Intelligence Suite*`;

    const content_md = await this.llm.generateResponse(prompt);
    const title = `${investigation.title} — Intelligence Report`;

    const { data, error } = await supabase
      .from('osint_reports')
      .insert({ investigation_id: investigation.id, session_id: this.sessionId, title, content_md })
      .select()
      .maybeSingle();
    if (error || !data) throw new Error('Failed to save report');
    return data as OsintReport;
  }

  async generateDorks(targetValue: string, targetType: EntityType, category: string, profile?: ContextProfile): Promise<string[]> {
    const profileLines: string[] = [];
    if (profile) {
      if (profile.aliases?.length) profileLines.push(`Known aliases: ${profile.aliases.join(', ')}`);
      if (profile.known_emails?.length) profileLines.push(`Known emails: ${profile.known_emails.join(', ')}`);
      if (profile.known_usernames?.length) profileLines.push(`Known usernames: ${profile.known_usernames.join(', ')}`);
      if (profile.known_domains?.length) profileLines.push(`Known domains: ${profile.known_domains.join(', ')}`);
      if (profile.employer_org) profileLines.push(`Employer/Org: ${profile.employer_org}`);
      if (profile.locations?.length) profileLines.push(`Known locations: ${profile.locations.join(', ')}`);
      if (profile.intel_brief) profileLines.push(`Context: ${profile.intel_brief.slice(0, 200)}`);
    }
    const profileContext = profileLines.length > 0
      ? `\n\nAdditional context from analyst profile:\n${profileLines.join('\n')}\n\nUse the above to generate more targeted, specific dorks that incorporate known aliases, emails, usernames, and associations.`
      : '';

    const prompt = `You are an OSINT dork generation specialist. Generate 12 Google search dork queries for the following:

Target: "${targetValue}"
Target Type: ${targetType}
Dork Category: ${category}${profileContext}

Categories and what to look for:
- exposed_files: sensitive documents, configs, backups
- login_pages: admin panels, login portals
- sensitive_dirs: directory listings, open folders
- email_harvest: email addresses related to target
- subdomains: subdomain discovery
- databases: exposed databases, phpMyAdmin
- api_keys: exposed API keys, tokens
- credentials: username/password exposure
- news: news mentions and articles
- social: social media profiles

Generate 12 specific, actionable dork queries. Output ONLY a JSON array of strings. No explanation.`;

    try {
      const response = await this.llm.generateResponse(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
    } catch {
      return [`"${targetValue}" site:pastebin.com`, `"${targetValue}" filetype:pdf`, `"${targetValue}" inurl:admin`];
    }
  }
}
