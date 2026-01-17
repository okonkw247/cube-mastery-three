import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Loader2, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Question {
  id: string;
  lesson_id: string;
  user_id: string;
  question: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
  replies: Reply[];
}

interface Reply {
  id: string;
  question_id: string;
  admin_id: string;
  reply: string;
  created_at: string;
  admin_name?: string;
}

interface LessonQAProps {
  lessonId: string;
  isAdmin?: boolean;
}

export function LessonQA({ lessonId, isAdmin = false }: LessonQAProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, [lessonId]);

  const fetchQuestions = async () => {
    try {
      const { data: questionsData, error: questionsError } = await supabase
        .from("lesson_questions")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: false });

      if (questionsError) throw questionsError;

      // Fetch replies for all questions
      const questionIds = questionsData?.map(q => q.id) || [];
      const { data: repliesData } = await supabase
        .from("lesson_question_replies")
        .select("*")
        .in("question_id", questionIds)
        .order("created_at", { ascending: true });

      // Fetch user profiles for questions
      const userIds = [...new Set(questionsData?.map(q => q.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const questionsWithReplies = questionsData?.map(q => ({
        ...q,
        user_name: profileMap.get(q.user_id)?.full_name || "Anonymous",
        user_avatar: profileMap.get(q.user_id)?.avatar_url,
        replies: repliesData?.filter(r => r.question_id === q.id) || [],
      })) || [];

      setQuestions(questionsWithReplies);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!user || !newQuestion.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("lesson_questions")
        .insert({
          lesson_id: lessonId,
          user_id: user.id,
          question: newQuestion.trim(),
        });

      if (error) throw error;

      toast.success("Question submitted!");
      setNewQuestion("");
      fetchQuestions();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit question");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (questionId: string) => {
    if (!user || !replyText[questionId]?.trim()) return;

    setReplyingTo(questionId);
    try {
      const { error } = await supabase
        .from("lesson_question_replies")
        .insert({
          question_id: questionId,
          admin_id: user.id,
          reply: replyText[questionId].trim(),
        });

      if (error) throw error;

      toast.success("Reply posted!");
      setReplyText(prev => ({ ...prev, [questionId]: "" }));
      fetchQuestions();
    } catch (error: any) {
      toast.error(error.message || "Failed to post reply");
    } finally {
      setReplyingTo(null);
    }
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Lesson Q&A</h3>
        <span className="text-sm text-muted-foreground">({questions.length} questions)</span>
      </div>

      {/* Submit Question Form */}
      {user && (
        <div className="space-y-3 p-4 bg-secondary/50 rounded-lg">
          <Textarea
            placeholder="Ask a question about this lesson..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitQuestion}
              disabled={submitting || !newQuestion.trim()}
              size="sm"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Submit Question
            </Button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No questions yet. Be the first to ask!
          </p>
        ) : (
          questions.map((question) => (
            <div
              key={question.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              <div
                className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => toggleQuestion(question.id)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={question.user_avatar} />
                    <AvatarFallback>
                      {question.user_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{question.user_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm">{question.question}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {question.replies.length > 0 && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {question.replies.length} {question.replies.length === 1 ? "reply" : "replies"}
                      </span>
                    )}
                    {expandedQuestions.has(question.id) ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {expandedQuestions.has(question.id) && (
                <div className="border-t border-border bg-secondary/20 p-4 space-y-4">
                  {/* Replies */}
                  {question.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-3 pl-4 border-l-2 border-primary/30">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          <Shield className="w-3 h-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-primary">Admin</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm">{reply.reply}</p>
                      </div>
                    </div>
                  ))}

                  {/* Admin Reply Form */}
                  {isAdmin && (
                    <div className="flex gap-2 pt-2">
                      <Textarea
                        placeholder="Reply to this question..."
                        value={replyText[question.id] || ""}
                        onChange={(e) => setReplyText(prev => ({ ...prev, [question.id]: e.target.value }))}
                        className="min-h-[60px] resize-none flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSubmitReply(question.id)}
                        disabled={replyingTo === question.id || !replyText[question.id]?.trim()}
                      >
                        {replyingTo === question.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
