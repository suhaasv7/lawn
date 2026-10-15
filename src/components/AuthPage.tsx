import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  LockKeyIcon,
  UserIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleAuth = () => setIsLogin(!isLogin);

  return (
    <div className="flex min-h-screen w-full bg-[#100f0d] text-[#ece7db] p-4">
      <div className="m-auto w-full max-w-md overflow-hidden border-2 border-[#3d3830] bg-[#171513] shadow-2xl">
        <div className="p-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-[#ece7db]">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="mt-2 text-xs text-[rgba(236,231,219,0.6)]">
              {isLogin
                ? "Sign in to access your confidential filings"
                : "Register for client & counsel intake"}
            </p>
          </div>

          <div className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <HugeiconsIcon icon={UserIcon} size={18} strokeWidth={1.5} />
                </span>
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full border border-[#332f28] bg-[#100f0d] p-3 pl-11 text-xs text-[#ece7db] outline-none transition focus:border-[#c59f52] font-mono"
                />
              </div>
            )}

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                <HugeiconsIcon icon={Mail01Icon} size={18} strokeWidth={1.5} />
              </span>
              <input
                type="email"
                placeholder="Email Address"
                className="w-full border border-[#332f28] bg-[#100f0d] p-3 pl-11 text-xs text-[#ece7db] outline-none transition focus:border-[#c59f52] font-mono"
              />
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                <HugeiconsIcon icon={LockKeyIcon} size={18} strokeWidth={1.5} />
              </span>
              <input
                type="password"
                placeholder="Password"
                className="w-full border border-[#332f28] bg-[#100f0d] p-3 pl-11 text-xs text-[#ece7db] outline-none transition focus:border-[#c59f52] font-mono"
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <HugeiconsIcon icon={LockKeyIcon} size={18} strokeWidth={1.5} />
                </span>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="w-full border border-[#332f28] bg-[#100f0d] p-3 pl-11 text-xs text-[#ece7db] outline-none transition focus:border-[#c59f52] font-mono"
                />
              </div>
            )}

            {isLogin ? (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center text-[rgba(236,231,219,0.7)] cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2 accent-[#c59f52]"
                  />
                  <span>Remember me</span>
                </label>
                <a
                  href="#"
                  className="text-[#c59f52] hover:underline"
                >
                  Forgot password?
                </a>
              </div>
            ) : (
              <div className="flex items-center text-xs">
                <input
                  type="checkbox"
                  className="mr-2 accent-[#c59f52]"
                />
                <span className="text-[rgba(236,231,219,0.7)]">
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-[#c59f52] hover:underline"
                  >
                    Terms of Service
                  </a>
                </span>
              </div>
            )}

            <button className="group relative flex w-full items-center justify-center bg-[#ece7db] p-3 text-xs font-bold uppercase tracking-wider text-[#151411] transition hover:bg-white cursor-pointer font-mono">
              {isLogin ? "Sign In" : "Create Account"}
              <span className="absolute right-4">
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={1.5} />
              </span>
            </button>
          </div>

          <div className="mt-6 border-t border-[#332f28] pt-4 text-center">
            <p className="text-xs text-[rgba(236,231,219,0.6)]">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={toggleAuth}
                className="font-semibold text-[#c59f52] hover:underline bg-transparent border-none cursor-pointer"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
