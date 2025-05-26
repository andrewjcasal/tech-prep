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

    // Enhanced system prompt for better interviewing
    const enhancedSystemPrompt = `You are an experienced technical interviewer conducting a professional interview. Your goal is to evaluate the candidate's technical skills, problem-solving approach, and communication abilities.

Guidelines for your responses:
1. Be professional, encouraging, and constructive
2. Ask follow-up questions to understand their thought process
3. Guide them if they're stuck, but don't give away answers
4. Focus on their approach, not just the final solution
5. Ask about edge cases, optimizations, and trade-offs
6. Keep responses concise but thorough (2-4 sentences typically)
7. Adapt your questioning based on their experience level
8. End with a clear next step or question

Remember: You're evaluating their problem-solving process, not just looking for the "right" answer.`

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
        model: 'gpt-4',
        messages: chatMessages,
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.1,
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