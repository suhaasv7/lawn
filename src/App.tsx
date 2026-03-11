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
          iconwerk.
        </div>
        <nav className="flex items-center gap-7">
          {["Work", "Services", "About", "Contact"].map((item) => (
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
              &#9678;
            </div>
            <h1
              className="text-[2.6rem] font-bold leading-[1.05] mb-4"
              style={{ letterSpacing: "-1px" }}
            >
              iconwerk,<br />custom icon<br />design.
            </h1>
            <p
              className="text-[0.85rem] leading-relaxed opacity-70 max-w-[340px]"
              style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
            >
              Using the latest technology to build future-proof systems that also speak to the heart.
            </p>
          </div>
          <div
            className="text-[0.7rem] uppercase opacity-40 mt-auto"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "3px" }}
          >
            Est. 2019 — Berlin, DE
          </div>
        </div>

        {/* RED ICON GRID — 2x2 */}
        <div className="card col-span-1 row-span-1 border-2 border-[#2b2b2b] grid grid-cols-2 grid-rows-2 bg-[#c0392b] p-0 overflow-hidden">
          {[
            <svg viewBox="0 0 48 48" key="i1"><path d="M12 36c0-6 4-10 8-14s8-10 8-16" /><circle cx="32" cy="10" r="6" /></svg>,
            <svg viewBox="0 0 48 48" key="i2"><circle cx="24" cy="24" r="10" /><line x1="24" y1="6" x2="24" y2="14" /><line x1="24" y1="34" x2="24" y2="42" /><line x1="6" y1="24" x2="14" y2="24" /><line x1="34" y1="24" x2="42" y2="24" /></svg>,
            <svg viewBox="0 0 48 48" key="i3"><path d="M8 38 L24 8 L40 38 Z" /><line x1="24" y1="18" x2="24" y2="28" /><circle cx="24" cy="33" r="1.5" /></svg>,
            <svg viewBox="0 0 48 48" key="i4"><rect x="8" y="8" width="32" height="32" rx="4" /><path d="M16 24h16M24 16v16" /></svg>,
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
            Say Hello →
          </span>
        </div>

        {/* SERVICES */}
        <div className="card col-span-1 row-span-1 border-2 border-[#2b2b2b] p-6 bg-[#2c3e8c] text-[#f5f0e8]">
          <div
            className="text-[0.65rem] uppercase mb-4"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "2px", color: "rgba(245,240,232,0.5)" }}
          >
            Services
          </div>
          <ul className="list-none">
            {["Icon Systems", "UI/UX Design", "Brand Identity", "Illustration"].map((s) => (
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

        {/* GREY ICON GRID — 2x2 */}
        <div className="card col-span-1 row-span-1 border-2 border-[#2b2b2b] grid grid-cols-2 grid-rows-2 bg-[#9e9e9e] p-0 overflow-hidden">
          {[
            <svg viewBox="0 0 40 40" key="g1"><path d="M8 20 Q20 4 32 20 Q20 36 8 20Z" /></svg>,
            <svg viewBox="0 0 40 40" key="g2"><circle cx="20" cy="20" r="12" /><circle cx="20" cy="20" r="4" /></svg>,
            <svg viewBox="0 0 40 40" key="g3"><path d="M10 30 Q10 10 20 10 Q30 10 30 30" /><line x1="20" y1="10" x2="20" y2="30" /></svg>,
            <svg viewBox="0 0 40 40" key="g4"><rect x="8" y="8" width="24" height="24" rx="12" /><path d="M16 20h8M20 16v8" /></svg>,
          ].map((icon, i) => (
            <div key={i} className="icon-cell-grey flex items-center justify-center border border-[rgba(245,240,232,0.15)] p-5">
              {icon}
            </div>
          ))}
        </div>

        {/* TYPOGRAPHY CARD — span 2 rows */}
        <div className="card col-span-1 row-span-2 border-2 border-[#2b2b2b] bg-[#1a1a1a] text-[#f5f0e8] flex flex-col items-center justify-center text-center gap-1 p-6">
          <div className="text-[4.5rem] font-bold leading-none opacity-35">a</div>
          <div className="text-[4.5rem] font-bold leading-none">a</div>
          <div className="text-[4.5rem] font-light leading-none opacity-35">a</div>
          <div
            className="text-[0.65rem] uppercase mt-4"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "2px", color: "rgba(245,240,232,0.4)" }}
          >
            Typeface Preview
          </div>
        </div>

        {/* TAGLINE — span 2 cols */}
        <div
          className="card col-span-2 row-span-1 border-2 border-[#2b2b2b] flex flex-col justify-center px-10 py-9"
          style={{ backgroundColor: "#ece7db" }}
        >
          <h2 className="text-[1.7rem] font-bold leading-[1.2] mb-2.5" style={{ letterSpacing: "-0.5px" }}>
            Simple, clear, useful.
          </h2>
          <p
            className="text-[0.8rem] opacity-60 leading-relaxed"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
          >
            Future-proof icon systems that speak the universal language of clarity, designed with craft and delivered with precision.
          </p>
        </div>

        {/* STATS */}
        <div className="card col-span-1 row-span-1 border-2 border-[#2b2b2b] p-6" style={{ backgroundColor: "#ece7db" }}>
          <div
            className="text-[0.65rem] uppercase mb-2"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "2px", color: "#777" }}
          >
            Projects
          </div>
          <div className="text-[3rem] font-bold leading-none" style={{ letterSpacing: "-2px" }}>240+</div>
          <div
            className="text-[0.75rem] opacity-60 mt-2"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
          >
            Completed across 18 countries
          </div>
        </div>

        {/* TICKER — full width */}
        <div
          className="card col-span-4 border-2 border-[#2b2b2b] p-0 overflow-hidden flex items-center"
          style={{ backgroundColor: "#ece7db", minHeight: "56px", height: "56px" }}
        >
          <div className="ticker-track">
            {[...Array(2)].map((_, j) =>
              ["Icons", "Systems", "Branding", "UI Design", "Illustration", "Consulting"].map((t, i) => (
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
            <h3 className="text-[1.1rem] font-semibold mb-1.5">Made with intention.</h3>
            <p
              className="text-[0.78rem] opacity-60 leading-relaxed"
              style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
            >
              A small studio with a big love for pixel-perfect iconography. Every glyph is hand-crafted, every system is built to scale.
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
              { num: "01", title: "Discover", desc: "Understand the brand, the product, and the users." },
              { num: "02", title: "Design", desc: "Craft every glyph with purpose and consistency." },
              { num: "03", title: "Deliver", desc: "Production-ready assets in every format you need." },
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

        {/* DARK ICON GRID — 3x2 */}
        <div className="card col-span-1 row-span-1 border-2 border-[#2b2b2b] grid grid-cols-3 grid-rows-2 bg-[#1a1a1a] p-0 overflow-hidden">
          {[
            <svg viewBox="0 0 24 24" key="d1"><path d="M12 2C8 2 4 6 4 10c0 6 8 12 8 12s8-6 8-12c0-4-4-8-8-8z"/></svg>,
            <svg viewBox="0 0 24 24" key="d2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg>,
            <svg viewBox="0 0 24 24" key="d3"><path d="M3 12l9-9 9 9M5 10v10h14V10"/></svg>,
            <svg viewBox="0 0 24 24" key="d4"><path d="M12 3v18M3 12h18"/></svg>,
            <svg viewBox="0 0 24 24" key="d5"><path d="M4 4h16v16H4zM4 12h16M12 4v16"/></svg>,
            <svg viewBox="0 0 24 24" key="d6"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>,
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
            Year Founded
          </div>
          <div className="text-[2.8rem] font-bold" style={{ letterSpacing: "-2px" }}>2019</div>
          <div
            className="text-[0.7rem] uppercase opacity-60"
            style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "2px" }}
          >
            Berlin, Germany
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
          &copy; 2024 iconwerk. All rights reserved.
        </span>
        <span
          className="text-[0.72rem] opacity-50"
          style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "1px" }}
        >
          Crafted with precision.
        </span>
      </footer>
    </div>
  );
}

export default App;
