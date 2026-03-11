import { useAuth } from "./AuthContext";

export function SignInButton() {
  const { user, openSignIn } = useAuth();

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <img
          src={user.picture}
          alt={user.name}
          className="w-7 h-7 rounded-full border border-[#2b2b2b]"
          referrerPolicy="no-referrer"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        <span
          className="text-[0.8rem] uppercase"
          style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "1px" }}
        >
          {user.name}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={openSignIn}
      className="border-[1.5px] border-[#2b2b2b] px-5 py-1.5 uppercase text-[0.8rem] bg-[#1a1a1a] text-[#f5f0e8] hover:bg-[#f5f0e8] hover:text-[#1a1a1a] transition-colors cursor-pointer"
      style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "1px" }}
    >
      Sign In
    </button>
  );
}
