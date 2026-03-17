import React, { useEffect, useRef } from 'react';
import { Bot, User, Wrench, Radio } from 'lucide-react';
import { LiveTranscriptTurn, LiveToolUse } from './VoiceAgentTypes';

interface LiveTranscriptPanelProps {
  transcript: LiveTranscriptTurn[];
  toolUses: LiveToolUse[];
  isLive: boolean;
}

function mergeTimeline(
  transcript: LiveTranscriptTurn[],
  toolUses: LiveToolUse[]
): Array<{ type: 'turn'; data: LiveTranscriptTurn } | { type: 'tool'; data: LiveToolUse }> {
  const items: Array<{ type: 'turn'; data: LiveTranscriptTurn; ts: string } | { type: 'tool'; data: LiveToolUse; ts: string }> = [
    ...transcript.map(t => ({ type: 'turn' as const, data: t, ts: t.timestamp })),
    ...toolUses.map(t => ({ type: 'tool' as const, data: t, ts: t.timestamp })),
  ];
  return items.sort((a, b) => a.ts.localeCompare(b.ts));
}

export const LiveTranscriptPanel: React.FC<LiveTranscriptPanelProps> = ({ transcript, toolUses, isLive }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const timeline = mergeTimeline(transcript, toolUses);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline.length]);

  if (timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-white/25 py-12">
        <Radio className="w-8 h-8" />
        <p className="text-sm">Transcript will appear here once the call connects</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-1">
      {timeline.map((item, i) => {
        if (item.type === 'turn') {
          const turn = item.data;
          const isAgent = turn.speaker === 'agent';
          return (
            <div key={i} className={`flex gap-3 ${isAgent ? '' : 'flex-row-reverse'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isAgent ? 'bg-sky-500/20 border border-sky-500/30' : 'bg-emerald-500/20 border border-emerald-500/30'}`}>
                {isAgent ? <Bot className="w-4 h-4 text-sky-400" /> : <User className="w-4 h-4 text-emerald-400" />}
              </div>
              <div className={`flex-1 max-w-[80%] ${isAgent ? '' : 'flex flex-col items-end'}`}>
                <div className={`text-[11px] font-semibold mb-1 ${isAgent ? 'text-sky-400' : 'text-emerald-400'}`}>
                  {isAgent ? 'AI Agent' : 'Caller'}
                </div>
                <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isAgent ? 'bg-sky-500/10 border border-sky-500/15 text-white/85' : 'bg-emerald-500/10 border border-emerald-500/15 text-white/85'} ${turn.isStreaming ? 'animate-pulse' : ''}`}>
                  {turn.text}
                  {turn.isStreaming && <span className="ml-1 inline-block w-1.5 h-4 bg-white/60 animate-pulse rounded-sm align-middle" />}
                </div>
                <div className="text-[10px] text-white/25 mt-1 px-1">
                  {new Date(turn.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
        }

        const tool = item.data;
        return (
          <div key={i} className="flex items-start gap-2 pl-11">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mt-0.5">
              <Wrench className="w-2.5 h-2.5 text-amber-400" />
            </div>
            <div className="flex-1 bg-amber-500/8 border border-amber-500/15 rounded-xl px-3 py-2">
              <div className="text-[11px] font-semibold text-amber-400 mb-1">
                Tool: {tool.tool}
                {tool.durationMs && <span className="ml-2 text-white/25 font-normal">{tool.durationMs}ms</span>}
              </div>
              <div className="text-xs text-white/50 mb-1.5">
                <span className="text-white/30">Query: </span>{tool.input}
              </div>
              <div className="text-xs text-white/60 line-clamp-2">
                <span className="text-white/30">Result: </span>{tool.result}
              </div>
            </div>
          </div>
        );
      })}

      {isLive && (
        <div className="flex gap-3 pl-11">
          <div className="flex items-center gap-1.5 text-sky-400/60 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            AI is listening...
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
