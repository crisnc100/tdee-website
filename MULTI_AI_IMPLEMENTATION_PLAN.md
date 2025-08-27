# Multi-AI Model Implementation Plan

## 📋 Current Architecture Analysis

### Existing AI Integration Points:
1. **`/src/lib/openrouter.ts`** - Core AI service (currently Claude 3.5 Sonnet)
2. **`/src/app/api/ai/coaching/route.ts`** - TDEE coaching with fallback
3. **`/src/app/api/ai/meals/route.ts`** - Meal suggestions (static database)
4. **`/src/app/api/ai/macros/route.ts`** - Macro calculations (rule-based)
5. **`/src/components/ai/AICoaching.tsx`** - UI component for coaching

### Current Usage Pattern:
- Single model for all AI features (Claude 3.5 Sonnet)
- OpenRouter API integration
- Fallback to rule-based system when API fails
- Cost: ~$15 per 1M tokens

---

## 🎯 Implementation Plan: Phase-by-Phase

### **Phase 1: Core AI Service Architecture (Day 1)**

#### **1.1 Create Enhanced AI Service**
**File**: `/src/lib/aiService.ts`

**Features**:
- Multi-model support (GPT-4o-mini, Qwen3 8B, Gemini 2.0 Flash)
- Model-specific prompt optimization
- Automatic fallback hierarchy
- Cost tracking per model
- User preference integration

#### **1.2 Create Model Configuration**
**File**: `/src/types/ai.ts`

**Features**:
- Model definitions and capabilities
- Pricing information
- Performance characteristics
- User-friendly names and descriptions

#### **1.3 Update OpenRouter Integration**
**File**: `/src/lib/openrouter.ts`

**Changes**:
- Support multiple model endpoints
- Model-specific parameter optimization
- Enhanced error handling
- Usage analytics

---

### **Phase 2: User Settings & Preferences (Day 1-2)**

#### **2.1 AI Model Settings Component**
**File**: `/src/components/settings/AIModelSettings.tsx`

**Features**:
- Model selection interface
- Performance/cost trade-off visualization
- Real-time cost estimates
- Model capability explanations

#### **2.2 User Preferences Storage**
**File**: `/src/lib/userPreferences.ts`

**Features**:
- localStorage for AI model preferences
- Default model selection logic
- Context-aware model suggestions

#### **2.3 Settings Integration**
**Files**: Update existing settings pages

**Changes**:
- Add AI model preferences to user settings
- Onboarding flow for model selection
- Quick model switcher in coaching interfaces

---

### **Phase 3: Enhanced Coaching System (Day 2-3)**

#### **3.1 Advanced AI Coaching Service**
**File**: `/src/lib/aiCoaching.ts`

**Features**:
- Reality Check coaching mode
- Model-specific prompt engineering
- Context-aware model selection
- Response quality optimization

#### **3.2 Coaching Mode Selection**
**File**: `/src/components/ai/CoachingModeSelector.tsx`

**Features**:
- Supportive vs Reality Check toggle
- Model recommendation per mode
- Context explanation for users

#### **3.3 Enhanced Coaching Interface**
**File**: `/src/components/ai/AICoaching.tsx`

**Updates**:
- Multi-model support
- Coaching mode integration
- Model performance indicators
- User feedback collection

---

### **Phase 4: API Route Updates (Day 3)**

#### **4.1 Enhanced Coaching API**
**File**: `/src/app/api/ai/coaching/route.ts`

**Updates**:
- Multi-model request handling
- Model-specific prompt selection
- Cost optimization logic
- Usage tracking

#### **4.2 Smart Model Selection**
**File**: `/src/lib/modelSelector.ts`

**Features**:
- Context-aware model selection
- Cost-performance optimization
- User preference integration
- Fallback model hierarchy

---

### **Phase 5: User Interface Enhancements (Day 4)**

#### **5.1 Model Performance Indicators**
**Components**: Various AI-powered components

**Features**:
- Model name display
- Response time indicators
- Cost transparency
- Quality ratings

#### **5.2 Onboarding Experience**
**File**: `/src/components/onboarding/AIModelOnboarding.tsx`

**Features**:
- Model selection wizard
- Performance vs cost education
- Personalized recommendations
- Easy switching demonstration

---

## 🛠️ Detailed Implementation Steps

### **Step 1: Core AI Service (4-6 hours)**

```typescript
// /src/lib/aiService.ts structure
export enum AIModel {
  GPT_4O_MINI = 'openai/gpt-4o-mini-2024-07-18',
  QWEN3_8B = 'qwen/qwen3-8b:free',
  GEMINI_2_FLASH = 'google/gemini-2.0-flash-exp:free'
}

export enum CoachingMode {
  SUPPORTIVE = 'supportive',
  REALITY_CHECK = 'reality_check',
  EDUCATIONAL = 'educational'
}

export class AIService {
  async getCoaching(context, mode, userModel?)
  async generateResponse(prompt, model, options?)
  async selectOptimalModel(context, userPreference?)
  trackUsage(model, tokens, cost)
}
```

### **Step 2: User Settings Interface (3-4 hours)**

```typescript
// Component for model selection
const AIModelSettings = () => {
  const [selectedModel, setSelectedModel] = useState(AIModel.GPT_4O_MINI);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  
  // Model comparison interface
  // Real-time cost calculator
  // Performance explanations
};
```

### **Step 3: Enhanced Coaching (4-5 hours)**

