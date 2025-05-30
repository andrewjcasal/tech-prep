import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  interviewTypeId: string
}

serve(async (req) => {
  console.log('🚀 Generate-problems function called')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('📋 CORS preflight request handled')
    return new Response(JSON.stringify({ message: 'ok' }), { headers: corsHeaders })
  }

  try {
    console.log('📥 Parsing request body...')
    const { interviewTypeId }: RequestBody = await req.json()
    console.log(`📊 Request data: interviewTypeId=${interviewTypeId}`)

    if (!interviewTypeId) {
      console.error('❌ Invalid request: missing interviewTypeId')
      return new Response(
        JSON.stringify({ error: 'Interview type ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    console.log('🔧 Initializing Supabase client...')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get interview type details
    console.log(`🔍 Fetching interview type data for ID: ${interviewTypeId}`)
    const { data: interviewTypeData, error: interviewTypeError } = await supabase
      .from('interview_types')
      .select('*')
      .eq('id', interviewTypeId)
      .single()

    if (interviewTypeError) {
      console.error('❌ Error fetching interview type data:', interviewTypeError)
      throw interviewTypeError
    }

    console.log(`✅ Interview type data fetched: ${interviewTypeData.type}`)

    // Check OpenAI API key
    console.log('🔑 Checking OpenAI API key...')
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('❌ OpenAI API key not configured')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create the prompt for generating behavioral problems
    const systemPrompt = `You are an expert technical interview coach specializing in behavioral interviews for senior software engineers. Your job is to generate high-quality behavioral interview problems that assess leadership, technical decision-making, and senior-level experience.

You must respond with a valid JSON object in this exact format:
{
  "problems": [
    {
      "title": "Problem Title",
      "description": "Detailed description that includes 4 important behavioral questions and 1-2 follow-ups each as needed. The description should guide the interviewer through a structured conversation using the STAR method.",
      "difficulty": "Medium"
    }
  ]
}

CRITICAL: Every problem MUST include the "difficulty" field set to "Medium".

Guidelines for Senior Software Engineer Behavioral Problems:
- Focus on scenarios relevant to senior engineers: technical leadership, architecture decisions, mentoring, cross-team collaboration, handling complex technical challenges
- Each problem should include 4 core behavioral questions that build upon each other
- Include 1-2 thoughtful follow-up questions for each core question (not all questions need follow-ups, use judgment)
- Questions should encourage STAR method responses (Situation, Task, Action, Result)
- Avoid generic management questions - focus on technical leadership and senior IC responsibilities
- Include natural conversational elements like "That's impressive" or "Tell me more about..." but keep them professional
- Ensure questions assess depth of impact and technical decision-making at senior level
- Problems should be realistic scenarios that senior engineers commonly face

Example structure for each problem description:
"This interview focuses on [scenario]. The interviewer should guide the conversation through these key areas:

1. [First core question] 
   Follow-up: [Optional follow-up question]
   
2. [Second core question]
   Follow-up: [Optional follow-up question]
   
3. [Third core question]
   
4. [Fourth core question]
   Follow-up: [Optional follow-up question]

The interviewer should listen for STAR method responses and probe for specific examples of impact, technical depth, and leadership influence."

Respond with exactly 3 problems, each with difficulty "Medium". ENSURE every problem object includes the "difficulty": "Medium" field.`

    const userPrompt = `Generate 3 new behavioral interview problems for senior software engineers. These should be different from common problems like "Tell me about a time you demonstrated technical leadership" or "Describe building a diverse team."

Focus on scenarios that senior engineers actually encounter:
- Making critical technical decisions under pressure
- Handling technical debt and legacy system challenges  
- Leading technical initiatives across multiple teams
- Mentoring and developing other engineers
- Navigating technical disagreements and building consensus
- Handling production incidents and post-mortems
- Balancing technical excellence with business needs

Each problem should have 4 substantial behavioral questions with natural follow-ups that encourage detailed STAR method responses. The questions should assess the depth and impact expected from senior engineers.`

    console.log('🤖 Calling OpenAI API for problem generation...')
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      console.error(`❌ OpenAI API error: ${response.status} ${response.statusText}`)
      throw new Error('Failed to get response from OpenAI')
    }

    console.log('✅ OpenAI API response received')
    const data = await response.json()
    const generatedText = data.choices[0]?.message?.content

    if (!generatedText) {
      console.error('❌ No generated text received from OpenAI')
      throw new Error('No response received from AI')
    }

    console.log(`📄 Generated text length: ${generatedText.length} characters`)

    // Parse the JSON response
    let generatedProblems
    try {
      console.log('🔧 Parsing AI generated JSON...')
      
      // Strip markdown code blocks if present
      let cleanedText = generatedText.trim()
      if (cleanedText.startsWith('```json')) {
        console.log('🧹 Removing markdown code block formatting...')
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanedText.startsWith('```')) {
        console.log('🧹 Removing generic code block formatting...')
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      generatedProblems = JSON.parse(cleanedText)
      console.log(`✅ Successfully parsed generated problems with ${generatedProblems.problems?.length || 0} items`)
    } catch (e) {
      console.error('❌ Failed to parse AI generated JSON:', e)
      console.error('📄 Raw response that failed to parse:', generatedText)
      throw new Error('Failed to parse AI generated response')
    }

    // Insert the generated problems into the database
    console.log('💾 Inserting generated problems into database...')
    const problemsToInsert = generatedProblems.problems.map((problem: any) => ({
      interview_type_id: interviewTypeId,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty || 'Medium' // Default to Medium if not specified
    }))

    // Validate that all problems have required fields
    for (const problem of problemsToInsert) {
      if (!problem.title || !problem.description || !problem.difficulty) {
        console.error('❌ Invalid problem data:', problem)
        throw new Error('Generated problem is missing required fields')
      }
    }

    console.log('✅ Problem validation passed, inserting into database...')

    const { data: insertedProblems, error: insertError } = await supabase
      .from('problems')
      .insert(problemsToInsert)
      .select()

    if (insertError) {
      console.error('❌ Failed to insert problems:', insertError)
      throw new Error('Failed to save problems to database')
    }

    console.log(`✅ Successfully inserted ${insertedProblems.length} problems`)

    console.log('🎉 Problem generation complete!')
    return new Response(
      JSON.stringify({ 
        success: true,
        problems: insertedProblems,
        count: insertedProblems.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Error in generate-problems function:', error)
    console.error('📍 Error stack:', error.stack)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 