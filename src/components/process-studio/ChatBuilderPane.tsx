import React, { useState } from 'react';
import { Bot, Send, Sparkles, User } from 'lucide-react';
import type { ProcessDefinition } from '../../types/process';
import {
  synthesizeProcessFromPrompt,
  type ChatMessage,
} from '../../utils/process-synthesizer';
import { Badge, Button, Input } from '../ui';
import type { StudioPaneView } from './ProcessStudioView';

interface ChatBuilderPaneProps {
  process: ProcessDefinition;
  onProcessUpdated: (updated: ProcessDefinition, autoShowPreview: boolean) => void;
  onJumpToView: (view: StudioPaneView) => void;
}

const PRESET_PROMPTS = [
  'Create an Employee Expense Claim & Reimbursement process',
  'Build a Vendor Onboarding & Risk Screening process',
  'Create an IT Asset Allocation & Access request',
  'Add field Priority and warn if amount > $1500',
];

export function ChatBuilderPane({
  process,
  onProcessUpdated,
  onJumpToView,
}: ChatBuilderPaneProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text:
        process.screenJson.fields.length === 0
          ? 'Describe the ERP process you want to build (domain, fields, approvals, or rules). I will synthesize the Screen JSON, Data Tables, Workflow, and Skill File—and auto-open the Screen Preview once ready.'
          : `Loaded **${process.name}** (v${process.version}). Ask me to add fields, tighten Skill rules, or streamline the workflow.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [readinessPct, setReadinessPct] = useState(
    process.screenJson.fields.length > 0 ? 100 : 15
  );

  const handleSend = (textToSend?: string) => {
    const trimmed = (textToSend ?? input).trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    const userTurnCount = messages.filter((m) => m.sender === 'user').length;
    const result = synthesizeProcessFromPrompt(trimmed, process, userTurnCount);

    const aiMsg: ChatMessage = {
      id: `msg-a-${Date.now() + 1}`,
      sender: 'assistant',
      text: result.reply,
      timestamp: new Date().toISOString(),
      artifactsSummary: result.artifactsSummary,
      suggestedQuestions: result.suggestedQuestions,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setReadinessPct(result.readinessPct);
    if (!textToSend) setInput('');
    onProcessUpdated(result.updatedProcess, result.shouldAutoShowPreview);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="flex h-full min-h-0 flex-col justify-between">
      {/* Readiness Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 bg-white">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>Process Synthesizer</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 tabular-nums">
            Readiness: {readinessPct}%
          </span>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${readinessPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'assistant' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white mt-0.5">
                <Bot className="h-3.5 w-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 text-slate-800 ring-1 ring-slate-900/5'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>

              {m.artifactsSummary && m.artifactsSummary.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/70">
                  {m.artifactsSummary.map((chip) => (
                    <Badge key={chip} variant="default" className="text-[10px]">
                      {chip}
                    </Badge>
                  ))}
                  <button
                    type="button"
                    onClick={() => onJumpToView('preview')}
                    className="ml-auto text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    View Screen →
                  </button>
                </div>
              )}

              {m.suggestedQuestions && m.suggestedQuestions.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {m.suggestedQuestions.map((sq) => (
                    <button
                      key={sq}
                      type="button"
                      onClick={() => handleSend(sq)}
                      className="rounded-lg bg-white px-2.5 py-1 text-left text-[11px] font-medium text-blue-700 ring-1 ring-blue-600/20 hover:bg-blue-50"
                    >
                      {sq}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {m.sender === 'user' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 mt-0.5">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Presets + Input */}
      <div className="border-t border-slate-100 bg-slate-50/60 p-3 space-y-2.5">
        <div className="flex flex-wrap gap-1.5">
          {PRESET_PROMPTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleSend(preset)}
              className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm ring-1 ring-slate-900/5 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>

        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe fields, workflow stages, or Skill rules..."
            className="flex-1"
          />
          <Button type="submit" size="md">
            <Send className="h-3.5 w-3.5" />
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
