import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback, Children } from "react";
import { useNavigate } from "react-router-dom";
import { cva, type VariantProps } from "class-variance-authority";
import {
  ArrowRight, Mail, Gem, Lock, Eye, EyeOff,
  ArrowLeft, X, AlertCircle, PartyPopper, Loader,
  School
} from "lucide-react";
import { AnimatePresence, motion, useInView, Variants, Transition } from "framer-motion";
import confetti from "canvas-confetti";

// --- AUTH SERVICES ---
import { loginUser, signupUser, getUserProfile, googleLoginAuth } from "@/auth/authService";
import { setToken, setRefreshToken, setUser } from "@/store/authStore";
import BackgroundGlow from "./BackgroundGlow";
import { useGoogleLogin } from '@react-oauth/google';
import { useTenant } from "@/context/TenantContext";

// --- CONFETTI LOGIC ---
import type { Options as ConfettiOptions, GlobalOptions as ConfettiGlobalOptions, CreateTypes as ConfettiInstance } from "canvas-confetti";

type Api = { fire: (options?: ConfettiOptions) => void }
export type ConfettiRef = Api | null

const Confetti = forwardRef<ConfettiRef, React.ComponentPropsWithRef<"canvas"> & { options?: ConfettiOptions; globalOptions?: ConfettiGlobalOptions; manualstart?: boolean }>((props, ref) => {
  const { options, globalOptions = { resize: true, useWorker: true }, manualstart = false, ...rest } = props
  const instanceRef = useRef<ConfettiInstance | null>(null)
  const canvasRef = useCallback((node: HTMLCanvasElement) => {
    if (node !== null) {
      if (instanceRef.current) return
      instanceRef.current = confetti.create(node, { ...globalOptions, resize: true })
    } else {
      if (instanceRef.current) {
        instanceRef.current.reset()
        instanceRef.current = null
      }
    }
  }, [globalOptions])
  const fire = useCallback((opts = {}) => instanceRef.current?.({ ...options, ...opts }), [options])
  const api = useMemo(() => ({ fire }), [fire])
  useImperativeHandle(ref, () => api, [api])
  useEffect(() => { if (!manualstart) fire() }, [manualstart, fire])
  return <canvas ref={canvasRef} {...rest} />
})
Confetti.displayName = "Confetti";

