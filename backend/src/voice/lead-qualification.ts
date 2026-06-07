import type OpenAI from 'openai';

export const LEAD_QUALIFICATION_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'qualify_lead',
      description:
        'Mark the caller as a qualified lead when they show genuine buying interest or fit the campaign criteria.',
      parameters: {
        type: 'object',
        properties: {
          interest_level: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: 'How interested the caller appears to be.',
          },
          notes: {
            type: 'string',
            description: 'Brief notes on why the caller is qualified.',
          },
        },
        required: ['interest_level'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_human_handoff',
      description:
        'Request transfer to a human agent when the caller explicitly asks for a person or the issue cannot be resolved by AI.',
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: 'Why the caller needs a human agent.',
          },
        },
        required: ['reason'],
      },
    },
  },
];
