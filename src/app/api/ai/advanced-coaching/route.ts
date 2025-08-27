import { NextRequest, NextResponse } from 'next/server';
import { getAdvancedCoaching, CoachingMode } from '@/lib/aiCoaching';
import { AIModelId } from '@/types/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      mode, 
      coachingMode,
      userData, 
      tdeeResult, 
      context,
      specificQuestion,
      userMessage,
      message,  // Add this for compatibility
      conversationHistory,
      preferredModel,
      userPreferences 
    } = body;
    
    console.log('[Advanced Coaching API] Received request:', {
      hasMode: !!mode,
      hasCoachingMode: !!coachingMode,
      hasMessage: !!message,
      hasUserMessage: !!userMessage,
      hasSpecificQuestion: !!specificQuestion,
      messagePreview: message?.substring(0, 100),
      userMessagePreview: userMessage?.substring(0, 100),
      specificQuestionPreview: specificQuestion?.substring(0, 100),
      preferredModel
    });

    // Use either mode or coachingMode parameter
    const selectedMode = (coachingMode || mode) as CoachingMode;
    
    // Validate required fields
    if (!selectedMode || !userData || !tdeeResult) {
      return NextResponse.json(
        { error: 'Missing required fields: mode/coachingMode, userData, or tdeeResult' },
        { status: 400 }
      );
    }

    // Validate coaching mode
    const validModes: CoachingMode[] = ['supportive', 'reality-check', 'educational', 'analytical'];
    if (!validModes.includes(selectedMode)) {
      return NextResponse.json(
        { error: 'Invalid coaching mode. Must be one of: supportive, reality-check, educational, analytical' },
        { status: 400 }
      );
    }

    try {
      // Build context for conversational coaching
      const coachingContext = {
        previousInteractions: conversationHistory?.length || 0,
        userGoals: userData?.goals ? [userData.goals] : ['Fitness improvement'],
        successRate: 0.8, // Default success rate
        preferredTone: selectedMode === 'reality-check' ? 'direct' : 
                      selectedMode === 'educational' ? 'scientific' : 'gentle',
        strugglingAreas: [],
        ...context // Allow override if provided
      };
      
      // Use the actual message from the request (prioritize message, then userMessage, then specificQuestion)
      const actualMessage = message || userMessage || specificQuestion;
      
      console.log('[Advanced Coaching API] Processing message:', {
        actualMessage: actualMessage?.substring(0, 200),
        hasTimestamp: actualMessage?.includes('[Timestamp:') || actualMessage?.includes('[Request ID:'),
        length: actualMessage?.length
      });
      
      // If there's a specific message and it's not an initial analysis, make sure it's treated as a follow-up
      const isFollowUp = actualMessage && !actualMessage.includes('Analyze these TDEE results');
      
      // Build the question prompt differently for follow-ups
      const questionPrompt = isFollowUp 
        ? `User Question: ${actualMessage}\n\nProvide a helpful, specific response to this question based on their TDEE data and fitness goals.`
        : actualMessage;
        
      console.log('[Advanced Coaching API] Sending to coaching service:', {
        mode: selectedMode,
        questionPrompt: questionPrompt?.substring(0, 100),
        preferredModel
      });
      
      // Use advanced coaching service with conversational support
      const coachingResponse = await getAdvancedCoaching(
        selectedMode,
        userData,
        tdeeResult,
        {
          context: coachingContext,
          specificQuestion: questionPrompt,
          preferredModel: preferredModel as AIModelId,
          userPreferences
          // Note: conversationHistory is handled internally via context
        }
      );

      return NextResponse.json({
        success: true,
        content: coachingResponse.content,
        modelUsed: coachingResponse.modelUsed,
        estimatedCost: coachingResponse.estimatedCost,
        responseTime: coachingResponse.responseTime,
        coaching: coachingResponse, // Keep full response for backward compatibility
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

    } catch (coachingError) {
      console.error('[Advanced Coaching API] Coaching service error:', coachingError);
      
      return NextResponse.json(
        { 
          error: 'Advanced coaching service temporarily unavailable',
          fallbackAvailable: true,
          details: coachingError instanceof Error ? coachingError.message : 'Unknown error'
        },
        { 
          status: 503,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

  } catch (error) {
    console.error('[Advanced Coaching API] Request processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process advanced coaching request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}

/**
 * GET endpoint for coaching mode information
 */
export async function GET() {
  try {
    return NextResponse.json({
      availableModes: [
        {
          id: 'supportive',
          name: 'Supportive Coach',
          description: 'Encouraging, motivational guidance that builds confidence',
          recommendedFor: ['beginners', 'motivation-seekers', 'gentle-guidance'],
          recommendedModel: 'gpt-4o-mini'
        },
        {
          id: 'reality-check',
          name: 'Reality Check',
          description: 'Direct, honest feedback that cuts through myths',
          recommendedFor: ['experienced-users', 'myth-busters', 'direct-feedback'],
          recommendedModel: 'gpt-4o-mini',
          warning: 'Provides direct, potentially challenging feedback'
        },
        {
          id: 'educational',
          name: 'Educational Expert', 
          description: 'Detailed explanations with scientific backing',
          recommendedFor: ['science-interested', 'learning-focused', 'detail-oriented'],
          recommendedModel: 'gpt-4o-mini'
        },
        {
          id: 'analytical',
          name: 'Data Analyst',
          description: 'Numbers-driven insights using your specific data',
          recommendedFor: ['data-driven', 'optimization-focused', 'quantified-self'],
          recommendedModel: 'gemini-2.0-flash-exp'
        }
      ],
      modelOptimizations: {
        'gpt-4o-mini': {
          strengths: ['balanced responses', 'instruction following', 'motivational tone'],
          optimalFor: ['supportive', 'reality-check']
        },
        'qwen2.5-7b-instruct': {
          strengths: ['structured explanations', 'systematic approach', 'educational content'],
          optimalFor: ['educational']
        },
        'gemini-2.0-flash-exp': {
          strengths: ['analytical insights', 'data integration', 'contextual reasoning'],
          optimalFor: ['analytical']
        }
      },
      version: '3.0',
      features: [
        'Mode-specific prompt engineering',
        'Model optimization per coaching style',
        'Context-aware responses',
        'Safety guardrails for health advice',
        'Progressive coaching difficulty',
        'User feedback integration'
      ]
    });

  } catch (error) {
    console.error('[Advanced Coaching API] Info endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve coaching information' },
      { status: 500 }
    );
  }
}