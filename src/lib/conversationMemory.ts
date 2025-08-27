interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    mode?: string;
    cost?: number;
    responseTime?: number;
  };
}

interface UserContext {
  tdeeResult: any;
  userData: any;
  goals: string[];
  strugglingAreas: string[];
  preferences: string[];
  lastTopics: string[];
}

interface ConversationSummary {
  keyTopics: string[];
  userGoals: string[];
  recommendations: string[];
  lastUpdated: Date;
}

export class ConversationMemory {
  private history: ConversationTurn[] = [];
  private context: UserContext | null = null;
  private summary: ConversationSummary | null = null;
  private maxHistoryLength = 20;
  private storageKey = 'ai-coach-memory';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          this.history = (data.history || []).map((turn: any) => ({
            ...turn,
            timestamp: new Date(turn.timestamp)
          }));
          this.context = data.context;
          this.summary = data.summary ? {
            ...data.summary,
            lastUpdated: new Date(data.summary.lastUpdated)
          } : null;
        } catch (error) {
          console.error('Failed to load conversation memory:', error);
        }
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify({
          history: this.history,
          context: this.context,
          summary: this.summary
        }));
      } catch (error) {
        console.error('Failed to save conversation memory:', error);
      }
    }
  }

  addTurn(turn: Omit<ConversationTurn, 'id' | 'timestamp'>) {
    const newTurn: ConversationTurn = {
      ...turn,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    this.history.push(newTurn);

    // Maintain max history length
    if (this.history.length > this.maxHistoryLength) {
      // Keep the most recent turns
      this.history = this.history.slice(-this.maxHistoryLength);
    }

    // Update summary if it's an assistant response
    if (turn.role === 'assistant') {
      this.updateSummary();
    }

    this.saveToStorage();
  }

  updateContext(context: Partial<UserContext>) {
    this.context = {
      ...this.context,
      ...context
    } as UserContext;
    this.saveToStorage();
  }

  private updateSummary() {
    // Extract key topics from recent conversations
    const recentMessages = this.history.slice(-10);
    const topics = new Set<string>();
    const goals = new Set<string>();
    
    recentMessages.forEach(turn => {
      const content = turn.content.toLowerCase();
      
      // Extract topics
      if (content.includes('protein')) topics.add('protein intake');
      if (content.includes('workout') || content.includes('exercise')) topics.add('workout planning');
      if (content.includes('meal') || content.includes('food')) topics.add('meal planning');
      if (content.includes('weight loss') || content.includes('cutting')) topics.add('weight loss');
      if (content.includes('muscle') || content.includes('bulk')) topics.add('muscle building');
      if (content.includes('supplement')) topics.add('supplementation');
      if (content.includes('sleep') || content.includes('recovery')) topics.add('recovery');
      
      // Extract goals
      if (content.includes('lose') && content.includes('weight')) goals.add('lose weight');
      if (content.includes('build') && content.includes('muscle')) goals.add('build muscle');
      if (content.includes('maintain')) goals.add('maintain weight');
      if (content.includes('improve') && content.includes('health')) goals.add('improve health');
    });

    this.summary = {
      keyTopics: Array.from(topics),
      userGoals: Array.from(goals),
      recommendations: this.extractRecommendations(),
      lastUpdated: new Date()
    };
  }

  private extractRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Analyze assistant responses for recommendations
    const assistantTurns = this.history.filter(t => t.role === 'assistant').slice(-5);
    
    assistantTurns.forEach(turn => {
      const content = turn.content;
      
      // Look for recommendation patterns
      const patterns = [
        /(?:recommend|suggest|try|consider|should)\s+(.+?)(?:\.|,|$)/gi,
        /(?:focus on|prioritize|ensure)\s+(.+?)(?:\.|,|$)/gi,
        /(?:aim for|target)\s+(.+?)(?:\.|,|$)/gi
      ];
      
      patterns.forEach(pattern => {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          if (match[1] && match[1].length < 100) {
            recommendations.push(match[1].trim());
          }
        }
      });
    });
    
    // Deduplicate and limit
    return [...new Set(recommendations)].slice(0, 5);
  }

  getRecentHistory(limit: number = 5): ConversationTurn[] {
    return this.history.slice(-limit);
  }

  getContextForPrompt(): string {
    const recent = this.getRecentHistory(3);
    const contextParts: string[] = [];

    if (this.context?.tdeeResult) {
      contextParts.push(`User's TDEE: ${this.context.tdeeResult.tdee} calories`);
    }

    if (this.context?.goals && this.context.goals.length > 0) {
      contextParts.push(`Goals: ${this.context.goals.join(', ')}`);
    }

    if (this.summary?.keyTopics && this.summary.keyTopics.length > 0) {
      contextParts.push(`Recent topics: ${this.summary.keyTopics.join(', ')}`);
    }

    if (recent.length > 0) {
      contextParts.push('Recent conversation:');
      recent.forEach(turn => {
        const role = turn.role === 'user' ? 'User' : 'AI';
        contextParts.push(`${role}: ${turn.content.substring(0, 200)}...`);
      });
    }

    return contextParts.join('\n');
  }

  getSmartGreeting(): string {
    const now = new Date();
    const hour = now.getHours();
    
    let timeGreeting = '';
    if (hour < 12) timeGreeting = 'Good morning!';
    else if (hour < 17) timeGreeting = 'Good afternoon!';
    else timeGreeting = 'Good evening!';

    // Check if returning user
    if (this.history.length > 0) {
      const lastTurn = this.history[this.history.length - 1];
      const hoursSinceLastChat = (now.getTime() - lastTurn.timestamp.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastChat < 1) {
        return "Welcome back! What else can I help you with?";
      } else if (hoursSinceLastChat < 24) {
        return `${timeGreeting} Ready to continue where we left off?`;
      } else if (hoursSinceLastChat < 168) { // 1 week
        return `${timeGreeting} Good to see you again! How's your progress been?`;
      }
    }

    // New user or long absence
    if (this.context?.tdeeResult) {
      return `${timeGreeting} I've analyzed your TDEE results (${this.context.tdeeResult.tdee} cal/day). What would you like to explore first?`;
    }

    return `${timeGreeting} I'm your AI fitness coach. How can I help you reach your goals today?`;
  }

  getSuggestedQuestions(): string[] {
    const suggestions: string[] = [];
    
    // Base suggestions on context and history
    if (!this.history.length) {
      // First time user
      suggestions.push("How should I adjust my calories for weight loss?");
      suggestions.push("What's a good macro split for muscle building?");
      suggestions.push("Can you create a workout plan for me?");
    } else if (this.summary?.keyTopics.includes('meal planning')) {
      suggestions.push("Show me high-protein breakfast ideas");
      suggestions.push("How can I meal prep for the week?");
      suggestions.push("What are good post-workout meals?");
    } else if (this.summary?.keyTopics.includes('workout planning')) {
      suggestions.push("What's the best workout split for me?");
      suggestions.push("How should I progressive overload?");
      suggestions.push("Can you explain proper form for squats?");
    } else if (this.summary?.userGoals.includes('lose weight')) {
      suggestions.push("How can I break through a weight loss plateau?");
      suggestions.push("What's the optimal deficit for fat loss?");
      suggestions.push("Should I do cardio or weights for fat loss?");
    } else {
      // Generic helpful suggestions
      suggestions.push("Review my progress this week");
      suggestions.push("What supplements should I consider?");
      suggestions.push("How can I improve my recovery?");
    }
    
    return suggestions.slice(0, 3);
  }

  clear() {
    this.history = [];
    this.summary = null;
    // Keep context as it contains user data
    this.saveToStorage();
  }

  exportHistory(): string {
    return JSON.stringify({
      history: this.history,
      context: this.context,
      summary: this.summary,
      exported: new Date().toISOString()
    }, null, 2);
  }
}