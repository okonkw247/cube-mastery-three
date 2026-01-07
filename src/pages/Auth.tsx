import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import jsnLogo from "@/assets/jsn-logo.png";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type AuthStep = 'email' | 'code' | 'password_reset_email' | 'password_reset_code' | 'password_reset_new';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const [step, setStep] = useState<AuthStep>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { 
    signIn, 
    signUp, 
    sendOTP, 
    verifyOTP, 
    resetPasswordWithCode,
    sendLoginNotification,
    user, 
    loading 
  } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    code: "",
    password: "",
    confirmPassword: "",
  });

  // Handle countdown for resend code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Set initial step based on mode
  useEffect(() => {
    if (mode === "forgot") {
      setStep('password_reset_email');
    }
  }, [mode]);

  // Redirect if already logged in - check session for persistence
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSendCode = async () => {
    if (!formData.email) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);
    const type = step === 'email' ? 'login' : 'password_reset';
    const { error } = await sendOTP(formData.email, type);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Code sent to your email!");
    setCountdown(60);
    
    if (step === 'email') {
      setStep('code');
    } else if (step === 'password_reset_email') {
      setStep('password_reset_code');
    }
  };

  const handleVerifyCode = async () => {
    if (formData.code.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setIsLoading(true);

    if (step === 'code') {
      // Login flow
      const { error } = await verifyOTP(formData.email, formData.code, 'login');
      setIsLoading(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      // Send login notification
      await sendLoginNotification(formData.email);
      toast.success("Welcome to JSN Cubing!");
      navigate("/dashboard");
    } else if (step === 'password_reset_code') {
      // Password reset flow - verify code
      const { error } = await verifyOTP(formData.email, formData.code, 'password_reset');
      setIsLoading(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Code verified! Set your new password.");
      setStep('password_reset_new');
    }
  };

  const handleResetPassword = async () => {
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    const { error } = await resetPasswordWithCode(formData.email, formData.password);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated! You can now sign in.");
    setStep('email');
    setFormData({ ...formData, code: "", password: "", confirmPassword: "" });
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    const type = step === 'code' ? 'login' : 'password_reset';
    const { error } = await sendOTP(formData.email, type);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("New code sent!");
    setCountdown(60);
  };

  const goBack = () => {
    if (step === 'code') {
      setStep('email');
    } else if (step === 'password_reset_code' || step === 'password_reset_new') {
      setStep('password_reset_email');
    } else if (step === 'password_reset_email') {
      setStep('email');
    }
    setFormData({ ...formData, code: "" });
  };

  // Show loading while checking for existing session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-gray-400">Checking session...</div>
        </div>
      </div>
    );
  }

  // If user exists, they'll be redirected - don't show login form
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-gray-400">Redirecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e] p-6 relative overflow-hidden">
      {/* Background gradient shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23]" />
        <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Auth Card */}
        <div className="bg-[#2d2d44]/90 backdrop-blur-xl rounded-xl p-8 border border-white/10 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-3 justify-center mb-8">
            <img src={jsnLogo} alt="JSN Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-white">JSN Cubing</span>
          </div>

          {/* Email Entry Step */}
          {step === 'email' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2 text-white">Sign in to your account</h1>
                <p className="text-gray-400">Enter your email to receive a login code</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-11 h-12 bg-[#1a1a2e] border-white/10 text-white placeholder:text-gray-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSendCode}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
                  disabled={isLoading || !formData.email}
                >
                  {isLoading ? (
                    <span className="animate-pulse">Sending code...</span>
                  ) : (
                    <>
                      Send Login Code
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setStep('password_reset_email')}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}

          {/* Code Verification Step */}
          {step === 'code' && (
            <>
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2 text-white">Enter your code</h1>
                <p className="text-gray-400">
                  We sent a code to <span className="text-white">{formData.email}</span>
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={formData.code}
                    onChange={(value) => setFormData({ ...formData, code: value })}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="bg-[#1a1a2e] border-white/10 text-white" />
                      <InputOTPSlot index={1} className="bg-[#1a1a2e] border-white/10 text-white" />
                      <InputOTPSlot index={2} className="bg-[#1a1a2e] border-white/10 text-white" />
                      <InputOTPSlot index={3} className="bg-[#1a1a2e] border-white/10 text-white" />
                      <InputOTPSlot index={4} className="bg-[#1a1a2e] border-white/10 text-white" />
                      <InputOTPSlot index={5} className="bg-[#1a1a2e] border-white/10 text-white" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerifyCode}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
                  disabled={isLoading || formData.code.length !== 6}
                >
                  {isLoading ? (
                    <span className="animate-pulse">Verifying...</span>
                  ) : (
                    <>
                      Verify & Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={countdown > 0}
                    className={`text-sm ${countdown > 0 ? 'text-gray-500' : 'text-primary hover:underline'}`}
                  >
                    {countdown > 0 ? `Resend code in ${countdown}s` : "Didn't receive a code? Resend"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Password Reset - Email Step */}
          {step === 'password_reset_email' && (
            <>
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>

              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2 text-white">Reset your password</h1>
                <p className="text-gray-400">Enter your email to receive a reset code</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-gray-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-11 h-12 bg-[#1a1a2e] border-white/10 text-white placeholder:text-gray-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSendCode}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
                  disabled={isLoading || !formData.email}
                >
                  {isLoading ? (
                    <span className="animate-pulse">Sending code...</span>
                  ) : (
                    <>
                      Send Reset Code
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Password Reset - Code Verification Step */}
          {step === 'password_reset_code' && (
            <>
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2 text-white">Enter reset code</h1>
                <p className="text-gray-400">
                  We sent a code to <span className="text-white">{formData.email}</span>
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={formData.code}
                    onChange={(value) => setFormData({ ...formData, code: value })}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="bg-[#1a1a2e] border-white/10 text-white" />
                      <InputOTPSlot index={1} className="bg-[#1a1a2e] border-white/10 text-white" />
                      <InputOTPSlot index={2} className="bg-[#1a1a2e] border-white/10 text-white" />
                      <InputOTPSlot index={3} className="bg-[#1a1a2e] border-white/10 text-white" />
                      <InputOTPSlot index={4} className="bg-[#1a1a2e] border-white/10 text-white" />
                      <InputOTPSlot index={5} className="bg-[#1a1a2e] border-white/10 text-white" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerifyCode}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
                  disabled={isLoading || formData.code.length !== 6}
                >
                  {isLoading ? (
                    <span className="animate-pulse">Verifying...</span>
                  ) : (
                    <>
                      Verify Code
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={countdown > 0}
                    className={`text-sm ${countdown > 0 ? 'text-gray-500' : 'text-primary hover:underline'}`}
                  >
                    {countdown > 0 ? `Resend code in ${countdown}s` : "Didn't receive a code? Resend"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Password Reset - New Password Step */}
          {step === 'password_reset_new' && (
            <>
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2 text-white">Set new password</h1>
                <p className="text-gray-400">Enter your new password below</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-gray-300">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-11 pr-11 h-12 bg-[#1a1a2e] border-white/10 text-white placeholder:text-gray-500"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-gray-300">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-11 h-12 bg-[#1a1a2e] border-white/10 text-white placeholder:text-gray-500"
                      minLength={6}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleResetPassword}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
                  disabled={isLoading || !formData.password || !formData.confirmPassword}
                >
                  {isLoading ? (
                    <span className="animate-pulse">Updating...</span>
                  ) : (
                    <>
                      Update Password
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to home
          </Link>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-6 mt-8 text-xs text-gray-500">
          <span>Terms of use</span>
          <span>Privacy policy</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
