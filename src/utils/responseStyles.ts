export interface ResponseStyle {
  id: string;
  name: string;
  description: string;
  instruction: string;
  icon: string;
  color: string;
}

export const RESPONSE_STYLES: ResponseStyle[] = [
  {
    id: 'default',
    name: 'Balanced',
    description: 'Well-rounded responses with good detail',
    instruction: '',
    icon: '⚖️',
    color: 'from-gray-500 to-slate-600'
  },
  {
    id: 'short',
    name: 'Concise',
    description: 'Brief, to-the-point responses',
    instruction: 'Provide concise, brief responses. Keep your answers short and to the point. Aim for 1-2 sentences when possible. Focus on the most essential information only. Avoid lengthy explanations unless absolutely necessary.',
    icon: '⚡',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'detailed',
    name: 'Comprehensive',
    description: 'Thorough, in-depth explanations',
    instruction: 'Provide comprehensive, detailed responses with thorough explanations. Include background context, multiple perspectives, examples, and step-by-step breakdowns when relevant. Aim to be educational and informative. Cover all aspects of the topic thoroughly.',
    icon: '📖',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'bullet_points',
    name: 'Bullet Points',
    description: 'Structured, easy-to-scan format',
    instruction: 'Format your responses using bullet points, numbered lists, and clear structure. Break down information into digestible chunks. Use headings, subheadings, and organized lists to make content easy to scan and understand. Prioritize clarity and organization.',
    icon: '📋',
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 'step_by_step',
    name: 'Step-by-Step',
    description: 'Sequential, instructional format',
    instruction: 'Provide responses in a clear step-by-step format. Number each step and explain the process sequentially. Include any prerequisites, tools needed, or important considerations for each step. Make instructions easy to follow and implement.',
    icon: '🔢',
    color: 'from-purple-500 to-violet-600'
  },
  {
    id: 'examples',
    name: 'Example-Rich',
    description: 'Heavy use of examples and illustrations',
    instruction: 'Include plenty of concrete examples, illustrations, and real-world applications in your responses. Use analogies, case studies, and practical demonstrations to explain concepts. Make abstract ideas tangible through specific examples.',
    icon: '💡',
    color: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Formal, business-appropriate tone',
    instruction: 'Maintain a professional, formal tone suitable for business or academic contexts. Use proper terminology, avoid casual language, and structure responses in a polished, professional manner. Focus on accuracy and credibility.',
    icon: '👔',
    color: 'from-slate-600 to-gray-700'
  },
  {
    id: 'beginner_friendly',
    name: 'Beginner-Friendly',
    description: 'Simple explanations for newcomers',
    instruction: 'Explain concepts in simple, beginner-friendly terms. Avoid jargon and technical language unless necessary, and when used, provide clear definitions. Use analogies and simple examples that anyone can understand. Be patient and encouraging in your explanations.',
    icon: '🌱',
    color: 'from-green-400 to-teal-500'
  }
];

export function getResponseStyleById(id: string): ResponseStyle | null {
  return RESPONSE_STYLES.find(style => style.id === id) || null;
}

export function getDefaultResponseStyle(): ResponseStyle {
  return RESPONSE_STYLES[0]; // Default/Balanced style
}