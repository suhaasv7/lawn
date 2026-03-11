import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthContext";

export function SignInButton() {
  const { user, openSignIn, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (user) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 cursor-pointer bg-transparent border-none"
        >
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
        </button>
        {dropdownOpen && (
          <div
            className="absolute right-0 top-full mt-2 border-2 border-[#2b2b2b] min-w-[160px] z-50"
            style={{ backgroundColor: "#ece7db" }}
          >
            <button
              onClick={() => {
                logout();
                setDropdownOpen(false);
              }}
              className="w-full text-left px-4 py-3 uppercase text-[0.75rem] hover:bg-[#1a1a1a] hover:text-[#f5f0e8] transition-colors cursor-pointer bg-transparent border-none"
              style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "1px" }}
            >
              Sign Out
            </button>
          </div>
        )}
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