// --- TEXT LOOP ANIMATION COMPONENT ---
type TextLoopProps = { children: React.ReactNode[]; className?: string; interval?: number; transition?: Transition; variants?: Variants; onIndexChange?: (index: number) => void; stopOnEnd?: boolean; };
export function TextLoop({ children, className, interval = 2, transition = { duration: 0.3 }, variants, onIndexChange, stopOnEnd = false }: TextLoopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = Children.toArray(children);
  useEffect(() => {
    const intervalMs = interval * 1000;
    const timer = setInterval(() => {
      setCurrentIndex((current) => {
        if (stopOnEnd && current === items.length - 1) {
          clearInterval(timer);
          return current;
        }
        const next = (current + 1) % items.length;
        onIndexChange?.(next);
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [items.length, interval, onIndexChange, stopOnEnd]);
  const motionVariants: Variants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  };
  return (
    <div className={cn('relative inline-block whitespace-nowrap', className)}>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.div key={currentIndex} initial='initial' animate='animate' exit='exit' transition={transition} variants={variants || motionVariants}>
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// --- BUILT-IN BLUR FADE ANIMATION COMPONENT ---
interface BlurFadeProps { children: React.ReactNode; className?: string; variant?: Variants; duration?: number; delay?: number; yOffset?: number; inView?: boolean; inViewMargin?: string; blur?: string; }
function BlurFade({ children, className, variant, duration = 0.4, delay = 0, yOffset = 6, inView = true, inViewMargin = "-50px", blur = "6px" }: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const isInView = !inView || inViewResult;
  const defaultVariants: Variants = {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: -yOffset, opacity: 1, filter: `blur(0px)` },
  };
  const combinedVariants = variant || defaultVariants;
  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? "visible" : "hidden"} exit="hidden" variants={combinedVariants} transition={{ delay: 0.04 + delay, duration, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}

// --- BUILT-IN GLASS BUTTON COMPONENT ---
const glassButtonVariants = cva("relative isolate all-unset cursor-pointer rounded-full transition-all", { variants: { size: { default: "text-base font-medium", sm: "text-sm font-medium", lg: "text-lg font-medium", icon: "h-10 w-10" } }, defaultVariants: { size: "default" } });
const glassButtonTextVariants = cva("glass-button-text relative block select-none tracking-tighter", { variants: { size: { default: "px-6 py-3.5", sm: "px-4 py-2", lg: "px-8 py-4", icon: "flex h-10 w-10 items-center justify-center" } }, defaultVariants: { size: "default" } });
export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof glassButtonVariants> { contentClassName?: string; }
const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size, contentClassName, onClick, ...props }, ref) => {
    const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const button = e.currentTarget.querySelector('button');
      if (button && e.target !== button) button.click();
    };
    return (
      <div className={cn("glass-button-wrap cursor-pointer rounded-full relative", className)} onClick={handleWrapperClick}>
        <button className={cn("glass-button relative z-10", glassButtonVariants({ size }))} ref={ref} onClick={onClick} {...props}>
          <span className={cn(glassButtonTextVariants({ size }), contentClassName)}>{children}</span>
        </button>
        <div className="glass-button-shadow rounded-full pointer-events-none"></div>
      </div>
    );
  }
);
GlassButton.displayName = "GlassButton";

// --- THEME-AWARE SVG GRADIENT BACKGROUND ---
// Redundant internal GradientBackground removed to favor GlobalBackground

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-6 h-6"> <g fillRule="evenodd" fill="none"> <g fillRule="nonzero" transform="translate(3, 2)"> <path fill="#4285F4" d="M57.8123233,30.1515267 C57.8123233,27.7263183 57.6155321,25.9565533 57.1896408,24.1212666 L29.4960833,24.1212666 L29.4960833,35.0674653 L45.7515771,35.0674653 C45.4239683,37.7877475 43.6542033,41.8844383 39.7213169,44.6372555 L39.6661883,45.0037254 L48.4223791,51.7870338 L49.0290201,51.8475849 C54.6004021,46.7020943 57.8123233,39.1313952 57.8123233,30.1515267"></path> <path fill="#34A853" d="M29.4960833,58.9921667 C37.4599129,58.9921667 44.1456164,56.3701671 49.0290201,51.8475849 L39.7213169,44.6372555 C37.2305867,46.3742596 33.887622,47.5868638 29.4960833,47.5868638 C21.6960582,47.5868638 15.0758763,42.4415991 12.7159637,35.3297782 L12.3700541,35.3591501 L3.26524241,42.4054492 L3.14617358,42.736447 C7.9965904,52.3717589 17.959737,58.9921667 29.4960833,58.9921667"></path> <path fill="#FBBC05" d="M12.7159637,35.3297782 C12.0932812,33.4944915 11.7329116,31.5279353 11.7329116,29.4960833 C11.7329116,27.4640054 12.0932812,25.4976752 12.6832029,23.6623884 L12.6667095,23.2715173 L3.44779955,16.1120237 L3.14617358,16.2554937 C1.14708246,20.2539019 0,24.7439491 0,29.4960833 C0,34.2482175 1.14708246,38.7380388 3.14617358,42.736447 L12.7159637,35.3297782"></path> <path fill="#EB4335" d="M29.4960833,11.4050769 C35.0347044,11.4050769 38.7707997,13.7975244 40.9011602,15.7968415 L49.2255853,7.66898166 C44.1130815,2.91684746 37.4599129,0 29.4960833,0 C17.959737,0 7.9965904,6.62018183 3.14617358,16.2554937 L12.6832029,23.6623884 C15.0758763,16.5505675 21.6960582,11.4050769 29.4960833,11.4050769"></path> </g> </g></svg>);
const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-6 h-6"> <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" /> </svg>);

const modalSteps = [
  { message: "Authenticating...", icon: <Loader className="w-12 h-12 text-blue-500 animate-spin" /> },
  { message: "Setting up environment...", icon: <Loader className="w-12 h-12 text-blue-500 animate-spin" /> },
  { message: "Finalizing session...", icon: <Loader className="w-12 h-12 text-blue-500 animate-spin" /> },
  { message: "Process Complete!", icon: <PartyPopper className="w-12 h-12 text-green-500" /> }
];
const TEXT_LOOP_INTERVAL = 1.5;

const DefaultLogo = () => (<div className="bg-primary text-primary-foreground rounded-md p-1.5"> <Gem className="h-4 w-4" /> </div>);

// --- MAIN COMPONENT ---
interface AuthComponentProps {
  mode?: "login" | "signup";
  logo?: React.ReactNode;
  brandName?: string;
}

export const AuthComponent = ({ mode = "login", logo = <DefaultLogo />, brandName = "EduSaaS" }: AuthComponentProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authStep, setAuthStep] = useState(mode === "signup" ? "school" : "email");
  const [modalStatus, setModalStatus] = useState<'closed' | 'loading' | 'error' | 'success'>('closed');
  const [modalErrorMessage, setModalErrorMessage] = useState('');
  const [inlineError, setInlineError] = useState('');
  const confettiRef = useRef<ConfettiRef>(null);

  const tenant = useTenant();
  const navigate = useNavigate();
  
  // Use domain-based school name if available
  const effectiveBrandName = tenant?.schoolName || brandName;

  // Clear inline error when typing
  useEffect(() => {
    if (inlineError) setInlineError('');
  }, [email, password, schoolName]);

  const isEmailValid = mode === 'login' ? email.length >= 3 : /\S+@\S+\.\S+/.test(email);
  const isPasswordValid = password.length >= 6;
  const isConfirmPasswordValid = confirmPassword.length >= 6;
  const isSchoolValid = schoolName.length >= 2;

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
  const schoolInputRef = useRef<HTMLInputElement>(null);

  const fireSideCanons = () => {
    const fire = confettiRef.current?.fire;
    if (fire) {
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
      const particleCount = 50;
      fire({ ...defaults, particleCount, origin: { x: 0, y: 1 }, angle: 60 });
      fire({ ...defaults, particleCount, origin: { x: 1, y: 1 }, angle: 120 });
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setModalStatus('loading');
      try {
        const data = await googleLoginAuth(tokenResponse.access_token, schoolName);
        setToken(data.access);
        setRefreshToken(data.refresh);
        const userProfile = await getUserProfile();
        setUser(userProfile);

        setTimeout(() => {
          fireSideCanons();
          setModalStatus('success');
          setTimeout(() => {
            const isLocalhostTarget = data.school_domain?.includes('localhost');
            const isCurrentlyProduction = !window.location.hostname.includes('localhost');

            if (data.school_domain && window.location.hostname !== data.school_domain && !(isCurrentlyProduction && isLocalhostTarget)) {
              const targetUrl = `${window.location.protocol}//${data.school_domain}${window.location.port ? ':' + window.location.port : ''}/dashboard?token=${data.access}&refresh=${data.refresh}`;
              window.location.href = targetUrl;
            } else {
              navigate("/dashboard");
            }
          }, 1500);
        }, TEXT_LOOP_INTERVAL * 2000);
      } catch (err: any) {
        setModalStatus('closed');
        let errorMsg = err.response?.data?.error || "Google login failed.";
        if (typeof errorMsg === 'object') {
          errorMsg = JSON.stringify(errorMsg);
        }
        setInlineError(errorMsg);
      }
    },
    onError: () => {
      setInlineError('Google login was canceled or failed.');
    }
  });

  const handleFinalSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (modalStatus !== 'closed') return;

    if (mode === "signup" && password !== confirmPassword) {
      setModalErrorMessage("Passwords do not match!");
      setModalStatus('error');
      return;
    }

    setModalStatus('loading');
    try {
      if (mode === "login") {
        const data = await loginUser({ username: email, password });
        setToken(data.access);
        setRefreshToken(data.refresh);
        const userProfile = await getUserProfile();
        setUser(userProfile);

        setTimeout(() => {
          fireSideCanons();
          setModalStatus('success');
          setTimeout(() => {
            const isLocalhostTarget = data.school_domain?.includes('localhost');
            const isCurrentlyProduction = !window.location.hostname.includes('localhost');

            if (data.school_domain && window.location.hostname !== data.school_domain && !(isCurrentlyProduction && isLocalhostTarget)) {
              const targetUrl = `${window.location.protocol}//${data.school_domain}${window.location.port ? ':' + window.location.port : ''}/dashboard?token=${data.access}&refresh=${data.refresh}`;
              window.location.href = targetUrl;
            } else {
              navigate("/dashboard");
            }
          }, 1500);
        }, TEXT_LOOP_INTERVAL * 2000);
      } else {
        await signupUser({ school_name: schoolName, username: email, password });
        setTimeout(() => {
          fireSideCanons();
          setModalStatus('success');
        }, TEXT_LOOP_INTERVAL * 3000);
      }
    } catch (err: any) {
      let errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || "Authentication failed.";
      if (typeof errorMsg === 'object') {
        errorMsg = JSON.stringify(errorMsg);
      }
      setInlineError(errorMsg); 
      // setModalStatus('error'); // Disabled modal as per "error login page pr hi show krwaya"
    }
  };

  const handleProgressStep = () => {
    if (authStep === 'school') {
      if (isSchoolValid) setAuthStep("email");
    } else if (authStep === 'email') {
      if (isEmailValid) setAuthStep("password");
    } else if (authStep === 'password') {
      if (isPasswordValid) {
        if (mode === "login") handleFinalSubmit();
        else setAuthStep("confirmPassword");
      }
    } else if (authStep === 'confirmPassword') {
      if (isConfirmPasswordValid) handleFinalSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleProgressStep();
    }
  };

  const handleGoBack = () => {
    if (authStep === 'confirmPassword') setAuthStep('password');
    else if (authStep === 'password') setAuthStep('email');
    else if (authStep === 'email' && mode === 'signup') setAuthStep('school');
  };

  const closeModal = () => {
    setModalStatus('closed');
    setModalErrorMessage('');
  };

  useEffect(() => {
    if (authStep === 'email') setTimeout(() => emailInputRef.current?.focus(), 500);
    else if (authStep === 'password') setTimeout(() => passwordInputRef.current?.focus(), 500);
    else if (authStep === 'confirmPassword') setTimeout(() => confirmPasswordInputRef.current?.focus(), 500);
    else if (authStep === 'school') setTimeout(() => schoolInputRef.current?.focus(), 500);
  }, [authStep]);

  const Modal = () => (
    <AnimatePresence>
      {modalStatus !== 'closed' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-10 w-full max-w-sm flex flex-col items-center gap-6 mx-4">
            {(modalStatus === 'error' || (modalStatus === 'success' && mode === 'signup')) && <button onClick={() => mode === 'signup' && modalStatus === 'success' ? navigate("/login") : closeModal()} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"><X className="w-5 h-5" /></button>}
            {/* Modal Error State (Refined for Readability) */}
            {modalStatus === 'error' && (
              <div className="flex flex-col items-center gap-6 w-full py-4">
                <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center border border-red-100 shadow-sm">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                
                <div className="flex flex-col gap-2 text-center">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Authentication Failed
                  </h3>
                  <p className="text-[15px] font-medium text-slate-500 leading-relaxed max-w-[280px]">
                    {modalErrorMessage}
                  </p>
                </div>

                <div className="w-full flex justify-center pt-4">
                  <button 
                    onClick={closeModal}
                    className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold text-sm hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
            {modalStatus === 'loading' &&
              <TextLoop interval={TEXT_LOOP_INTERVAL} stopOnEnd={true}>
                {modalSteps.slice(0, -1).map((step, i) =>
                  <div key={i} className="flex flex-col items-center gap-5">
                    {step.icon}
                    <p className="text-lg font-semibold text-slate-800 tracking-tight">{step.message}</p>
                  </div>
                )}
              </TextLoop>
            }
            {modalStatus === 'success' &&
              <div className="flex flex-col items-center gap-5">
                {modalSteps[modalSteps.length - 1].icon}
                <p className="text-lg font-semibold text-slate-800 tracking-tight text-center">
                  {mode === 'signup' ? "Registration Successful! Pending approval." : modalSteps[modalSteps.length - 1].message}
                </p>
                {mode === 'signup' && <GlassButton onClick={() => navigate("/login")} size="sm" className="mt-2">Go to Login</GlassButton>}
              </div>
            }
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen w-screen flex flex-col overflow-hidden bg-transparent">
      <style>{`
            input[type="password"]::-ms-reveal, input[type="password"]::-ms-clear { display: none !important; } input[type="password"]::-webkit-credentials-auto-fill-button, input[type="password"]::-webkit-strong-password-auto-fill-button { display: none !important; } input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active { -webkit-box-shadow: 0 0 0 30px transparent inset !important; -webkit-text-fill-color: #0f172a !important; background-color: transparent !important; background-clip: content-box !important; transition: background-color 5000s ease-in-out 0s !important; color: #0f172a !important; caret-color: #0f172a !important; } input:autofill { background-color: transparent !important; background-clip: content-box !important; -webkit-text-fill-color: #0f172a !important; color: #0f172a !important; } input:-internal-autofill-selected { background-color: transparent !important; background-image: none !important; color: #0f172a !important; -webkit-text-fill-color: #0f172a !important; } input:-webkit-autofill::first-line { color: #0f172a !important; -webkit-text-fill-color: #0f172a !important; }
            @property --angle-1 { syntax: "<angle>"; inherits: false; initial-value: -75deg; } @property --angle-2 { syntax: "<angle>"; inherits: false; initial-value: -45deg; }
            .glass-button-wrap { --anim-time: 400ms; --anim-ease: cubic-bezier(0.25, 1, 0.5, 1); --border-width: clamp(1px, 0.0625em, 4px); position: relative; z-index: 2; transform-style: preserve-3d; transition: transform var(--anim-time) var(--anim-ease); } .glass-button-wrap:has(.glass-button:active) { transform: rotateX(25deg); } .glass-button-shadow { --shadow-cutoff-fix: 2em; position: absolute; width: calc(100% + var(--shadow-cutoff-fix)); height: calc(100% + var(--shadow-cutoff-fix)); top: calc(0% - var(--shadow-cutoff-fix) / 2); left: calc(0% - var(--shadow-cutoff-fix) / 2); filter: blur(clamp(2px, 0.125em, 12px)); transition: filter var(--anim-time) var(--anim-ease); pointer-events: none; z-index: 0; } .glass-button-shadow::after { content: ""; position: absolute; inset: 0; border-radius: 9999px; background: linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.05)); width: calc(100% - var(--shadow-cutoff-fix) - 0.25em); height: calc(100% - var(--shadow-cutoff-fix) - 0.25em); top: calc(var(--shadow-cutoff-fix) - 0.5em); left: calc(var(--shadow-cutoff-fix) - 0.875em); padding: 0.125em; box-sizing: border-box; mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; transition: all var(--anim-time) var(--anim-ease); opacity: 1; }
            .glass-button { -webkit-tap-highlight-color: transparent; backdrop-filter: blur(8px); background: rgba(255,255,255,0.7); box-shadow: inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.05), 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.9); } .glass-button:hover { transform: scale(0.98); background: rgba(255,255,255,0.8); } .glass-button-text { color: #0f172a; font-weight: 600; text-shadow: none; transition: all var(--anim-time) var(--anim-ease); } .glass-button-text::after { display: none; } .glass-button::after { display: none; } 
            .glass-input-wrap { position: relative; z-index: 2; transform-style: preserve-3d; border-radius: 9999px; } .glass-input { display: flex; position: relative; width: 100%; align-items: center; gap: 0.5rem; border-radius: 9999px; padding: 0.25rem 0.5rem; -webkit-tap-highlight-color: transparent; backdrop-filter: blur(12px); background: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.6); box-shadow: inset 0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(255,255,255,0.5); transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1); } .glass-input-wrap:focus-within .glass-input { background: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.9); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02), 0 0 0 2px rgba(255,255,255,0.5); } .glass-input::after { display: none; } .glass-input-text-area::after { display: none; }
            .social-glass-button { position: relative; display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.75rem 1.75rem; border-radius: 9999px; background: rgba(255, 255, 255, 0.3); backdrop-filter: blur(20px); border: 1.5px solid rgba(255, 255, 255, 0.9); box-shadow: inset 0 10px 15px rgba(255, 255, 255, 0.7), inset 0 -4px 6px rgba(0, 0, 0, 0.04), 0 12px 24px -8px rgba(0, 0, 0, 0.12); transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); overflow: hidden; cursor: pointer; }
            .social-glass-button:hover { transform: translateY(-4px) scale(1.03); background: rgba(255, 255, 255, 0.5); box-shadow: inset 0 12px 20px rgba(255, 255, 255, 0.9), inset 0 -6px 10px rgba(0, 0, 0, 0.06), 0 20px 30px -10px rgba(0, 0, 0, 0.15); border-color: white; }
            .social-glass-button:active { transform: translateY(-1px) scale(0.98); }
            .social-glass-button::after { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 50%; background: linear-gradient(to bottom, rgba(255,255,255,0.4), transparent); border-radius: 9999px 9999px 0 0; pointer-events: none; }
        `}</style>

      <Confetti ref={confettiRef} manualstart className="fixed top-0 left-0 w-full h-full pointer-events-none z-[999]" />
      <Modal />

      {/* Global Toolbar */}
      <div className="fixed top-4 left-4 z-20 flex items-center gap-2">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          {logo}
          <h1 className="text-base font-bold text-slate-900">{effectiveBrandName}</h1>
        </div>
      </div>

      <BackgroundGlow variant="both" className="min-h-[100vh]">
        <div className="flex w-full h-full min-h-[80vh] items-center justify-center relative">
          
        <fieldset disabled={modalStatus !== 'closed'} className="relative z-10 flex flex-col items-center gap-8 w-full max-w-[400px] mx-auto p-4">
          <AnimatePresence mode="wait">
            {authStep === "school" && <motion.div key="school-content" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center gap-4 text-center">
              <BlurFade delay={0}><p className="font-serif font-light text-4xl sm:text-5xl md:text-6xl tracking-tight text-slate-900 whitespace-nowrap uppercase">Register School</p></BlurFade>
              <BlurFade delay={0.25}><p className="text-sm font-medium text-slate-500">Name your institution to get started</p></BlurFade>
            </motion.div>}

            {authStep === "email" && <motion.div key="email-content" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full flex flex-col items-center gap-4">
              <BlurFade delay={0.25 * 1} className="w-full text-center"><p className="font-serif font-light text-4xl sm:text-5xl md:text-6xl tracking-tight text-slate-900 whitespace-nowrap">Get started with Us</p></BlurFade>
              <BlurFade delay={0.25 * 2}><p className="text-sm font-medium text-slate-600">Continue with</p></BlurFade>
              <BlurFade delay={0.25 * 3} className="w-full max-w-[340px]"><div className="flex items-center justify-center gap-4 w-full">
                <button type="button" onClick={() => handleGoogleLogin()} className="social-glass-button flex-1 group px-4">
                  <div className="relative transform transition-transform group-hover:rotate-12 duration-300"><GoogleIcon /></div>
                  <span className="font-bold text-base text-slate-800 tracking-tight">Google</span>
                </button>
                <button type="button" className="social-glass-button flex-1 group px-4">
                  <div className="relative transform transition-transform group-hover:rotate-12 duration-300"><GitHubIcon className="w-6 h-6 text-slate-900" /></div>
                  <span className="font-bold text-base text-slate-800 tracking-tight">GitHub</span>
                </button>
              </div></BlurFade>
              <BlurFade delay={0.25 * 4} className="w-full max-w-[340px]"><div className="flex items-center w-full gap-2 py-2"><hr className="w-full border-slate-300" /><span className="text-xs font-semibold text-slate-500">OR</span><hr className="w-full border-slate-300" /></div></BlurFade>
            </motion.div>}

            {authStep === "password" && <motion.div key="password-title" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full flex flex-col items-center text-center gap-4">
              <BlurFade delay={0} className="w-full"><p className="font-serif font-light text-4xl sm:text-5xl tracking-tight text-slate-900 whitespace-nowrap">Security Check</p></BlurFade>
              <BlurFade delay={0.25 * 1}><p className="text-sm font-medium text-slate-600 text-center">Enter your credentials to continue</p></BlurFade>
            </motion.div>}

            {authStep === "confirmPassword" && <motion.div key="confirm-title" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full flex flex-col items-center text-center gap-4">
              <BlurFade delay={0} className="w-full"><p className="font-serif font-light text-4xl sm:text-5xl tracking-tight text-slate-900 whitespace-nowrap">One Last Step</p></BlurFade>
              <BlurFade delay={0.25 * 1}><p className="text-sm font-medium text-slate-600 text-center">Confirm your password to secure your admin account</p></BlurFade>
            </motion.div>}
          </AnimatePresence>

          <form onSubmit={handleFinalSubmit} className="w-full max-w-[340px] space-y-10 " >
            {/* Inline Error (Text Only, No Box) */}
            <AnimatePresence>
              {inlineError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full text-center px-4 mb-2 translate-y-[-20px]"
                >
                  <p className="text-sm font-bold text-red-600 flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {inlineError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait" >
              {authStep === 'school' && <motion.div key="school-f" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="w-full">
                <div className="glass-input-wrap w-full" ><div className="glass-input relative z-10 flex w-full items-center gap-1 rounded-full pl-4 pr-2 py-2 shadow-sm backdrop-blur-md bg-white/40 border border-white/60">
                  <span className="glass-input-text-area"></span>
                  <div className="flex-shrink-0 flex items-center justify-center relative z-10 mr-1"><School className="h-5 w-5 opacity-70 text-slate-800" /></div>
                  <input ref={schoolInputRef} type="text" placeholder="School Name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} onKeyDown={handleKeyDown} className="relative z-10 h-full min-w-0 flex-grow bg-transparent text-slate-900 placeholder:text-slate-500 focus:outline-none py-2 text-base font-medium" />
                  <div className={cn("relative z-10 flex-shrink-0 transition-all duration-300", isSchoolValid ? "w-10 opacity-100" : "w-0 opacity-0")}>
                    <button type="button" onClick={handleProgressStep} className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-900 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"><ArrowRight className="w-5 h-5" /></button>
                  </div>
                </div></div>
                <BlurFade inView delay={0.3} className="mt-8 text-center"><button type="button" onClick={() => navigate("/login")} className="text-sm text-slate-600 hover:text-slate-900 font-medium underline-offset-4 hover:underline mt-3" style={{ marginTop: "20px" }}>Already have an account? Sign In</button></BlurFade>
              </motion.div>}

              {(authStep === 'email' || authStep === 'password') && <motion.div key="e-p-fields" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col gap-12 text-slate-900">
                <div className="relative w-full" >
                  <AnimatePresence >
                    {email.length > 0 && <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }} className="absolute -top-6 left-4 z-10"><label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Username / Email</label></motion.div>}
                  </AnimatePresence>
                  <div className="glass-input-wrap w-full"><div className="glass-input relative z-10 flex w-full items-center gap-1 rounded-full pl-4 pr-2 py-2 shadow-sm backdrop-blur-md bg-white/40 border border-white/60" >
                    <span className="glass-input-text-area"></span>
                    <div className="flex-shrink-0 flex items-center justify-center relative z-10 mr-1"><Mail className="h-5 w-5 text-slate-800 opacity-70" /></div>
                    <input ref={emailInputRef} type="text" placeholder="Username / Email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown} className="relative z-10 h-full min-w-0 flex-grow bg-transparent text-slate-900 placeholder:text-slate-500 focus:outline-none py-2 text-base font-medium" />
                    <div className={cn("relative z-10 flex-shrink-0 transition-all duration-300", (isEmailValid && authStep === 'email') ? "w-10 opacity-100" : "w-0 opacity-0")}>
                      <button type="button" onClick={handleProgressStep} className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-900 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"><ArrowRight className="w-5 h-5" /></button>
                    </div>
                  </div></div>
                </div>

                <AnimatePresence mode="wait" >
                  {authStep === "password" && <motion.div key="p-field" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full mt-4" >
                    <AnimatePresence>
                      {password.length > 0 && <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }} className="absolute -top-6 left-4 z-10"><label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Password</label></motion.div>}
                    </AnimatePresence>
                    <div className="glass-input-wrap w-full " ><div className="glass-input relative z-10 flex w-full items-center gap- rounded-full pl-4 pr-2 py-2 shadow-sm backdrop-blur-md bg-white/40 border border-white/60 " >
                      <span className="glass-input-text-area"></span>
                      <div className="flex-shrink-0 flex items-center justify-center relative z-10 mr-1">
                        {isPasswordValid ? <button type="button" onClick={() => setShowPassword(!showPassword)} className="opacity-70 transition-colors p-1 rounded-full hover:opacity-100 text-slate-800">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button> : <Lock className="h-5 w-5 text-slate-800 opacity-70" />}
                      </div>
                      <input ref={passwordInputRef} type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} className="relative z-10 h-full min-w-0 flex-grow bg-transparent text-slate-900 placeholder:text-slate-500 focus:outline-none py-2 text-base font-medium " />
                      <div className={cn("relative z-10 flex-shrink-0 transition-all duration-300", isPasswordValid ? "w-10 opacity-100" : "w-0 opacity-0")}>
                        <button type="button" onClick={handleProgressStep} className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-900 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"><ArrowRight className="w-5 h-5" /></button>
                      </div>
                    </div></div>
                  </motion.div>}
                </AnimatePresence>

                <div className="flex flex-col gap-4 mt-8">
                  {(authStep === 'password' || (authStep === 'email' && mode === 'signup')) && <BlurFade inView delay={0.2}><button type="button" onClick={handleGoBack} className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all uppercase tracking-tighter w-full" style={{ marginTop: "2rem" }}><ArrowLeft className="w-3 h-3" /> Go back</button></BlurFade>}
                  {authStep === 'email' && mode === 'login' && <BlurFade inView delay={0.2} className="text-center pt-2"><button type="button" onClick={() => navigate("/signup")} className="text-sm text-slate-600 hover:text-slate-900 font-medium underline-offset-4 hover:underline" style={{ marginTop: "2rem" }}>New School? Register here</button></BlurFade>}
                </div>
              </motion.div>}

              {authStep === 'confirmPassword' && <motion.div key="c-p-field" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="w-full space-y-10">
                <div className="relative w-full">
                  <AnimatePresence>
                    {confirmPassword.length > 0 && <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }} className="absolute -top-6 left-4 z-10"><label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Confirm Password</label></motion.div>}
                  </AnimatePresence>
                  <div className="glass-input-wrap w-full"><div className="glass-input relative z-10 flex w-full items-center gap-2 rounded-full pl-4 pr-2 py-2 shadow-sm backdrop-blur-md bg-white/40 border border-white/60">
                    <span className="glass-input-text-area"></span>
                    <div className="flex-shrink-0 flex items-center justify-center relative z-10 mr-1">
                      {isConfirmPasswordValid ? <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="opacity-70 transition-colors p-1 rounded-full hover:opacity-100 text-slate-800">{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button> : <Lock className="h-5 w-5 text-slate-800 opacity-70" />}
                    </div>
                    <input ref={confirmPasswordInputRef} type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={handleKeyDown} className="relative z-10 h-full min-w-0 flex-grow bg-transparent text-slate-900 placeholder:text-slate-500 focus:outline-none py-2 text-base font-medium" />
                    <div className={cn("relative z-10 flex-shrink-0 transition-all duration-300", isConfirmPasswordValid ? "w-10 opacity-100" : "w-0 opacity-0")}>
                      <button type="submit" className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-900 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"><ArrowRight className="w-5 h-5" /></button>
                    </div>
                  </div></div>
                </div>
                <button type="button" onClick={handleGoBack} className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all uppercase tracking-tighter w-full mt-6"><ArrowLeft className="w-3 h-3" /> Back to password</button>
              </motion.div>}
            </AnimatePresence>
          </form>
        </fieldset>
        </div>
      </BackgroundGlow>
    </div >
  );
};
