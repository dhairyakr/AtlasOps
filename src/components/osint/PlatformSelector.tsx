import React, { useState } from 'react';
import { X, Check, Search, Monitor, Code2, Gamepad2, MessageSquare, Users } from 'lucide-react';

export interface SocialPlatformConfig {
  id: string;
  label: string;
  domain: string;
  category: 'social' | 'dev' | 'gaming' | 'forums' | 'professional' | 'media';
  profilePattern: string;
  color: string;
}

export const ALL_PLATFORMS: SocialPlatformConfig[] = [
  { id: 'twitter', label: 'Twitter / X', domain: 'x.com', category: 'social', profilePattern: 'https://x.com/{username}', color: '#1da1f2' },
  { id: 'instagram', label: 'Instagram', domain: 'instagram.com', category: 'social', profilePattern: 'https://instagram.com/{username}', color: '#e1306c' },
  { id: 'facebook', label: 'Facebook', domain: 'facebook.com', category: 'social', profilePattern: 'https://facebook.com/{username}', color: '#1877f2' },
  { id: 'tiktok', label: 'TikTok', domain: 'tiktok.com', category: 'social', profilePattern: 'https://tiktok.com/@{username}', color: '#69c9d0' },
  { id: 'snapchat', label: 'Snapchat', domain: 'snapchat.com', category: 'social', profilePattern: 'https://snapchat.com/add/{username}', color: '#fffc00' },
  { id: 'pinterest', label: 'Pinterest', domain: 'pinterest.com', category: 'social', profilePattern: 'https://pinterest.com/{username}', color: '#e60023' },
  { id: 'tumblr', label: 'Tumblr', domain: 'tumblr.com', category: 'social', profilePattern: 'https://{username}.tumblr.com', color: '#35465c' },
  { id: 'linkedin', label: 'LinkedIn', domain: 'linkedin.com', category: 'professional', profilePattern: 'https://linkedin.com/in/{username}', color: '#0a66c2' },
  { id: 'github', label: 'GitHub', domain: 'github.com', category: 'dev', profilePattern: 'https://github.com/{username}', color: '#f0f6fc' },
  { id: 'gitlab', label: 'GitLab', domain: 'gitlab.com', category: 'dev', profilePattern: 'https://gitlab.com/{username}', color: '#fc6d26' },
  { id: 'stackoverflow', label: 'Stack Overflow', domain: 'stackoverflow.com', category: 'dev', profilePattern: 'https://stackoverflow.com/users/{username}', color: '#f48024' },
  { id: 'hackernews', label: 'Hacker News', domain: 'news.ycombinator.com', category: 'dev', profilePattern: 'https://news.ycombinator.com/user?id={username}', color: '#ff6600' },
  { id: 'producthunt', label: 'Product Hunt', domain: 'producthunt.com', category: 'dev', profilePattern: 'https://producthunt.com/@{username}', color: '#da552f' },
  { id: 'keybase', label: 'Keybase', domain: 'keybase.io', category: 'dev', profilePattern: 'https://keybase.io/{username}', color: '#4c8eff' },
  { id: 'reddit', label: 'Reddit', domain: 'reddit.com', category: 'forums', profilePattern: 'https://reddit.com/user/{username}', color: '#ff4500' },
  { id: 'quora', label: 'Quora', domain: 'quora.com', category: 'forums', profilePattern: 'https://quora.com/profile/{username}', color: '#b92b27' },
  { id: 'medium', label: 'Medium', domain: 'medium.com', category: 'media', profilePattern: 'https://medium.com/@{username}', color: '#00ab6c' },
  { id: 'substack', label: 'Substack', domain: 'substack.com', category: 'media', profilePattern: 'https://{username}.substack.com', color: '#ff6719' },
  { id: 'youtube', label: 'YouTube', domain: 'youtube.com', category: 'media', profilePattern: 'https://youtube.com/@{username}', color: '#ff0000' },
  { id: 'twitch', label: 'Twitch', domain: 'twitch.tv', category: 'gaming', profilePattern: 'https://twitch.tv/{username}', color: '#9146ff' },
  { id: 'steam', label: 'Steam', domain: 'steamcommunity.com', category: 'gaming', profilePattern: 'https://steamcommunity.com/id/{username}', color: '#1b2838' },
  { id: 'flickr', label: 'Flickr', domain: 'flickr.com', category: 'media', profilePattern: 'https://flickr.com/people/{username}', color: '#ff0084' },
  { id: 'soundcloud', label: 'SoundCloud', domain: 'soundcloud.com', category: 'media', profilePattern: 'https://soundcloud.com/{username}', color: '#ff5500' },
  { id: 'behance', label: 'Behance', domain: 'behance.net', category: 'media', profilePattern: 'https://behance.net/{username}', color: '#053eff' },
  { id: 'deviantart', label: 'DeviantArt', domain: 'deviantart.com', category: 'media', profilePattern: 'https://deviantart.com/{username}', color: '#05cc47' },
  { id: 'mastodon', label: 'Mastodon', domain: 'mastodon.social', category: 'social', profilePattern: 'https://mastodon.social/@{username}', color: '#6364ff' },
  { id: 'telegram', label: 'Telegram (public)', domain: 't.me', category: 'social', profilePattern: 'https://t.me/{username}', color: '#229ed9' },
];

