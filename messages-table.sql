-- Create messages table for AI interviewer conversations
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_messages_problem_id ON messages(problem_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Allow public read access on messages" ON messages
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on messages" ON messages
    FOR INSERT WITH CHECK (true); 