# Technical Interview Preparation App Setup

This app helps you prepare for technical interviews by analyzing job postings and providing personalized preparation advice using ChatGPT. The app returns a structured response with different interview types, detailed preparation advice, and specific practice problems for each type.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **OpenAI API Key**: Get one from [platform.openai.com](https://platform.openai.com)

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (for Supabase Edge Function)
OPENAI_API_KEY=your_openai_api_key
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Install the Supabase CLI: `npm install -g supabase`
3. Login to Supabase: `supabase login`
4. Link your project: `supabase link --project-ref your-project-ref`
5. Deploy the edge function: `supabase functions deploy interview-prep`
6. Set the OpenAI API key as a secret: `supabase secrets set OPENAI_API_KEY=your_openai_api_key`

### 3. Getting Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "Project URL" for `VITE_SUPABASE_URL`
4. Copy the "anon public" key for `VITE_SUPABASE_ANON_KEY`

### 4. Running the App

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Open your browser to the URL shown in the terminal

## How to Use

1. **Paste the job posting** in the first textarea - include the full job description with requirements, responsibilities, and technologies
2. **Add final round notes** (optional but recommended) - specify the number and types of interviews, e.g.:
   - "4 interviews: coding, system design, behavioral, and technical deep-dive"
   - "3 rounds: technical coding (2 hours), system design (1 hour), cultural fit"
   - "Final round consists of: algorithm coding, architecture discussion, and team collaboration scenario"
3. **Click "Get Preparation Advice"** to receive your personalized preparation plan
4. **Review the structured response** with specific interview types, detailed preparation strategies, and practice problems

## Response Format

The app returns a structured response with:

- **Interview Types**: Each interview round identified (e.g., Technical Coding, System Design, Behavioral)
- **Detailed Preparation**: Specific advice for each interview type aligned with the role and company
- **Practice Problems**: 3 suggested problems per interview type with:
  - Problem title and description
  - Difficulty level (Easy/Medium/Hard)
  - Relevance to the specific role and technologies

## Features

- **Intelligent Analysis**: Automatically identifies interview types based on job posting and notes
- **Structured Output**: Clean, organized presentation of preparation advice
- **Role-Specific Problems**: Practice problems tailored to the specific position and company
- **Difficulty Indicators**: Color-coded difficulty badges for easy prioritization
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, professional interface with loading states and error handling

## Example Input

**Job Posting:**
```
Senior Software Engineer - Full Stack
We're looking for an experienced full-stack developer to join our team...
Requirements: React, Node.js, PostgreSQL, AWS, system design experience...
```

**Final Round Notes:**
```
4 interviews: coding challenge (JavaScript/React), system design, behavioral, and technical deep-dive on past projects
```

## Example Output

The app will return structured cards for each interview type:
- **Technical Coding**: JavaScript/React specific problems and preparation tips
- **System Design**: Architecture problems relevant to the company's scale
- **Behavioral**: STAR method preparation with company-specific scenarios
- **Technical Deep-dive**: Questions about past projects and technical decisions

## Troubleshooting

- **"Missing Supabase environment variables"**: Make sure your `.env` file is properly configured
- **"OpenAI API key not configured"**: Ensure you've set the secret in Supabase using `supabase secrets set`
- **Edge function errors**: Check the Supabase function logs for detailed error messages
- **JSON parsing errors**: The app includes fallback handling for malformed responses
- **Deployment issues**: Remove any invalid keys from `supabase/config.toml` (like `edge_functions`)

## Development Notes

- The edge function uses GPT-4 for high-quality, structured responses
- Responses are limited to 3000 tokens to ensure comprehensive advice
- The app includes error handling for both network issues and malformed responses
- CSS is optimized for both desktop and mobile viewing 