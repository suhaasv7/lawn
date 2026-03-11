import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "./AuthContext";

export function SignInModal() {
  const { showSignIn, closeSignIn, handleGoogleSuccess } = useAuth();

  if (!showSignIn) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={closeSignIn}
    >
      <div className="absolute inset-0 bg-[#1a1a1a]/60" />
      <div
        className="relative border-2 border-[#2b2b2b] p-10 max-w-[380px] w-full mx-4"
        style={{ backgroundColor: "#ece7db" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeSignIn}
          className="absolute top-4 right-4 text-[#1a1a1a] opacity-50 hover:opacity-100 text-[1.2rem] cursor-pointer bg-transparent border-none"
        >
          ✕
        </button>
        <h2 className="text-[1.5rem] font-bold mb-2" style={{ letterSpacing: "-0.5px" }}>
          Sign In
        </h2>
        <p
          className="text-[0.78rem] opacity-60 mb-8"
          style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
        >
          Continue with your Google account
        </p>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => console.error("Google sign-in failed")}
            shape="rectangular"
            theme="filled_black"
            size="large"
            width="300"
          />
        </div>
      </div>
    </div>
  );
}
