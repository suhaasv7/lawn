import { SignInButton, SignInModal } from "./modules/auth";
import "./App.css";

function App() {
  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: "#f5f0e8", fontFamily: "'Space Grotesk', Arial, sans-serif" }}
    >
      {/* ── NAV ── */}
      <header
        className="flex justify-between items-center border-2 border-[#2b2b2b] px-5 py-3 mb-6 max-w-[1200px] mx-auto"
        style={{ backgroundColor: "#ece7db" }}
      >
        <div
          className="text-[1.1rem] font-medium"
          style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "-0.5px" }}
        >
          lawn.
        </div>
        <nav className="flex items-center gap-7">
          {["Practice Areas", "Services", "About", "Contact"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-[#1a1a1a] no-underline uppercase text-[0.8rem] hover:underline"
              style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "1px" }}
            >
              {item}
            </a>
          ))}
          <SignInButton />
        </nav>
      </header>

      {/* ── BENTO GRID ── */}
      <main className="grid grid-cols-4 gap-4 max-w-[1200px] mx-auto" style={{ gridAutoRows: "minmax(180px, auto)" }}>

        {/* HERO — span 2x2 */}
        <div
          className="card col-span-2 row-span-2 border-2 border-[#2b2b2b] p-10 flex flex-col justify-between bg-[#1a1a1a] text-[#f5f0e8]"
        >
          <div>
            <div className="w-16 h-16 border-3 border-[#f5f0e8] rounded-[14px] flex items-center justify-center text-[28px] mb-6">
              &#9878;
            </div>
            <h1
              className="text-[2.6rem] font-bold leading-[1.05] mb-4"
              style={{ letterSpacing: "-1px" }}
            >
              lawn,<br />legal aid<br />when needed.
            </h1>
            <p
              className="text-[0.85rem] leading-relaxed opacity-70 max-w-[340px]"
              style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
            >
              Connecting you with trusted legal professionals for advice, representation, and peace of mind.
            </p>
          </div>
          <div
            className="text-[0.7rem] uppercase opacity-40 mt-auto"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "3px" }}
          >
            Est. 2024 — Legal Services
          </div>
        </div>

        {/* RED ICON GRID — Law Icons */}
        <div className="card col-span-1 row-span-1 border-2 border-[#2b2b2b] grid grid-cols-2 grid-rows-2 bg-[#c0392b] p-0 overflow-hidden">
          {[
            <svg viewBox="0 0 48 48" key="i1"><path d="M24 6v30M14 12h20M10 36h28" /><path d="M14 12l-4 24M34 12l4 24" /></svg>,
            <svg viewBox="0 0 48 48" key="i2"><rect x="12" y="8" width="24" height="32" rx="2" /><line x1="17" y1="16" x2="31" y2="16" /><line x1="17" y1="22" x2="31" y2="22" /><line x1="17" y1="28" x2="25" y2="28" /></svg>,
            <svg viewBox="0 0 48 48" key="i3"><circle cx="24" cy="20" r="10" /><path d="M20 28l-4 14 8-4 8 4-4-14" /></svg>,
            <svg viewBox="0 0 48 48" key="i4"><path d="M14 8h20l-4 12H18L14 8z" /><rect x="20" y="20" width="8" height="20" rx="1" /></svg>,
          ].map((icon, i) => (
            <div key={i} className="icon-cell flex items-center justify-center border border-[rgba(245,240,232,0.2)] p-5">
              {icon}
            </div>
          ))}
        </div>

        {/* CTA — Say Hello */}
        <div
          className="card col-span-1 row-span-1 border-2 border-[#2b2b2b] flex items-center justify-center bg-[#2c3e8c] text-[#f5f0e8] cursor-pointer"
        >
          <span
            className="border-[1.5px] border-[#f5f0e8] px-7 py-2.5 uppercase text-[1rem] hover:bg-[#f5f0e8] hover:text-[#2c3e8c] transition-colors"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "1px" }}
          >
            Get Counsel →
          </span>
        </div>

        {/* SERVICES */}
        <div className="card col-span-1 row-span-1 border-2 border-[#2b2b2b] p-6 bg-[#2c3e8c] text-[#f5f0e8]">
          <div
            className="text-[0.65rem] uppercase mb-4"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "2px", color: "rgba(245,240,232,0.5)" }}
          >
            Practice Areas
          </div>
          <ul className="list-none">
            {["Corporate Law", "Civil Litigation", "Criminal Defense", "Family Law"].map((s) => (
              <li
                key={s}
                className="flex justify-between items-center py-2 border-b border-[rgba(245,240,232,0.15)] last:border-b-0 text-[0.78rem]"
                style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
              >
                {s} <span className="opacity-50">→</span>
              </li>
            ))}
          </ul>
        </div>

        {/* GREY ICON GRID — Law Icons */}
        <div className="card col-span-1 row-span-1 border-2 border-[#2b2b2b] grid grid-cols-2 grid-rows-2 bg-[#9e9e9e] p-0 overflow-hidden">
          {[
            <svg viewBox="0 0 40 40" key="g1"><path d="M20 4v28M12 8h16M8 32h24" /><path d="M12 8l-4 24M28 8l4 24" /></svg>,
            <svg viewBox="0 0 40 40" key="g2"><rect x="10" y="6" width="20" height="28" rx="2" /><line x1="14" y1="12" x2="26" y2="12" /><line x1="14" y1="18" x2="26" y2="18" /><line x1="14" y1="24" x2="20" y2="24" /></svg>,
            <svg viewBox="0 0 40 40" key="g3"><path d="M12 10h16v24H12z" /><path d="M16 10V6h8v4" /><line x1="16" y1="18" x2="24" y2="18" /><line x1="16" y1="24" x2="24" y2="24" /></svg>,
            <svg viewBox="0 0 40 40" key="g4"><circle cx="20" cy="16" r="8" /><path d="M16 22l-2 14 6-3 6 3-2-14" /></svg>,
          ].map((icon, i) => (
            <div key={i} className="icon-cell-grey flex items-center justify-center border border-[rgba(245,240,232,0.15)] p-5">
              {icon}
            </div>
          ))}
        </div>

        {/* TYPOGRAPHY CARD — span 2 rows */}
        <div className="card col-span-1 row-span-2 border-2 border-[#2b2b2b] bg-[#1a1a1a] text-[#f5f0e8] flex flex-col items-center justify-center text-center gap-1 p-6">
          <div className="text-[4.5rem] font-bold leading-none opacity-35">§</div>
          <div className="text-[4.5rem] font-bold leading-none">§</div>
          <div className="text-[4.5rem] font-light leading-none opacity-35">§</div>
          <div
            className="text-[0.65rem] uppercase mt-4"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "2px", color: "rgba(245,240,232,0.4)" }}
          >
            Section of Law
          </div>
        </div>

        {/* TAGLINE — span 2 cols */}
        <div
          className="card col-span-2 row-span-1 border-2 border-[#2b2b2b] flex flex-col justify-center px-10 py-9"
          style={{ backgroundColor: "#ece7db" }}
        >
          <h2 className="text-[1.7rem] font-bold leading-[1.2] mb-2.5" style={{ letterSpacing: "-0.5px" }}>
            Justice, clarity, resolve.
          </h2>
          <p
            className="text-[0.8rem] opacity-60 leading-relaxed"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
          >
            Navigating complex legal landscapes with precision, integrity, and a commitment to protecting your rights at every step.
          </p>
        </div>

        {/* STATS */}
        <div className="card col-span-1 row-span-1 border-2 border-[#2b2b2b] p-6" style={{ backgroundColor: "#ece7db" }}>
          <div
            className="text-[0.65rem] uppercase mb-2"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "2px", color: "#777" }}
          >
            Cases
          </div>
          <div className="text-[3rem] font-bold leading-none" style={{ letterSpacing: "-2px" }}>500+</div>
          <div
            className="text-[0.75rem] opacity-60 mt-2"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
          >
            Successfully resolved
          </div>
        </div>

        {/* TICKER — full width */}
        <div
          className="card col-span-4 border-2 border-[#2b2b2b] p-0 overflow-hidden flex items-center"
          style={{ backgroundColor: "#ece7db", minHeight: "56px", height: "56px" }}
        >
          <div className="ticker-track">
            {[...Array(2)].map((_, j) =>
              ["Litigation", "Contracts", "Compliance", "Mediation", "Advisory", "Advocacy"].map((t, i) => (
                <span
                  key={`${j}-${i}`}
                  className="px-10 opacity-50 uppercase text-[0.85rem]"
                  style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "3px" }}
                >
                  {t} ★
                </span>
              ))
            )}
          </div>
        </div>

        {/* ABOUT */}
        <div className="card col-span-2 row-span-1 border-2 border-[#2b2b2b] p-6 flex items-center gap-7" style={{ backgroundColor: "#ece7db" }}>
          <div className="w-[100px] h-[100px] rounded-full border-2 border-[#2b2b2b] bg-[#b8a88a] flex items-center justify-center text-[2.4rem] shrink-0">
            &#9786;
          </div>
          <div>
            <h3 className="text-[1.1rem] font-semibold mb-1.5">Built on principle.</h3>
            <p
              className="text-[0.78rem] opacity-60 leading-relaxed"
              style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
            >
              A dedicated practice committed to upholding justice. Every case is handled with care, every client treated with respect.
            </p>
          </div>
        </div>

        {/* PROCESS — span 2 cols */}
        <div className="card col-span-2 row-span-1 border-2 border-[#2b2b2b] p-6" style={{ backgroundColor: "#ece7db" }}>
          <div
            className="text-[0.65rem] uppercase mb-4"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "2px", color: "#777" }}
          >
            Process
          </div>
          <div className="flex">
            {[
              { num: "01", title: "Consult", desc: "Understand your situation, rights, and legal options." },
              { num: "02", title: "Strategize", desc: "Build a tailored legal strategy for the best outcome." },
              { num: "03", title: "Resolve", desc: "Represent and advocate until the matter is settled." },
            ].map((step) => (
              <div key={step.num} className="flex-1 border border-[#2b2b2b] p-4 flex flex-col gap-2">
                <div
                  className="text-[0.65rem] opacity-40"
                  style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "2px" }}
                >
                  {step.num}
                </div>
                <div className="font-semibold text-[0.95rem]">{step.title}</div>
                <div
                  className="text-[0.7rem] opacity-50 leading-snug"
                  style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
                >
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DARK ICON GRID — Law Icons */}
        <div className="card col-span-1 row-span-1 border-2 border-[#2b2b2b] grid grid-cols-3 grid-rows-2 bg-[#1a1a1a] p-0 overflow-hidden">
          {[
            <svg viewBox="0 0 24 24" key="d1"><path d="M12 2v16M6 6h12M4 18h16" /><path d="M6 6L4 18M18 6l2 12" /></svg>,
            <svg viewBox="0 0 24 24" key="d2"><rect x="6" y="3" width="12" height="18" rx="1" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="9" y1="12" x2="15" y2="12" /></svg>,
            <svg viewBox="0 0 24 24" key="d3"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>,
            <svg viewBox="0 0 24 24" key="d4"><circle cx="12" cy="10" r="6"/><path d="M9 15l-1 7 4-2 4 2-1-7"/></svg>,
            <svg viewBox="0 0 24 24" key="d5"><path d="M4 4h16v16H4zM4 12h16M12 4v16"/></svg>,
            <svg viewBox="0 0 24 24" key="d6"><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="3"/></svg>,
          ].map((icon, i) => (
            <div key={i} className="icon-cell-dark flex items-center justify-center border border-[rgba(245,240,232,0.08)] p-4">
              {icon}
            </div>
          ))}
        </div>

        {/* CONTROLS */}
        <div className="card col-span-1 row-span-1 border-2 border-[#2b2b2b] bg-[#2b2b2b] text-[#f5f0e8] flex items-center justify-center gap-4">
          <div className="w-[52px] h-[52px] rounded-full border-[1.5px] border-[rgba(245,240,232,0.3)] flex items-center justify-center text-[1.2rem] text-[#f5f0e8] cursor-pointer hover:border-[#f5f0e8] transition-colors">
            &#9664;
          </div>
          <div className="w-[60px] h-[60px] rounded-full border-[1.5px] border-[rgba(245,240,232,0.3)] bg-[rgba(245,240,232,0.1)] flex items-center justify-center text-[1.4rem] text-[#f5f0e8] cursor-pointer hover:border-[#f5f0e8] transition-colors">
            &#9654;
          </div>
          <div className="w-[52px] h-[52px] rounded-full border-[1.5px] border-[rgba(245,240,232,0.3)] flex items-center justify-center text-[0.8rem] text-[#f5f0e8] cursor-pointer hover:border-[#f5f0e8] transition-colors">
            &#9654;&#9654;
          </div>
        </div>

        {/* TEXTURE / WOOD CARD */}
        <div
          className="card col-span-1 row-span-1 border-2 border-[#2b2b2b] flex items-center justify-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #c4a35a 0%, #8b6914 100%)" }}
        >
          <div className="wood-lines absolute inset-0 opacity-15" />
          <svg viewBox="0 0 80 80" className="w-20 h-20 relative z-10" fill="#f5f0e8">
            <path d="M20 55 C20 55 25 30 40 30 C55 30 60 55 60 55 Z M30 55 L30 65 M50 55 L50 65 M36 55 L36 42 L44 42 L44 55" />
          </svg>
        </div>

        {/* GREEN CARD */}
        <div className="card col-span-1 row-span-1 border-2 border-[#2b2b2b] p-6 bg-[#3a6b35] text-[#f5f0e8] flex flex-col justify-between">
          <div
            className="text-[0.7rem] uppercase opacity-60"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "2px" }}
          >
            Established
          </div>
          <div className="text-[2.8rem] font-bold" style={{ letterSpacing: "-2px" }}>2024</div>
          <div
            className="text-[0.7rem] uppercase opacity-60"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "2px" }}
          >
            Legal Practice
          </div>
        </div>

      </main>

      <SignInModal />

      {/* ── FOOTER ── */}
      <footer
        className="flex justify-between items-center border-2 border-[#2b2b2b] px-5 py-4 mt-6 max-w-[1200px] mx-auto"
        style={{ backgroundColor: "#ece7db" }}
      >
        <span
          className="text-[0.72rem] opacity-50"
          style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "1px" }}
        >
          &copy; 2024 lawn. All rights reserved.
        </span>
        <span
          className="text-[0.72rem] opacity-50"
          style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "1px" }}
        >
          Justice with precision.
        </span>
      </footer>
    </div>
  );
}

export default App;
