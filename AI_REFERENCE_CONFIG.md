# AI Coach Reference Configuration
*Preserved from original implementation for future use*

## AI Models to Use (via OpenRouter)

### Primary Models
```typescript
'gpt-oss-120b': {
  id: 'gpt-oss-120b',
  name: 'GPT-OSS 120B',
  openRouterModel: 'openai/gpt-oss-120b',
  tier: 'standard',
  pricing: {
    inputCostPer1M: 0.072,   // $0.072 per 1M input tokens
    outputCostPer1M: 0.28,   // $0.28 per 1M output tokens
    isFree: false
  },
  performance: {
    avgResponseTime: 3.0,
    contextWindow: 131000,
    qualityScore: 0.92
  },
  strengths: ['Production-ready', 'Excellent reasoning', 'Good for coaching']
}

'qwen3-235b': {
  id: 'qwen3-235b', 
  name: 'Qwen3 235B',
  openRouterModel: 'qwen/qwen3-235b-a22b-2507',
  tier: 'premium',
  pricing: {
    inputCostPer1M: 0.078,   // $0.078 per 1M input tokens
    outputCostPer1M: 0.312,  // $0.312 per 1M output tokens
    isFree: false
  },
  performance: {
    avgResponseTime: 3.5,
    contextWindow: 262144,  // 262K context!
    qualityScore: 0.95
  },
  strengths: ['Complex problem-solving', 'Breaking plateaus', 'Advanced strategies']
}

'gpt-4o-mini': {
  id: 'gpt-4o-mini',
  name: 'GPT-4o Mini',
  openRouterModel: 'openai/gpt-4o-mini',
  tier: 'standard',
  pricing: {
    inputCostPer1M: 0.15,   // $0.15 per 1M input tokens
    outputCostPer1M: 0.60,  // $0.60 per 1M output tokens
    isFree: false
  },
  performance: {
    avgResponseTime: 2.5,
    contextWindow: 128000,
    qualityScore: 0.88
  },
  strengths: ['Instruction following', 'Health/nutrition tasks', 'Reliable fallback']
}
```

### Free Models
```typescript
'deepseek-chat': {
  id: 'deepseek-chat',
  name: 'DeepSeek Chat v3',
  openRouterModel: 'deepseek/deepseek-chat-v3-0324:free',
  tier: 'free',
  pricing: {
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    rateLimits: {
      requestsPerHour: 150,
      requestsPerDay: 1500
    }
  },
  performance: {
    avgResponseTime: 3.5,
    contextWindow: 65536,
    qualityScore: 0.88
  },
  strengths: ['Free', 'High-performance', 'Excellent comprehension']
}

'gemini-2.0-flash-exp': {
  id: 'gemini-2.0-flash-exp',
  name: 'Gemini 2.0 Flash (Experimental)',
  openRouterModel: 'google/gemini-2.0-flash-exp:free',
  tier: 'experimental',
  pricing: {
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    rateLimits: {
      requestsPerHour: 100,
      requestsPerDay: 1000
    }
  },
  performance: {
    avgResponseTime: 2.0,
    contextWindow: 1000000,  // 1M context!
    qualityScore: 0.85
  },
  strengths: ['Fast inference', 'Free', 'Good for experimentation']
}

'qwq-32b': {
  id: 'qwq-32b',
  name: 'QwQ 32B',
  openRouterModel: 'qwen/qwq-32b:free',
  tier: 'free',
  isAvailable: false,  // DISABLED - shows internal reasoning to users
  note: 'Strong reasoning but exposes thought process - not suitable for production'
}
```

## Coaching Personalities

### 1. Supportive Coach 🤗
```typescript
{
  id: 'supportive',
  name: 'Supportive Coach',
  description: 'Encouraging and motivational, builds confidence',
  systemPrompt: 'You are an encouraging fitness coach who celebrates small wins and provides gentle, sustainable advice.',
  temperature: 0.8,
  traits: [
    'Uses positive reinforcement',
    'Acknowledges challenges empathetically',
    'Focuses on progress over perfection',
    'Provides realistic timelines'
  ]
}
```

### 2. Reality Check Coach 🎯
```typescript
{
  id: 'reality-check',
  name: 'Reality Check',
  description: 'Direct, honest, myth-busting approach',
  systemPrompt: 'You are a no-nonsense fitness expert who tells the hard truth, debunks myths, and cuts through excuses.',
  temperature: 0.6,
  traits: [
    'Calls out excuses directly',
    'Provides evidence-based reality',
    'No sugarcoating',
    'Focuses on what actually works'
  ]
}
```

### 3. Data Analyst Coach 📊
```typescript
{
  id: 'analytical',
  name: 'Data Analyst',
  description: 'Numbers-driven, optimization-focused',
  systemPrompt: 'You are a data-driven fitness analyst who uses numbers, calculations, and trends to optimize performance.',
  temperature: 0.5,
  traits: [
    'Provides specific numbers',
    'Shows trends and patterns',
    'Makes data-based recommendations',
    'Calculates optimal targets'
  ]
}
```

### 4. Socratic Coach 🧠
```typescript
{
  id: 'socratic',
  name: 'Socratic Coach',
  description: 'Guides through thoughtful questions',
  systemPrompt: 'You are a Socratic coach who helps users discover insights by asking thought-provoking questions before providing answers.',
  temperature: 0.7,
  traits: [
    'Asks "what do you think would happen if..."',
    'Encourages self-reflection',
    'Guides to conclusions',
    'Teaches through inquiry'
  ]
}
```

## Response Structure Templates

### For Future Implementation:

```typescript
// Structured response format
interface CoachResponse {
  sections: {
    data?: {
      type: 'stats' | 'metrics' | 'calculations',
      items: Array<{label: string, value: string, unit: string}>
    },
    insights?: {
      type: 'explanation' | 'education',
      content: string
    },
    actions?: {
      type: 'checklist' | 'steps',
      items: string[]
    },
    plan?: {
      type: 'meal' | 'workout' | 'weekly',
      structure: any
    }
  }
}
```

## Context Integration Points

### TDEE Data
- Only include when relevant to query
- Use for calorie/macro calculations
- Reference for progress tracking

### Progress Tracker
- Pull recent trends
- Identify patterns
- Track commitment completion

### User Preferences
- Dietary restrictions
- Time constraints
- Equipment availability
- Injury considerations

## Prompt Engineering Best Practices

1. **Always include**:
   - Safety disclaimers
   - Evidence-based requirement
   - No medical diagnosis rule

2. **Format instructions**:
   - Use markers for sections [DATA], [INSIGHT], etc.
   - Keep responses under 2500 tokens
   - Structure for easy parsing

3. **Context management**:
   - Include last 3-5 messages max
   - Summarize older context
   - Track commitments separately

---

*This configuration will be used when implementing AI Coach 2.0*