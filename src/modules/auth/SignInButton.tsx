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
            className="w-7 h-7 rounded-full border border-[#3d3830]"
            referrerPolicy="no-referrer"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <span
            className="text-[0.8rem] uppercase"
            style={{ letterSpacing: "1px" }}
          >
            {user.name}
          </span>
        </button>
        {dropdownOpen && (
          <div
            className="absolute right-0 top-full mt-2 border-2 border-[#3d3830] min-w-[160px] z-50 text-[#ece7db]"
            style={{ backgroundColor: "#1b1917" }}
          >
            <button
              onClick={() => {
                logout();
                setDropdownOpen(false);
              }}
              className="w-full text-left px-4 py-3 uppercase text-[0.75rem] hover:bg-[#ece7db] hover:text-[#16150f] transition-colors cursor-pointer bg-transparent border-none"
              style={{ letterSpacing: "1px" }}
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
      className="border-[1.5px] border-[#ece7db] px-5 py-1.5 uppercase text-[0.8rem] bg-[#ece7db] text-[#16150f] hover:bg-transparent hover:text-[#ece7db] transition-colors cursor-pointer"
      style={{ letterSpacing: "1px" }}
    >
      Sign In
    </button>
  );
}