const CATEGORY_LABELS: Record<string, string> = {
  social: 'Social Media',
  professional: 'Professional',
  dev: 'Developer',
  forums: 'Forums & Q&A',
  media: 'Media & Creative',
  gaming: 'Gaming & Streaming',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  social: <Users className="w-3 h-3" />,
  professional: <Monitor className="w-3 h-3" />,
  dev: <Code2 className="w-3 h-3" />,
  forums: <MessageSquare className="w-3 h-3" />,
  media: <Monitor className="w-3 h-3" />,
  gaming: <Gamepad2 className="w-3 h-3" />,
};

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onChange: (platforms: string[]) => void;
  onClose: () => void;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({ selectedPlatforms, onChange, onClose }) => {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? ALL_PLATFORMS.filter(p => p.label.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search.toLowerCase()))
    : ALL_PLATFORMS;

  const grouped = filtered.reduce<Record<string, SocialPlatformConfig[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const toggle = (id: string) => {
    if (selectedPlatforms.includes(id)) {
      onChange(selectedPlatforms.filter(p => p !== id));
    } else {
      onChange([...selectedPlatforms, id]);
    }
  };

  const selectAll = () => onChange(ALL_PLATFORMS.map(p => p.id));
  const clearAll = () => onChange([]);
  const selectDefaults = () => onChange(['twitter', 'instagram', 'linkedin', 'github', 'reddit', 'tiktok', 'facebook', 'youtube']);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-xl overflow-hidden"
        style={{ background: '#0d1117', border: '1px solid rgba(34,211,238,0.2)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <h3 className="text-sm font-semibold text-white">Platform Scope</h3>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Select platforms to scan — {selectedPlatforms.length} of {ALL_PLATFORMS.length} selected
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded transition-colors hover:bg-white/05">
            <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex-1 flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input
              className="flex-1 bg-transparent text-xs text-white placeholder-white/25 outline-none font-mono"
              placeholder="Filter platforms..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-1">
            <button onClick={selectDefaults} className="text-[9px] font-mono px-2 py-1 rounded transition-colors"
              style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', color: '#22d3ee' }}>
              defaults
            </button>
            <button onClick={selectAll} className="text-[9px] font-mono px-2 py-1 rounded transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
              all
            </button>
            <button onClick={clearAll} className="text-[9px] font-mono px-2 py-1 rounded transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
              none
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto cyber-scrollbar px-4 py-3 space-y-4">
          {Object.entries(CATEGORY_LABELS).map(([cat, catLabel]) => {
            const platforms = grouped[cat];
            if (!platforms || platforms.length === 0) return null;
            return (
              <div key={cat}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>{CATEGORY_ICONS[cat]}</span>
                  <span className="text-[9px] font-mono font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>{catLabel}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {platforms.map(platform => {
                    const isSelected = selectedPlatforms.includes(platform.id);
                    return (
                      <button
                        key={platform.id}
                        onClick={() => toggle(platform.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-150"
                        style={{
                          background: isSelected ? `${platform.color}15` : 'rgba(255,255,255,0.03)',
                          border: isSelected ? `1px solid ${platform.color}40` : '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all duration-150"
                          style={{
                            background: isSelected ? platform.color : 'rgba(255,255,255,0.08)',
                            border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.15)',
                          }}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-black" />}
                        </div>
                        <span
                          className="text-[11px] font-mono truncate"
                          style={{ color: isSelected ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)' }}
                        >
                          {platform.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {selectedPlatforms.length === 0 ? 'No platforms selected — all will be scanned' : `${selectedPlatforms.length} platform(s) in scope`}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
