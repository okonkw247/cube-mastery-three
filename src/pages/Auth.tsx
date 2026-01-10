import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, Eye, EyeOff, ArrowLeft, User, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isAdminEmail } from "@/hooks/useAdmin";
import jsnLogo from "@/assets/jsn-logo.png";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import SignupQuestions, { SignupAnswers } from "@/components/onboarding/SignupQuestions";

type AuthStep = 
  | 'email' 
  | 'signup_password'
  | 'signup_otp'
  | 'login_password'
  | 'login_otp'
  | 'questions' 
  | 'password_reset_email' 
  | 'password_reset_code' 
  | 'password_reset_new';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const [step, setStep] = useState<AuthStep>('email');
  const [isSignup, setIsSignup] = useState(mode === 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { 
    signUp,
    verifyPassword,
    sendOTP, 
    verifyOTP,
    completeLogin,
    resetPasswordWithCode,
    sendWelcomeEmail,
    user, 
    loading 
  } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    code: "",
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
    } else if (mode === "signup") {
      setIsSignup(true);
    }
  }, [mode]);

  // Redirect based on user role - ONLY after proper authentication
  // This only triggers when user has a valid session (after OTP verification)
  useEffect(() => {
    if (!loading && user) {
      // Only redirect if we're not in an OTP or questions step
      if (step === 'email' || step === 'signup_password' || step === 'login_password') {
        const adminRole = isAdminEmail(user.email);
        if (adminRole) {
          navigate("/admin", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    }
  }, [user, loading, navigate, step]);

  // Handle email submission - determine if signup or login
  const handleEmailSubmit = () => {
    if (!formData.email) {
      toast.error("Please enter your email");
      return;
    }
    
    if (isSignup) {
      setStep('signup_password');
    } else {
      setStep('login_password');
    }
  };

  // Handle signup with password, then send OTP
  const handleSignupPassword = async () => {
    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    
    // Create the account (but don't use the session yet)
    const { error } = await signUp(formData.email, formData.password, formData.fullName);
    
    if (error) {
      setIsLoading(false);
      toast.error(error.message);
      return;
    }

    // Send OTP for verification - user must verify email before access
    const { error: otpError } = await sendOTP(formData.email, 'login');
    setIsLoading(false);

    if (otpError) {
      toast.error(otpError.message);
      return;
    }

    toast.success("Account created! Please verify with the code sent to your email.");
    setCountdown(60);
    setStep('signup_otp');
  };

  // Handle login with password verification (NO session creation)
  const handleLoginPassword = async () => {
    if (formData.password.length < 1) {
      toast.error("Please enter your password");
      return;
    }

    setIsLoading(true);
    
    // Verify password without creating session
    const { valid, error } = await verifyPassword(formData.email, formData.password);
    
    if (error || !valid) {
      setIsLoading(false);
      
      if (error?.message.includes("Invalid login credentials") || !valid) {
        toast.error("Invalid email or password");
        return;
      }
      
      toast.error(error?.message || "Invalid credentials");
      return;
    }

    // Password correct - now send OTP for 2FA
    // NO session is created yet - user MUST verify OTP first
    const { error: otpError } = await sendOTP(formData.email, 'login');
    setIsLoading(false);

    if (otpError) {
      toast.error("Failed to send verification code. Please try again.");
      return;
    }

    toast.success("Verification code sent to your email!");
    setCountdown(60);
    setStep('login_otp');
  };

  // Verify OTP for signup - then create session
  const handleVerifySignupOTP = async () => {
    if (formData.code.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    
    // Complete the login - this creates the session ONLY after OTP verification
    const { error, isNewUser } = await completeLogin(formData.email, formData.code, true);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    // Send welcome email for new users
    await sendWelcomeEmail(formData.email, formData.fullName);

    // New user - show mandatory questions
    setStep('questions');
  };

  // Verify OTP for login - then create session
  const handleVerifyLoginOTP = async () => {
    if (formData.code.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    
    // Complete the login - this creates the session ONLY after OTP verification
    const { error } = await completeLogin(formData.email, formData.code, false);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    // Check if admin
    const adminRole = isAdminEmail(formData.email);
    if (adminRole) {
      toast.success("Welcome back, Admin!");
      navigate("/admin");
      return;
    }

    // Check if user has already answered questions
    const questionsKey = `signup_questions_${formData.email}`;
    const hasAnswered = localStorage.getItem(questionsKey);
    
    if (hasAnswered) {
      toast.success("Welcome back!");
      navigate("/dashboard");
    } else {
      setStep('questions');
    }
  };

  // Password reset flow handlers
  const handleSendResetCode = async () => {
    if (!formData.email) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);
    const { error } = await sendOTP(formData.email, 'password_reset');
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Reset code sent to your email!");
    setCountdown(60);
    setStep('password_reset_code');
  };

  const handleVerifyResetCode = async () => {
    if (formData.code.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    const { error } = await verifyOTP(formData.email, formData.code, 'password_reset');
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Code verified! Set your new password.");
    setStep('password_reset_new');
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
    const type = step.includes('reset') ? 'password_reset' : 'login';
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
    if (step === 'signup_password' || step === 'login_password') {
      setStep('email');
    } else if (step === 'signup_otp') {
      setStep('signup_password');
    } else if (step === 'login_otp') {
      setStep('login_password');
    } else if (step === 'questions') {
      // Can't go back from questions
      return;
    } else if (step === 'password_reset_code' || step === 'password_reset_new') {
      setStep('password_reset_email');
    } else if (step === 'password_reset_email') {
      setStep('email');
    }
    setFormData({ ...formData, code: "" });
  };

  const handleQuestionsComplete = async (answers: SignupAnswers) => {
    const questionsKey = `signup_questions_${formData.email}`;
    localStorage.setItem(questionsKey, JSON.stringify(answers));
    
    toast.success("Welcome to Cube Mastery! 🎉");
    navigate("/dashboard");
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

  // If user exists and we're not in OTP/questions step, they'll be redirected by useEffect
  if (user && step !== 'signup_otp' && step !== 'login_otp' && step !== 'questions') {
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
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e] p-4 sm:p-6 relative overflow-hidden">
      {/* Background gradient shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23]" />
        <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Auth Card */}
        <div className="bg-[#2d2d44]/90 backdrop-blur-xl rounded-xl p-6 sm:p-8 border border-white/10 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-3 justify-center mb-6 sm:mb-8">
            <img src={jsnLogo} alt="Cube Mastery Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            <span className="text-lg sm:text-xl font-bold text-white">Cube Mastery</span>
          </div>

          {/* Email Entry Step */}
          {step === 'email' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl sm:text-2xl font-bold mb-2 text-white">
                  {isSignup ? "Create your account" : "Sign in to your account"}
                </h1>
                <p className="text-sm sm:text-base text-gray-400">Enter your email to get started</p>
              </div>

              <div className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300 text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 sm:pl-11 h-11 sm:h-12 bg-[#1a1a2e] border-white/10 text-white placeholder:text-gray-500 text-sm sm:text-base"
                      onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleEmailSubmit}
                  className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 text-sm sm:text-base"
                  disabled={isLoading || !formData.email}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="mt-6 text-center space-y-3">
                <button
                  type="button"
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-sm text-primary hover:underline"
                >
                  {isSignup ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                </button>
                <br />
                <button
                  type="button"
                  onClick={() => setStep('password_reset_email')}
                  className="text-sm text-gray-400 hover:text-gray-300"
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}

          {/* Signup Password Step */}
          {step === 'signup_password' && (
            <>
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="text-center mb-6">
                <h1 className="text-xl sm:text-2xl font-bold mb-2 text-white">Create your account</h1>
                <p className="text-sm text-gray-400">{formData.email}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-300 text-sm">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="pl-10 sm:pl-11 h-11 sm:h-12 bg-[#1a1a2e] border-white/10 text-white placeholder:text-gray-500 text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300 text-sm">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 sm:pl-11 pr-10 sm:pr-11 h-11 sm:h-12 bg-[#1a1a2e] border-white/10 text-white placeholder:text-gray-500 text-sm sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300 text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 sm:pl-11 h-11 sm:h-12 bg-[#1a1a2e] border-white/10 text-white placeholder:text-gray-500 text-sm sm:text-base"
                      onKeyDown={(e) => e.key === 'Enter' && handleSignupPassword()}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSignupPassword}
                  className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 text-sm sm:text-base"
                  disabled={isLoading || !formData.password || !formData.fullName}
                >
                  {isLoading ? (
                    <span className="animate-pulse">Creating account...</span>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Login Password Step */}
          {step === 'login_password' && (
            <>
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="text-center mb-6">
                <h1 className="text-xl sm:text-2xl font-bold mb-2 text-white">Enter your password</h1>
                <p className="text-sm text-gray-400">{formData.email}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-gray-300 text-sm">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 sm:pl-11 pr-10 sm:pr-11 h-11 sm:h-12 bg-[#1a1a2e] border-white/10 text-white placeholder:text-gray-500 text-sm sm:text-base"
                      onKeyDown={(e) => e.key === 'Enter' && handleLoginPassword()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleLoginPassword}
                  className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 text-sm sm:text-base"
                  disabled={isLoading || !formData.password}
                >
                  {isLoading ? (
                    <span className="animate-pulse">Verifying...</span>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep('password_reset_email')}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Signup OTP Verification */}
          {step === 'signup_otp' && (
            <>
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold mb-2 text-white">Verify your email</h1>
                <p className="text-sm text-gray-400">
                  Enter the 6-digit code sent to <span className="text-white">{formData.email}</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  You must verify your email to access your dashboard
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
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot key={index} index={index} className="bg-[#1a1a2e] border-white/10 text-white w-10 h-12 sm:w-12 sm:h-14" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerifySignupOTP}
                  className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 text-sm sm:text-base"
                  disabled={isLoading || formData.code.length !== 6}
                >
                  {isLoading ? (
                    <span className="animate-pulse">Verifying...</span>
                  ) : (
                    <>
                      Verify & Continue
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

          {/* Login OTP Verification */}
          {step === 'login_otp' && (
            <>
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold mb-2 text-white">Two-Factor Verification</h1>
                <p className="text-sm text-gray-400">
                  Enter the 6-digit code sent to <span className="text-white">{formData.email}</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  This is required to access your account
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
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot key={index} index={index} className="bg-[#1a1a2e] border-white/10 text-white w-10 h-12 sm:w-12 sm:h-14" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerifyLoginOTP}
                  className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 text-sm sm:text-base"
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
                <h1 className="text-xl sm:text-2xl font-bold mb-2 text-white">Reset your password</h1>
                <p className="text-sm text-gray-400">Enter your email to receive a reset code</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-gray-300 text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 sm:pl-11 h-11 sm:h-12 bg-[#1a1a2e] border-white/10 text-white placeholder:text-gray-500 text-sm sm:text-base"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendResetCode()}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSendResetCode}
                  className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 text-sm sm:text-base"
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

          {/* Password Reset - Code Verification */}
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
                <h1 className="text-xl sm:text-2xl font-bold mb-2 text-white">Enter reset code</h1>
                <p className="text-sm text-gray-400">
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
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot key={index} index={index} className="bg-[#1a1a2e] border-white/10 text-white w-10 h-12 sm:w-12 sm:h-14" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerifyResetCode}
                  className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 text-sm sm:text-base"
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

          {/* Password Reset - New Password */}
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
                <h1 className="text-xl sm:text-2xl font-bold mb-2 text-white">Set new password</h1>
                <p className="text-sm text-gray-400">Enter your new password below</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-gray-300 text-sm">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 sm:pl-11 pr-10 sm:pr-11 h-11 sm:h-12 bg-[#1a1a2e] border-white/10 text-white placeholder:text-gray-500 text-sm sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password" className="text-gray-300 text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <Input
                      id="confirm-new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 sm:pl-11 h-11 sm:h-12 bg-[#1a1a2e] border-white/10 text-white placeholder:text-gray-500 text-sm sm:text-base"
                      onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleResetPassword}
                  className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 text-sm sm:text-base"
                  disabled={isLoading || !formData.password}
                >
                  {isLoading ? (
                    <span className="animate-pulse">Updating password...</span>
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

          {/* Signup Questions Step */}
          {step === 'questions' && (
            <SignupQuestions onComplete={handleQuestionsComplete} inline />
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-xs sm:text-sm">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
