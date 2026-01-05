import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminInviteAccept() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "expired" | "used" | "accepting" | "success">("loading");
  const [invite, setInvite] = useState<any>(null);

  useEffect(() => {
    checkInvite();
  }, [token]);

  const checkInvite = async () => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const { data, error } = await supabase
      .from("admin_invites")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !data) {
      setStatus("invalid");
      return;
    }

    if (data.used_at) {
      setStatus("used");
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
      setStatus("expired");
      return;
    }

    setInvite(data);
    setStatus("valid");
  };

  const handleAcceptInvite = async () => {
    if (!user || !invite) return;

    // Check if invite has email restriction
    if (invite.email) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.email !== invite.email) {
        toast.error("This invite is for a different email address");
        return;
      }
    }

    setStatus("accepting");

    try {
      // Add user role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: invite.role,
        });

      if (roleError) {
        if (roleError.code === "23505") {
          toast.error("You already have an admin role");
        } else {
          throw roleError;
        }
        setStatus("valid");
        return;
      }

      // Mark invite as used
      await supabase
        .from("admin_invites")
        .update({ used_at: new Date().toISOString() })
        .eq("id", invite.id);

      setStatus("success");
      toast.success("Welcome! You are now a Content Admin");

      setTimeout(() => {
        navigate("/admin");
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Failed to accept invite");
      setStatus("valid");
    }
  };

  if (authLoading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            {status === "success" ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : status === "invalid" || status === "expired" || status === "used" ? (
              <XCircle className="w-8 h-8 text-destructive" />
            ) : (
              <Shield className="w-8 h-8 text-primary" />
            )}
          </div>
          <CardTitle>
            {status === "success" && "Welcome Aboard!"}
            {status === "valid" && "Admin Invitation"}
            {status === "accepting" && "Setting up your account..."}
            {status === "invalid" && "Invalid Invite"}
            {status === "expired" && "Invite Expired"}
            {status === "used" && "Invite Already Used"}
          </CardTitle>
          <CardDescription>
            {status === "success" && "You now have Content Admin access."}
            {status === "valid" && "You've been invited to join as a Content Admin."}
            {status === "accepting" && "Please wait..."}
            {status === "invalid" && "This invite link is not valid."}
            {status === "expired" && "This invite link has expired."}
            {status === "used" && "This invite has already been used."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "valid" && (
            <>
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">As a Content Admin, you can:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Manage lessons and resources</li>
                  <li>• Create and edit challenges</li>
                  <li>• View analytics and reports</li>
                  <li>• View user progress</li>
                </ul>
                <p className="mt-3 text-xs text-destructive">
                  ⚠️ Do not share this link with anyone.
                </p>
              </div>

              {!user ? (
                <div className="space-y-2">
                  <p className="text-sm text-center text-muted-foreground">
                    Please sign in or create an account to continue.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/auth?redirect=/admin/invite/${token}`)}
                  >
                    Sign In / Sign Up
                  </Button>
                </div>
              ) : (
                <Button className="w-full" onClick={handleAcceptInvite}>
                  Accept Invitation
                </Button>
              )}
            </>
          )}

          {status === "success" && (
            <Button className="w-full" onClick={() => navigate("/admin")}>
              Go to Admin Dashboard
            </Button>
          )}

          {status === "accepting" && (
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {(status === "invalid" || status === "expired" || status === "used") && (
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              Go to Homepage
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
