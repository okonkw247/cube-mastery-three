import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogoWithGlow } from "@/components/LogoWithGlow";
import { ArrowLeft, Download, Share2, Award, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { generateCertificatePDF } from "@/lib/certificateGenerator";

interface Certificate {
  id: string;
  certificate_id: string;
  course_name: string;
  student_name: string;
  completed_at: string;
}

export default function Certificates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchCertificates();
  }, [user]);

  const fetchCertificates = async () => {
    const { data } = await supabase
      .from('certificates' as any)
      .select('*')
      .eq('user_id', user!.id)
      .order('completed_at', { ascending: false });
    if (data) setCertificates(data as any[]);
    setLoading(false);
  };

  const handleDownload = async (cert: Certificate) => {
    try {
      const pdf = generateCertificatePDF(cert.student_name, cert.course_name, cert.completed_at, cert.certificate_id);
      pdf.save(`certificate-${cert.certificate_id}.pdf`);
      toast.success("Certificate downloaded!");
    } catch {
      toast.error("Failed to generate certificate");
    }
  };

  const handleShare = (cert: Certificate) => {
    const url = `${window.location.origin}/verify/${cert.certificate_id}`;
    const text = `Just completed ${cert.course_name} on Cube Mastery! 🧩🏆 #RubiksCube #SpeedCubing`;

    if (navigator.share) {
      navigator.share({ title: "My Certificate", text, url });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Share text copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Link to="/" className="flex items-center gap-2">
            <LogoWithGlow size="md" />
            <span className="text-lg font-bold hidden sm:inline">My Certificates</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Award className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">Certificates</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Your Achievements</h1>
          <p className="text-sm text-muted-foreground mt-1">Download and share your earned certificates</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading certificates...</div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No certificates yet. Complete a full course to earn one!</p>
            <Link to="/dashboard">
              <Button variant="outline" className="mt-4">Go to Dashboard</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {certificates.map((cert) => (
              <div key={cert.id} className="card-gradient rounded-xl p-4 sm:p-6 border border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg">{cert.course_name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Completed {new Date(cert.completed_at).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      ID: {cert.certificate_id.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleDownload(cert)}>
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleShare(cert)}>
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                  <Link
                    to={`/verify/${cert.certificate_id}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View verification page
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
