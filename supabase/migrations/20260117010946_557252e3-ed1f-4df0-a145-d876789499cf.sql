-- Create lesson Q&A table for student questions and admin replies
CREATE TABLE public.lesson_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for admin replies to questions
CREATE TABLE public.lesson_question_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.lesson_questions(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL,
  reply TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subtitles table for video lessons
CREATE TABLE public.lesson_subtitles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, language)
);

-- Enable RLS
ALTER TABLE public.lesson_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_question_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_subtitles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_questions
CREATE POLICY "Users can view all questions" ON public.lesson_questions
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own questions" ON public.lesson_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own questions" ON public.lesson_questions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete questions" ON public.lesson_questions
  FOR DELETE USING (is_admin(auth.uid()));

-- RLS Policies for lesson_question_replies
CREATE POLICY "Anyone can view replies" ON public.lesson_question_replies
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert replies" ON public.lesson_question_replies
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update replies" ON public.lesson_question_replies
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete replies" ON public.lesson_question_replies
  FOR DELETE USING (is_admin(auth.uid()));

-- RLS Policies for lesson_subtitles
CREATE POLICY "Anyone can view subtitles" ON public.lesson_subtitles
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage subtitles" ON public.lesson_subtitles
  FOR ALL USING (is_admin(auth.uid()));

-- Add trigger for updated_at on lesson_questions
CREATE TRIGGER update_lesson_questions_updated_at
  BEFORE UPDATE ON public.lesson_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();