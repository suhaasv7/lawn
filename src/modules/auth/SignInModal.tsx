import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "./AuthContext";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, ShieldCheckIcon } from "@hugeicons/core-free-icons";
import GoogleIcon from "@thesvg/react/google";

export function SignInModal() {
  const { showSignIn, closeSignIn, handleGoogleSuccess } = useAuth();

  if (!showSignIn) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: "rgba(10, 9, 8, 0.82)" }}
      onClick={closeSignIn}
    >
      <div
        className="relative border-2 border-[#453e34] p-8 sm:p-10 max-w-[400px] w-full text-[#ece7db] shadow-2xl"
        style={{ backgroundColor: "#171513" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner marks */}
        <span className="absolute top-2 left-2 text-[#453e34] text-xs font-mono">+</span>
        <span className="absolute top-2 right-2 text-[#453e34] text-xs font-mono">+</span>
        <span className="absolute bottom-2 left-2 text-[#453e34] text-xs font-mono">+</span>
        <span className="absolute bottom-2 right-2 text-[#453e34] text-xs font-mono">+</span>

        <button
          onClick={closeSignIn}
          className="absolute top-4 right-4 text-[#ece7db] opacity-60 hover:opacity-100 cursor-pointer bg-transparent border-none transition-opacity"
          aria-label="Close dialog"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.5} />
        </button>

        <div className="flex items-center gap-2 mb-2 text-[#c59f52]">
          <HugeiconsIcon icon={ShieldCheckIcon} size={15} strokeWidth={1.5} color="#c59f52" />
          <span className="text-[0.65rem] uppercase tracking-widest font-mono">
            Client &amp; Counsel Portal
          </span>
        </div>

        <div className="flex items-center gap-3 my-3">
          <div className="w-10 h-10 border border-[#3d3830] bg-[#12110f] flex items-center justify-center">
            <GoogleIcon width={22} height={22} />
          </div>
          <div>
            <h2 className="text-[1.4rem] font-bold tracking-tight text-[#ece7db]">
              Sign In
            </h2>
            <div className="text-[0.66rem] uppercase tracking-wider text-[rgba(236,231,219,0.5)] font-mono">
              Google Workspace SSO
            </div>
          </div>
        </div>

        <p className="text-[0.76rem] text-[rgba(236,231,219,0.65)] mb-6 leading-relaxed">
          Access your privileged matter filings and attorney correspondence.
        </p>

        <div className="flex justify-center pb-2">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => console.error("Google sign-in failed")}
            shape="rectangular"
            theme="filled_black"
            size="large"
            width="300"
          />
        </div>

        <div className="mt-6 pt-4 border-t border-[#332f28] text-center text-[0.65rem] text-[rgba(236,231,219,0.5)] font-mono">
          Strict 256-Bit Encrypted Authentication
        </div>
      </div>
    </div>
  );
}
