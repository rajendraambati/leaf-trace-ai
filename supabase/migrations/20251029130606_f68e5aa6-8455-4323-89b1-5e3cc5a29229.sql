-- Create table for storing assistant conversations
CREATE TABLE IF NOT EXISTS public.assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL,
  page_context TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own conversations
CREATE POLICY "Users can view their own conversations"
ON public.assistant_conversations
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for users to insert their own conversations
CREATE POLICY "Users can insert their own conversations"
ON public.assistant_conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user_id 
ON public.assistant_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_assistant_conversations_created_at 
ON public.assistant_conversations(created_at DESC);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_assistant_conversation_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_assistant_conversations_updated_at
BEFORE UPDATE ON public.assistant_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_assistant_conversation_updated_at();