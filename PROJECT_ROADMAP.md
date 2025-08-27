# TDEE Calculator App - Development Roadmap

## Current Status
✅ **Phase 1: Quick Access** - Complete  
✅ **Phase 2: Mobile UI Fixes** - Complete  
✅ **Welcome Back Time Display** - Fixed  

## AI Model Recommendations

### For General AI Features (Macros, Meals, Basic Coaching)
**Best Option: Claude 3 Haiku**
- Cost: ~$0.25 per 1M input tokens (vs $15 for Claude 3.5)
- Speed: Very fast responses
- Quality: Still excellent for structured tasks
- Perfect for: Macro calculations, meal suggestions, basic tips

**Alternative: GPT-3.5-Turbo**
- Cost: ~$0.50 per 1M input tokens
- Good quality but Haiku is cheaper and better

### For the "Reality Check" Feature
**Recommended: Claude 3 Haiku or GPT-4o-mini**
- Haiku: Great at being direct and honest while maintaining empathy
- GPT-4o-mini: $0.15 per 1M input - extremely cheap, good for straightforward feedback

## "Reality Check" Feature Concept

### Names to Consider:
- **"Truth Coach"** - Direct and clear
- **"Reality Check"** - Your original idea, very clear
- **"Straight Talk"** - Casual and approachable
- **"No BS Coach"** - Edgy but memorable
- **"Honest Feedback"** - Simple and clear

### Feature Design:
The AI would provide:

1. **Weight Fluctuation Reality**
   - "That 3 lb gain overnight? It's water weight, not fat. You'd need to eat 10,500 extra calories to gain 3 lbs of fat."
   - "Your weight can fluctuate 2-5 lbs daily due to sodium, carbs, and hydration."

2. **Goal Achievement Honesty**
   - "You're logging 2,000 calories but not losing weight? You're likely eating more than you think. Most people underestimate by 20-40%."
   - "Gaining muscle while losing fat is extremely difficult. Pick one goal at a time."

3. **Common Excuse Busters**
   - "No, your metabolism isn't 'broken.' You're eating more than you burn."
   - "Starvation mode at 1,500 calories? Unless you're 4'10", that's not happening."

4. **Positive Reality Too**
   - "You've lost 10 lbs in 8 weeks? That's actually perfect. 1-2 lbs/week is sustainable."
   - "Maintained weight for 3 months? That's success, not failure. Maintenance is harder than losing."

## Implementation Order

### Phase 3: AI Cost Optimization 🔥 **PRIORITY**
**Goal**: Reduce AI costs by 80-90% and add Reality Check feature

**Tasks:**
- Switch existing AI features to Claude Haiku:
  - Macro Calculator AI insights
  - Meal Suggestion generator  
  - Current coaching features
- Implement Reality Check feature with Claude Haiku/GPT-4o-mini
- Test cost savings and response quality
- Monitor API usage and costs

**Files to Update:**
- AI service configuration
- Macro calculator AI calls
- Meal suggestions AI calls
- Add new Reality Check component

### Phase 4: Fix Notifications 🚨
**Goal**: Debug and fix PWA notification system

**Current Issues:**
- Notifications not firing at all
- No timezone support
- Background scheduling not working when app is closed

**Tasks:**
- Debug why notifications aren't showing up
- Implement proper timezone handling
- Test background notification scheduling
- Ensure notifications work when PWA is closed
- Add notification permission handling
- Test on multiple devices/browsers

**Files to Update:**
- `/src/lib/notifications.ts`
- `/src/components/NotificationManager.tsx`
- Service Worker configuration
- PWA manifest settings

### Phase 5: Haptic Feedback ⚡
**Goal**: Enhance PWA native feel with vibration feedback

**Tasks:**
- Add vibration on button taps
- Implement haptic feedback for:
  - Calculator button presses
  - Form submissions
  - Success/error states
  - Navigation transitions
- Test on various mobile devices
- Add settings to enable/disable haptic feedback

**Implementation:**
- Use Navigator.vibrate() API
- Add haptic utility functions
- Integrate into existing components
- Graceful degradation for unsupported devices

### Phase 6: Brand Identity 🎨
**Goal**: Improve branding and visual identity

**Tasks:**
- **Choose Final App Name**
  - Current: "CalorieScope"
  - Alternatives needed
  
- **Design New Logo/Icon**
  - PWA app icon (multiple sizes)
  - Favicon
  - Loading screen logo
  - In-app branding elements
  
- **Update PWA Manifest**
  - App name and short name
  - Theme colors
  - Icon references
  - App description

**Deliverables:**
- Final brand name decision
- Logo design files
- PWA icon set (192x192, 512x512, etc.)
- Updated visual identity throughout app

### Phase 7: Enhanced Coaching 🏃
**Goal**: Expand AI coaching capabilities

**Tasks:**
- Build on Reality Check foundation
- Add personalized coaching based on user patterns
- Implement progress-based insights
- Create coaching conversation flows
- Add coaching history and recommendations

**Features:**
- Weekly progress summaries
- Goal adjustment suggestions  
- Habit tracking insights
- Personalized meal timing advice
- Exercise recommendations based on goals

## Technical Debt & Maintenance

### Ongoing Tasks:
- Monitor AI API costs after model switch
- Test mobile UI on various devices
- Performance optimization
- User feedback collection
- Analytics implementation

### Future Considerations:
- A/B testing for Reality Check feature
- User onboarding improvements
- Advanced progress tracking features
- Social features/sharing
- Integration with fitness trackers

## Success Metrics

### Phase 3 (AI Optimization):
- 80-90% reduction in AI API costs
- Maintained or improved response quality
- User engagement with Reality Check feature

### Phase 4 (Notifications):
- Notifications successfully firing
- Proper timing across time zones
- User retention improvement from notifications

### Phase 5 (Haptic Feedback):
- Enhanced user experience ratings
- Increased engagement with interactive elements
- Native app-like feel

### Phase 6 (Brand Identity):
- Recognizable brand identity
- Professional appearance
- Improved PWA installation rates

### Phase 7 (Enhanced Coaching):
- Increased user retention
- Better goal achievement rates
- Higher user satisfaction scores

## Risk Mitigation

### AI Cost Control:
- Monitor usage closely during transition
- Implement rate limiting if needed
- Have rollback plan to previous models

### Notification Issues:
- Test thoroughly across browsers
- Have fallback messaging system
- Clear user communication about limitations

### Brand Changes:
- User testing before final decisions
- Gradual rollout of new branding
- Maintain consistency across all touchpoints

## Resource Requirements

### Development Time Estimates:
- Phase 3: 2-3 days
- Phase 4: 3-4 days  
- Phase 5: 1-2 days
- Phase 6: 2-3 days (design dependent)
- Phase 7: 3-5 days

### External Dependencies:
- Logo/icon design (if outsourced)
- AI API rate limits and pricing
- PWA testing across devices
- User feedback collection

## Next Steps

1. **Immediate**: Begin Phase 3 (AI Cost Optimization)
2. **Week 1**: Complete AI model switch and Reality Check implementation
3. **Week 2**: Debug and fix notification system
4. **Week 3**: Add haptic feedback and begin brand identity work
5. **Week 4**: Finalize branding and begin enhanced coaching features

## Notes

- Prioritize cost optimization first to prevent high API bills
- Test each phase thoroughly before moving to next
- Collect user feedback throughout implementation
- Monitor performance and costs at each step
- Maintain backward compatibility where possible