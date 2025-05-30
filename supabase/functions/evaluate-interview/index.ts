import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  problemId: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

serve(async (req) => {
  console.log('🚀 Evaluate-interview function called')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('📋 CORS preflight request handled')
    return new Response(JSON.stringify({ message: 'ok' }), { headers: corsHeaders })
  }

  try {
    console.log('📥 Parsing request body...')
    const { problemId, messages }: RequestBody = await req.json()
    console.log(`📊 Request data: problemId=${problemId}, messages count=${messages?.length || 0}`)

    if (!problemId || !messages || !Array.isArray(messages)) {
      console.error('❌ Invalid request: missing problemId or messages')
      return new Response(
        JSON.stringify({ error: 'Problem ID and messages are required' }),
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

    // Get problem details and related competencies
    console.log(`🔍 Fetching problem data for ID: ${problemId}`)
    const { data: problemData, error: problemError } = await supabase
      .from('problems')
      .select(`
        *,
        interview_types (
          id,
          type,
          competencies (
            id,
            name,
            description
          )
        )
      `)
      .eq('id', problemId)
      .single()

    if (problemError) {
      console.error('❌ Error fetching problem data:', problemError)
      throw problemError
    }

    console.log(`✅ Problem data fetched: ${problemData.title} (${problemData.interview_types.type})`)
    
    const competencies = problemData.interview_types.competencies
    console.log(`📋 Found ${competencies?.length || 0} existing competencies`)
    
    if (!competencies || competencies.length === 0) {
      console.warn('⚠️ No competencies found for this interview type')
      return new Response(
        JSON.stringify({ error: 'No competencies found for this interview type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch existing tech topics to avoid duplicates
    console.log('🏷️ Fetching existing tech topics...')
    const { data: techTopics, error: techTopicsError } = await supabase
      .from('tech_topics')
      .select('id, name, description, category')
      .order('name')

    if (techTopicsError) {
      console.error('❌ Error fetching tech topics:', techTopicsError)
      // Continue without tech topics if fetch fails
    }

    console.log(`🏷️ Found ${techTopics?.length || 0} existing tech topics`)

    // Prepare conversation for AI evaluation
    console.log('📝 Preparing conversation text for AI evaluation...')
    const conversationText = messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n')
    
    console.log(`💬 Conversation length: ${conversationText.length} characters`)

    const techTopicsList = techTopics ? 
      techTopics.map(t => `${t.name} (${t.category})`).join(', ') : 
      'No existing tech topics found'

    const evaluationPrompt = `You are evaluating a technical interview conversation for a ${problemData.interview_types.type} problem.

PROBLEM: ${problemData.title}
DESCRIPTION: ${problemData.description}

EXISTING COMPETENCIES TO EVALUATE:
${competencies.map(c => `- ${c.name}: ${c.description}`).join('\n')}

EXISTING TECH TOPICS (prefer using these if they relate to improvement areas):
${techTopicsList}

CONVERSATION:
${conversationText}

Based on this conversation, evaluate the candidate's performance. You should:

1. Evaluate performance in each EXISTING competency listed above
2. If the conversation reveals skills in areas NOT covered by existing competencies, you may identify NEW competencies that are relevant to this interview type
3. For each competency (existing or new), provide:
   - A progress score from 0-100 (current progress for existing: ${competencies.map(c => `${c.name}: ${c.progress_level || 0}%`).join(', ')})
   - What they did well (strengths)
   - 1-2 specific things they could improve on next
   - 3 specific tech topics related to the improvement areas

Guidelines for NEW competencies:
- Only suggest new competencies if they demonstrate skills clearly different from existing ones
- New competency names should be specific and relevant to ${problemData.interview_types.type} interviews
- Examples might include: "Error Handling", "Code Optimization", "Testing Strategy", "Communication Skills", etc.

${problemData.interview_types.type.toLowerCase().includes('behavioral') ? `
SPECIAL BEHAVIORAL INTERVIEW EVALUATION CRITERIA:
For behavioral interviews, focus on evaluating the depth and impact of answers as they relate to senior software engineers:

- DEPTH: Look for specific technical details, concrete examples, and measurable outcomes
- IMPACT: Assess the scope of influence (team, organization, technical systems, business metrics)
- SENIOR-LEVEL THINKING: Evaluate strategic thinking, technical leadership, and complex problem-solving
- STAR METHOD: Check if responses follow Situation, Task, Action, Result structure
- TECHNICAL LEADERSHIP: Look for examples of mentoring, architecture decisions, cross-team collaboration
- BUSINESS IMPACT: Assess understanding of how technical decisions affect business outcomes

Score behavioral competencies based on:
- 90-100: Demonstrates exceptional senior-level impact with specific, measurable outcomes and strategic thinking
- 80-89: Shows strong senior-level examples with good depth and clear impact
- 70-79: Provides adequate examples but may lack depth, specificity, or senior-level perspective
- 60-69: Basic examples provided but limited impact or junior-level thinking
- Below 60: Vague responses, no concrete examples, or inappropriate level for senior role

For behavioral improvement notes, focus on:
- Adding more specific metrics and measurable outcomes
- Demonstrating broader organizational impact
- Including more technical depth in leadership examples
- Better articulation of strategic thinking and decision-making process
` : ''}

CRITICAL: For improvement_notes, provide SPECIFIC, ACTIONABLE examples:

${problemData.interview_types.type.toLowerCase().includes('behavioral') ? `
For behavioral interviews, instead of: "Could improve storytelling"
Write: "Could improve by adding specific metrics and outcomes. For example: 'The refactoring reduced deployment time from 2 hours to 15 minutes, improved team velocity by 30%, and reduced production incidents by 60% over 6 months.' Also include more details about stakeholder management and how you built consensus across teams."

Instead of: "Need better leadership examples"
Write: "Could strengthen leadership examples by describing the technical decision-making process. For example: 'I evaluated three architecture options (microservices, modular monolith, serverless), created a decision matrix weighing factors like team expertise, scalability needs, and maintenance overhead, then facilitated workshops with 4 teams to build consensus on the microservices approach, resulting in 40% faster feature delivery.'"
` : `
Instead of: "They could improve by discussing trade-offs between consistency, availability, and partition tolerance"
Write: "They could improve by discussing trade-offs between consistency, availability, and partition tolerance. For example: choosing eventual consistency for user posts to maintain availability during network partitions, or using strong consistency for financial transactions even if it means temporary unavailability during failures."

Instead of: "They could enhance their response by discussing service communication patterns"
Write: "They could enhance their response by discussing service communication patterns such as: synchronous REST APIs for real-time user interactions, asynchronous message queues (like RabbitMQ/Kafka) for order processing, or event-driven architecture with webhooks for notification services."

Instead of: "Could improve error handling strategies"
Write: "Could improve error handling strategies by implementing: circuit breakers to prevent cascade failures (e.g., using Hystrix), retry mechanisms with exponential backoff for transient failures, and graceful degradation (e.g., showing cached data when the recommendation service is down)."
`}

Always include 2-3 concrete examples, specific technologies, or real-world scenarios that illustrate the improvement area.

For tech_topics, provide 3 objects with title and description. These should be:
- PREFER using existing tech topics from the list above if they relate to the improvement areas
- If no existing topics relate, create new specific technical concepts, patterns, or technologies
- Each topic should have a 2-3 paragraph description with practical examples and bullet points
- Relevant to the improvement areas mentioned
- Suitable for further study and practice

Respond in this exact JSON format (NO markdown code blocks, just raw JSON):
{
  "evaluations": [
    {
      "competency_id": "existing-uuid-or-null-for-new",
      "competency_name": "exact name for existing or new name",
      "progress_after": 75,
      "strengths_notes": "What they did well...",
      "improvement_notes": "1-2 specific next steps for improvement with concrete examples...",
      "tech_topics": [
        {
          "title": "Topic Name",
          "description": "2-3 paragraph description with practical examples and bullet points explaining the concept, its applications, and how to learn it."
        }
      ]
    }
  ]
}

IMPORTANT: Return ONLY the JSON object above, no markdown formatting, no code blocks, no additional text.

Be encouraging but honest in your evaluation. Focus on growth and specific actionable feedback with concrete examples.`

    console.log('🔑 Checking OpenAI API key...')
    // Call OpenAI for evaluation
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

    console.log('🤖 Calling OpenAI API for evaluation...')
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: evaluationPrompt }],
        max_tokens: 6000,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      console.error(`❌ OpenAI API error: ${response.status} ${response.statusText}`)
      throw new Error('Failed to get evaluation from AI')
    }

    console.log('✅ OpenAI API response received')
    const data = await response.json()
    const evaluationText = data.choices[0]?.message?.content

    if (!evaluationText) {
      console.error('❌ No evaluation text received from OpenAI')
      throw new Error('No evaluation received from AI')
    }

    console.log(`📄 Evaluation text length: ${evaluationText.length} characters`)
    console.log('🔍 Raw evaluation response:', evaluationText.substring(0, 200) + '...')

    // Parse the JSON response
    let evaluation
    try {
      console.log('🔧 Parsing AI evaluation JSON...')
      
      // Strip markdown code blocks if present
      let cleanedText = evaluationText.trim()
      if (cleanedText.startsWith('```json')) {
        console.log('🧹 Removing markdown code block formatting...')
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        console.log('✅ Cleaned text for parsing')
      } else if (cleanedText.startsWith('```')) {
        console.log('🧹 Removing generic code block formatting...')
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
        console.log('✅ Cleaned text for parsing')
      }
      
      evaluation = JSON.parse(cleanedText)
      console.log(`✅ Successfully parsed evaluation with ${evaluation.evaluations?.length || 0} items`)
    } catch (e) {
      console.error('❌ Failed to parse AI evaluation JSON:', e)
      console.error('📄 Raw response that failed to parse:', evaluationText)
      throw new Error('Failed to parse AI evaluation response')
    }

    // Update competencies and create history records
    console.log('📊 Processing competency evaluations...')
    const historyRecords: Array<{
      competency_name: string
      progress_before: number
      progress_after: number
      improvement_notes: string
      strengths_notes: string
      tech_topics: string[]
    }> = []
    
    for (const evalItem of evaluation.evaluations) {
      console.log(`🔍 Processing evaluation for: ${evalItem.competency_name}`)
      let competency = competencies.find(c => c.id === evalItem.competency_id || c.name === evalItem.competency_name)
      
      // If competency doesn't exist, create it
      if (!competency) {
        console.log(`❓ Competency "${evalItem.competency_name}" not found, checking if we should create it...`)
        // Check if this competency name is unique from existing ones
        const existingNames = competencies.map(c => c.name.toLowerCase())
        const newCompetencyName = evalItem.competency_name.toLowerCase()
        
        if (!existingNames.includes(newCompetencyName)) {
          console.log(`➕ Creating new competency: ${evalItem.competency_name}`)
          // Create new competency
          const { data: newCompetency, error: createError } = await supabase
            .from('competencies')
            .insert({
              name: evalItem.competency_name,
              description: `Auto-generated competency identified during interview evaluation`,
              interview_type_id: problemData.interview_types.id,
              progress_level: 0
            })
            .select()
            .single()

          if (createError) {
            console.error('❌ Failed to create new competency:', createError)
            continue // Skip this evaluation if we can't create the competency
          }

          competency = newCompetency
          console.log(`✅ Created new competency: ${evalItem.competency_name} (ID: ${competency.id})`)
        } else {
          console.log(`⚠️ Skipping duplicate competency: ${evalItem.competency_name}`)
          continue // Skip if it's too similar to existing competencies
        }
      } else {
        console.log(`✅ Found existing competency: ${competency.name} (ID: ${competency.id})`)
      }

      const progressBefore = competency.progress || 0
      const progressAfter = Math.max(progressBefore, evalItem.progress_after) // Only allow progress to increase
      console.log(`📈 Progress update: ${competency.name} ${progressBefore}% → ${progressAfter}%`)

      // Create history record
      console.log(`💾 Creating history record for ${competency.name}...`)
      const { data: historyRecord, error: historyError } = await supabase
        .from('competency_history')
        .insert({
          problem_id: problemId,
          competency_id: competency.id,
          progress_before: progressBefore,
          progress_after: progressAfter,
          improvement_notes: evalItem.improvement_notes,
          strengths_notes: evalItem.strengths_notes
        })
        .select()
        .single()

      if (historyError) {
        console.error(`❌ Failed to create history record for ${competency.name}:`, historyError)
        continue
      }

      console.log(`✅ History record created for ${competency.name}`)

      // Process tech topics
      const techTopicsToLink = []
      if (evalItem.tech_topics && Array.isArray(evalItem.tech_topics)) {
        console.log(`🏷️ Processing ${evalItem.tech_topics.length} tech topics for ${competency.name}...`)
        
        for (const topicObj of evalItem.tech_topics) {
          if (!topicObj || typeof topicObj !== 'object' || !topicObj.title) continue
          
          const topicTitle = topicObj.title
          const topicDescription = topicObj.description || 'Tech topic identified during interview evaluation'
          
          // Check if tech topic already exists (case-insensitive match)
          let existingTopic = techTopics?.find(t => t.name.toLowerCase() === topicTitle.toLowerCase())
          
          if (!existingTopic) {
            // Create new tech topic
            console.log(`➕ Creating new tech topic: ${topicTitle}`)
            const { data: newTopic, error: topicError } = await supabase
              .from('tech_topics')
              .insert({
                name: topicTitle,
                description: topicDescription,
                category: problemData.interview_types.type
              })
              .select()
              .single()

            if (topicError) {
              console.error(`❌ Failed to create tech topic "${topicTitle}":`, topicError)
              continue
            }

            existingTopic = newTopic
            console.log(`✅ Created new tech topic: ${topicTitle} (ID: ${existingTopic.id})`)
          } else {
            console.log(`✅ Found existing tech topic: ${topicTitle}`)
            
            // Update description if the new one is more detailed
            if (topicDescription.length > (existingTopic.description?.length || 0)) {
              console.log(`📝 Updating description for existing tech topic: ${topicTitle}`)
              const { error: updateError } = await supabase
                .from('tech_topics')
                .update({ description: topicDescription })
                .eq('id', existingTopic.id)
              
              if (updateError) {
                console.error(`❌ Failed to update tech topic description:`, updateError)
              } else {
                console.log(`✅ Updated description for tech topic: ${topicTitle}`)
              }
            }
          }

          techTopicsToLink.push(existingTopic.id)
        }

        // Link tech topics to competency history
        if (techTopicsToLink.length > 0) {
          console.log(`🔗 Linking ${techTopicsToLink.length} tech topics to history record...`)
          const linkInserts = techTopicsToLink.map(topicId => ({
            competency_history_id: historyRecord.id,
            tech_topic_id: topicId
          }))

          const { error: linkError } = await supabase
            .from('competency_history_tech_topics')
            .insert(linkInserts)

          if (linkError) {
            console.error(`❌ Failed to link tech topics:`, linkError)
          } else {
            console.log(`✅ Successfully linked ${techTopicsToLink.length} tech topics`)
          }
        }
      }

      historyRecords.push({
        competency_name: competency.name,
        progress_before: progressBefore,
        progress_after: progressAfter,
        improvement_notes: evalItem.improvement_notes,
        strengths_notes: evalItem.strengths_notes,
        tech_topics: evalItem.tech_topics || []
      })
    }

    console.log(`🎉 Processing complete! Created ${historyRecords.length} history records`)

    console.log('🚀 Sending successful response with evaluation results')
    return new Response(
      JSON.stringify({ 
        success: true,
        evaluations: historyRecords
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Error in evaluate-interview function:', error)
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