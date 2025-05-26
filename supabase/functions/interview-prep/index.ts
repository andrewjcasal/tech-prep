import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  jobPosting: string
  notes?: string
}

interface ChatGPTMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface SuggestedProblem {
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

interface InterviewType {
  type: string
  details: string
  suggestedProblems: SuggestedProblem[]
}

interface StructuredResponse {
  interviews: InterviewType[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(JSON.stringify({ message: 'ok' }), { headers: corsHeaders })
  }

  try {
    const { jobPosting, notes }: RequestBody = await req.json()

    if (!jobPosting?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Job posting is required' }),
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Construct the prompt for ChatGPT
    const systemPrompt = `You are an expert technical interview coach. Your job is to analyze job postings and provide structured preparation advice for technical interviews.

You must respond with a valid JSON object in this exact format:
{
  "interviews": [
    {
      "type": "Interview Type Name",
      "details": "Detailed description of what this interview entails, what skills are tested, format, duration, and specific advice for this type of interview aligned with the role and company",
      "suggestedProblems": [
        {
          "title": "Problem Title",
          "description": "Clear description of the problem or topic to practice",
          "difficulty": "Easy|Medium|Hard"
        }
      ]
    }
  ]
}

Guidelines:
- Analyze the job posting to determine likely interview types (e.g., "Technical Coding", "System Design", "Behavioral", "Domain Knowledge", etc.)
- If notes mention a specific number of interviews, create that many interview objects
- Each interview should have exactly 3 suggested problems
- Make problems HIGHLY SPECIFIC to the role, company, domain, and technologies mentioned in the job posting
- For each suggested problem, ensure it directly relates to the actual work described in the job posting
- If the role involves specific domains (e.g., incident reporting, healthcare, finance, e-commerce), create problems that simulate real scenarios from that domain
- Include practical, actionable advice in the details that addresses the specific challenges mentioned in the job posting
- Avoid generic coding problems - instead create problems that mirror the actual technical challenges the candidate would face in this specific role
- Consider the business context, user types, data models, and workflows described in the job posting
- Ensure the JSON is valid and properly formatted`

    let userPrompt = `Please analyze this job posting and provide structured technical interview preparation advice:\n\n${jobPosting}`
    
    if (notes?.trim()) {
      userPrompt += `\n\nAdditional context about the final round:\n${notes}`
    }

    userPrompt += `\n\nIMPORTANT: Create problems that are directly applicable to this specific role and domain. If this is for incident reporting, create problems about incident management systems. If it's for healthcare, create healthcare-related problems. If it's for e-commerce, create e-commerce problems. Avoid generic "design a REST API" or "implement rate limiting" problems unless they specifically relate to the domain described in the job posting.

Respond with a valid JSON object containing an array of interview types with details and 3 domain-specific suggested problems each.`

    const messages: ChatGPTMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 3000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to get response from ChatGPT' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    const chatGptResponse = data.choices[0]?.message?.content

    if (!chatGptResponse) {
      return new Response(
        JSON.stringify({ error: 'No response received from ChatGPT' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Try to parse the JSON response
    try {
      const structuredResponse: StructuredResponse = JSON.parse(chatGptResponse)
      
      // Validate the response structure
      if (!structuredResponse.interviews || !Array.isArray(structuredResponse.interviews)) {
        throw new Error('Invalid response structure')
      }

      // Insert job posting first
      const { data: jobPostingData, error: jobPostingError } = await supabase
        .from('job_postings')
        .insert({
          content: jobPosting,
          notes: notes || null
        })
        .select()
        .single()

      if (jobPostingError) {
        console.error('Error inserting job posting:', jobPostingError)
        throw new Error('Failed to save job posting to database')
      }

      // Insert data into database
      const insertedInterviewTypes = []
      
      for (const interview of structuredResponse.interviews) {
        // Insert interview type with job_posting_id
        const { data: interviewTypeData, error: interviewTypeError } = await supabase
          .from('interview_types')
          .insert({
            type: interview.type,
            details: interview.details,
            job_posting_id: jobPostingData.id
          })
          .select()
          .single()

        if (interviewTypeError) {
          console.error('Error inserting interview type:', interviewTypeError)
          throw new Error('Failed to save interview type to database')
        }

        insertedInterviewTypes.push(interviewTypeData)

        // Insert problems for this interview type
        const problemsToInsert = interview.suggestedProblems.map(problem => ({
          interview_type_id: interviewTypeData.id,
          title: problem.title,
          description: problem.description,
          difficulty: problem.difficulty
        }))

        const { error: problemsError } = await supabase
          .from('problems')
          .insert(problemsToInsert)

        if (problemsError) {
          console.error('Error inserting problems:', problemsError)
          throw new Error('Failed to save problems to database')
        }
      }

      return new Response(
        JSON.stringify({ 
          response: structuredResponse,
          saved: true,
          jobPostingId: jobPostingData.id,
          interviewTypesCount: insertedInterviewTypes.length,
          totalProblems: structuredResponse.interviews.reduce((total, interview) => total + interview.suggestedProblems.length, 0)
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } catch (parseError) {
      console.error('Failed to parse ChatGPT JSON response:', parseError)
      console.error('Raw response:', chatGptResponse)
      
      // Fallback: return the raw response if JSON parsing fails
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse structured response',
          rawResponse: chatGptResponse 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Error in interview-prep function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 