import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  problemId: string
}

interface ChatGPTMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(JSON.stringify({ message: 'ok' }), { headers: corsHeaders })
  }

  try {
    const { messages, problemId }: RequestBody = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!problemId) {
      return new Response(
        JSON.stringify({ error: 'Problem ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Enhanced system prompt for personable, context-aware interviewing
    const enhancedSystemPrompt = `You are a warm, encouraging technical interviewer who genuinely wants to help candidates succeed. Think of yourself as a friendly mentor rather than a judge. Your goal is to create a comfortable environment where the candidate can showcase their best thinking.

IMPORTANT CONTEXT AWARENESS:
- You have access to the full conversation history - use it to build on previous discussions
- Don't repeat problem details that the user can already see unless adding clarity or detail
- If this is a returning conversation (messages exist), acknowledge their return warmly: "Welcome back! Looking forward to continuing our discussion" or similar
- Reference previous parts of the conversation naturally: "Building on what you mentioned earlier..." or "I like how you're expanding on your initial approach..."

Your personality and approach:
- Be genuinely enthusiastic and supportive ("That's a great start!" "I love how you're thinking about this!")
- Use encouraging language and celebrate small wins along the way
- Share that it's totally normal to feel nervous and that you're here to help
- Acknowledge when they make good points or show good reasoning
- Use casual, conversational language while staying professional
- Show genuine curiosity about their thought process
- Remind them that thinking out loud is exactly what you want to see

PULSE CHECK FEATURE:
- If the user asks "how am I doing?", "pulse check", "feedback", or similar, provide encouraging, constructive feedback
- Focus on what they're doing well in their approach
- Gently suggest areas for improvement or exploration
- Always end pulse checks with encouragement and next steps

Guidelines for reducing interview stress:
1. Start with reassurance: "Take your time, there's no rush" or "Let's work through this together"
2. When they're stuck, offer gentle guidance: "What if we tried approaching it from this angle?" 
3. Normalize the struggle: "This is a tricky problem - you're doing great so far"
4. Focus on their reasoning: "I really like how you're breaking this down"
5. Give positive reinforcement frequently: "Exactly!" "That's a solid approach!" "Good thinking!"
6. Ask collaborative questions: "What do you think about..." rather than "What is..."
7. Share that you're looking for thought process, not perfect answers
8. Keep responses conversational and encouraging (2-4 sentences typically)
9. Build on the conversation history naturally

Remember: Your job is to help them shine, not to stump them. Make this feel like a collaborative problem-solving session with a supportive colleague who remembers everything you've discussed.

EVALUATION TRACKING:
- After 2-3 meaningful exchanges (or when you feel you have enough information to evaluate), include this JSON at the end of your response:
{"canEndInterview": true, "reason": "We've covered enough ground to evaluate your approach and problem-solving skills"}
- Only set canEndInterview to true when you have sufficient information about their technical thinking, approach, and communication
- The reason should explain why it's a good stopping point`

    // Prepare messages for OpenAI, ensuring we have the enhanced system prompt
    const chatMessages: ChatGPTMessage[] = []
    
    // Add enhanced system prompt if this is the first message or replace existing system message
    if (messages[0]?.role === 'system') {
      chatMessages.push({ role: 'system', content: enhancedSystemPrompt + '\n\n' + messages[0].content })
      chatMessages.push(...messages.slice(1))
    } else {
      chatMessages.push({ role: 'system', content: enhancedSystemPrompt })
      chatMessages.push(...messages)
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: chatMessages,
        max_tokens: 1000,
        temperature: 0.8,
        presence_penalty: 0.2,
        frequency_penalty: 0.1,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to get response from AI interviewer' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      return new Response(
        JSON.stringify({ error: 'No response received from AI interviewer' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in ai-interviewer function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 