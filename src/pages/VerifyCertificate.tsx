import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogoWithGlow } from "@/components/LogoWithGlow";
import { CheckCircle2, XCircle, Award, Calendar, User } from "lucide-react";

export default function VerifyCertificate() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!certificateId) return;
    fetchCertificate();
  }, [certificateId]);

  const fetchCertificate = async () => {
    const { data } = await supabase
      .from('certificates' as any)
      .select('*')
      .eq('certificate_id', certificateId)
      .maybeSingle();

    if (data) {
      setCert(data);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Verifying certificate...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <LogoWithGlow size="md" />
            <span className="text-lg font-bold hidden sm:inline">Certificate Verification</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-lg">
        {notFound ? (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Certificate Not Found</h1>
            <p className="text-muted-foreground text-sm">
              The certificate ID "{certificateId}" could not be verified. It may be invalid or does not exist.
            </p>
          </div>
        ) : (
          <div className="card-gradient rounded-2xl p-6 sm:p-8 border border-border text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Verified ✅</h1>
            <p className="text-sm text-muted-foreground mb-6">This certificate is authentic and valid.</p>

            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <User className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Student</p>
                  <p className="font-semibold text-sm">{cert.student_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <Award className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Course</p>
                  <p className="font-semibold text-sm">{cert.course_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <Calendar className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Date Completed</p>
                  <p className="font-semibold text-sm">
                    {new Date(cert.completed_at).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-6 font-mono">
              Certificate ID: {cert.certificate_id.toUpperCase()}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