```typescript
// Model-specific prompts
const COACHING_PROMPTS = {
  [AIModel.GPT_4O_MINI]: {
    [CoachingMode.SUPPORTIVE]: "You are an encouraging fitness coach...",
    [CoachingMode.REALITY_CHECK]: "You are a direct, honest fitness coach..."
  },
  [AIModel.QWEN3_8B]: {
    // Optimized for Qwen's thinking mode
  },
  [AIModel.GEMINI_2_FLASH]: {
    // Optimized for Gemini's massive context
  }
};
```

### **Step 4: API Integration (2-3 hours)**

```typescript
// Enhanced API route
export async function POST(request: NextRequest) {
  const { userData, tdeeResult, preferredModel, coachingMode } = await request.json();
  
  const aiService = new AIService();
  const selectedModel = await aiService.selectOptimalModel(
    { userData, tdeeResult, mode: coachingMode },
    preferredModel
  );
  
  const response = await aiService.getCoaching(
    { userData, tdeeResult },
    coachingMode,
    selectedModel
  );
  
  return NextResponse.json({
    response,
    model: selectedModel,
    cost: aiService.getLastRequestCost(),
    suggestions: aiService.getAlternativeModels()
  });
}
```

---

## 🎨 User Experience Design

### **Model Selection Interface**

```
🎯 Choose Your AI Coach Style

○ Balanced (GPT-4o-mini) ⭐ Recommended
  • Best overall quality and speed
  • ~$0.75/month for typical usage
  • Perfect balance of performance and cost

○ Lightning Fast (Qwen3 8B) ⚡ Free
  • Instant responses
  • Great for quick calculations
  • Completely free!

○ Deep Context (Gemini 2.0 Flash) 🧠 Experimental
  • Remembers entire conversation history
  • Latest Google technology
  • Free (experimental)

Advanced Options:
☐ Auto-select best model for each question
☐ Always ask before using paid models
☐ Show cost breakdown for each response
```

### **Reality Check Mode Interface**

```
💬 Ask Your Coach

[Text input area]

Coach Style:
○ Supportive & Encouraging
○ Reality Check (Honest & Direct) 
○ Educational & Detailed

Model: GPT-4o-mini ⚙️ Change
Estimated cost: <$0.01

[Send Message]
```

---

## 📊 Success Metrics & Testing

### **Phase 1 Success Criteria:**
- [ ] Multi-model integration working
- [ ] 90%+ cost reduction vs current setup
- [ ] Sub-3 second response times
- [ ] Graceful fallback handling

### **Phase 2 Success Criteria:**
- [ ] User model preferences persist
- [ ] Intuitive model selection interface
- [ ] Clear cost transparency
- [ ] Easy model switching

### **Phase 3 Success Criteria:**
- [ ] Reality Check mode provides distinct responses
- [ ] Model-specific prompts optimized
- [ ] User satisfaction with response quality
- [ ] Coaching modes clearly differentiated

### **Performance Benchmarks:**
- **Response Time**: <3 seconds for all models
- **Cost Reduction**: 90%+ vs current Claude 3.5 setup
- **User Satisfaction**: A/B test new vs old coaching
- **Model Selection**: 80% users try multiple models

---

## 🚀 Deployment Strategy

### **Day 1**: Core Infrastructure
- Deploy AI service architecture
- Update OpenRouter integration
- Basic model selection (no UI)

### **Day 2**: User Interface
- Deploy model settings interface  
- Add onboarding flow
- Enable user model preferences

### **Day 3**: Enhanced Features
- Deploy Reality Check mode
- Model-specific optimizations
- Performance monitoring

### **Day 4**: Polish & Launch
- UI/UX refinements
- User testing feedback
- Full feature launch

---

## 🛡️ Risk Mitigation

### **Technical Risks:**
- **Free model availability**: Fallback to GPT-4o-mini if free models unavailable
- **API rate limits**: Implement request queuing and retry logic
- **Model response quality**: A/B testing and user feedback collection

### **User Experience Risks:**
- **Decision fatigue**: Smart defaults and auto-selection options
- **Confusion**: Clear explanations and progressive disclosure
- **Cost concerns**: Transparent pricing and monthly usage caps

### **Business Risks:**
- **Unexpected costs**: Real-time usage monitoring and alerts
- **Model deprecation**: Multi-model strategy reduces vendor lock-in
- **User churn**: Quality monitoring and feedback integration

---

## 📈 Expected Outcomes

### **Cost Savings:**
- **Current**: ~$15/month for 1M tokens (Claude 3.5)
- **New Hybrid**: ~$0.50/month (70% GPT-4o-mini, 30% free models)
- **Savings**: 96.7% cost reduction

### **User Value:**
- **Choice**: Users control their AI experience
- **Transparency**: Clear cost and performance information
- **Innovation**: First fitness app with multi-AI selection
- **Flexibility**: Match AI capability to specific needs

### **Technical Benefits:**
- **Resilience**: Multi-model fallback reduces downtime
- **Scalability**: Free models handle high-volume requests
- **Future-proof**: Easy to add new models as they emerge
- **Differentiation**: Unique feature vs competitors

---

## 🎯 Next Steps

1. **Review and approve plan** with stakeholder
2. **Set up development environment** for multi-model testing
3. **Begin Phase 1 implementation** with core AI service
4. **Create user testing plan** for model selection interface
5. **Prepare monitoring and analytics** for cost and performance tracking

**Estimated Total Implementation Time**: 4-5 days
**Expected Launch Date**: Within 1 week of approval
**Success Measurement**: 90% cost reduction + maintained user satisfaction