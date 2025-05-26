-- Enable RLS on all tables
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Add user_id columns to tables
ALTER TABLE job_postings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing records to have a user_id (for development purposes)
-- In production, you might want to handle this differently
UPDATE job_postings SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE messages SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Make user_id NOT NULL after updating existing records
ALTER TABLE job_postings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN user_id SET NOT NULL;

-- Create RLS policies for job_postings
CREATE POLICY "Users can view their own job postings" ON job_postings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job postings" ON job_postings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job postings" ON job_postings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job postings" ON job_postings
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for interview_types (linked through job_postings)
CREATE POLICY "Users can view their own interview types" ON interview_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_postings 
      WHERE job_postings.id = interview_types.job_posting_id 
      AND job_postings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own interview types" ON interview_types
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_postings 
      WHERE job_postings.id = interview_types.job_posting_id 
      AND job_postings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own interview types" ON interview_types
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM job_postings 
      WHERE job_postings.id = interview_types.job_posting_id 
      AND job_postings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own interview types" ON interview_types
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM job_postings 
      WHERE job_postings.id = interview_types.job_posting_id 
      AND job_postings.user_id = auth.uid()
    )
  );

-- Create RLS policies for problems (linked through interview_types -> job_postings)
CREATE POLICY "Users can view their own problems" ON problems
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM interview_types 
      JOIN job_postings ON job_postings.id = interview_types.job_posting_id
      WHERE interview_types.id = problems.interview_type_id 
      AND job_postings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own problems" ON problems
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_types 
      JOIN job_postings ON job_postings.id = interview_types.job_posting_id
      WHERE interview_types.id = problems.interview_type_id 
      AND job_postings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own problems" ON problems
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM interview_types 
      JOIN job_postings ON job_postings.id = interview_types.job_posting_id
      WHERE interview_types.id = problems.interview_type_id 
      AND job_postings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own problems" ON problems
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM interview_types 
      JOIN job_postings ON job_postings.id = interview_types.job_posting_id
      WHERE interview_types.id = problems.interview_type_id 
      AND job_postings.user_id = auth.uid()
    )
  );

-- Create RLS policies for competencies (linked through interview_types -> job_postings)
CREATE POLICY "Users can view their own competencies" ON competencies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM interview_types 
      JOIN job_postings ON job_postings.id = interview_types.job_posting_id
      WHERE interview_types.id = competencies.interview_type_id 
      AND job_postings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own competencies" ON competencies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_types 
      JOIN job_postings ON job_postings.id = interview_types.job_posting_id
      WHERE interview_types.id = competencies.interview_type_id 
      AND job_postings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own competencies" ON competencies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM interview_types 
      JOIN job_postings ON job_postings.id = interview_types.job_posting_id
      WHERE interview_types.id = competencies.interview_type_id 
      AND job_postings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own competencies" ON competencies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM interview_types 
      JOIN job_postings ON job_postings.id = interview_types.job_posting_id
      WHERE interview_types.id = competencies.interview_type_id 
      AND job_postings.user_id = auth.uid()
    )
  );

-- Create RLS policies for competency_history (linked through competencies -> interview_types -> job_postings)
CREATE POLICY "Users can view their own competency history" ON competency_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM competencies
      JOIN interview_types ON interview_types.id = competencies.interview_type_id
      JOIN job_postings ON job_postings.id = interview_types.job_posting_id
      WHERE competencies.id = competency_history.competency_id 
      AND job_postings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own competency history" ON competency_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM competencies
      JOIN interview_types ON interview_types.id = competencies.interview_type_id
      JOIN job_postings ON job_postings.id = interview_types.job_posting_id
      WHERE competencies.id = competency_history.competency_id 
      AND job_postings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own competency history" ON competency_history
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM competencies
      JOIN interview_types ON interview_types.id = competencies.interview_type_id
      JOIN job_postings ON job_postings.id = interview_types.job_posting_id
      WHERE competencies.id = competency_history.competency_id 
      AND job_postings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own competency history" ON competency_history
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM competencies
      JOIN interview_types ON interview_types.id = competencies.interview_type_id
      JOIN job_postings ON job_postings.id = interview_types.job_posting_id
      WHERE competencies.id = competency_history.competency_id 
      AND job_postings.user_id = auth.uid()
    )
  );

-- Create RLS policies for messages
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (auth.uid() = user_id); 