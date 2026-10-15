import { useState } from "react";
import { SignInButton, SignInModal } from "./modules/auth";
import { CounselModal } from "./components/CounselModal";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BalanceScaleIcon,
  Shield01Icon,
  ShieldCheckIcon,
  File01Icon,
  File02Icon,
  LegalHammerIcon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  LockKeyIcon,
  CourtHouseIcon,
  Tick01Icon,
  Copy01Icon,
  Clock01Icon,
  Briefcase01Icon,
  Search01Icon,
  SparklesIcon,
  Call02Icon,
} from "@hugeicons/core-free-icons";
import StripeIcon from "@thesvg/react/stripe";
import GithubIcon from "@thesvg/react/github";
import GoogleIcon from "@thesvg/react/google";
import "./App.css";

function App() {
  const [isCounselModalOpen, setIsCounselModalOpen] = useState(false);
  const [modalTopic, setModalTopic] = useState("");
  const [heroSearch, setHeroSearch] = useState("");
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Estimator card state
  const [estimatorTier, setEstimatorTier] = useState<"audit" | "demand" | "defense">("audit");

  const openCounsel = (topic = "") => {
    setModalTopic(topic);
    setIsCounselModalOpen(true);
  };

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      openCounsel(heroSearch.trim());
    } else {
      openCounsel();
    }
  };

  const copyPhoneNumber = () => {
    navigator.clipboard?.writeText("+1 (800) 529-5296");
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const estimatorDetails = {
    audit: {
      title: "Contract & Risk Audit",
      turnaround: "24-48 Hours",
      rate: "From $240 fixed",
      description: "Thorough clause-by-clause analysis, redlining, and risk disclosure.",
    },
    demand: {
      title: "Formal Demand Letter",
      turnaround: "Same-Day Dispatch",
      rate: "From $390 fixed",
      description: "Enforceable legal notice drafted on firm letterhead with statutory notice.",
    },
    defense: {
      title: "Active Litigation Defense",
      turnaround: "Priority Immediate",
      rate: "Capped Retainer",
      description: "Dedicated trial counsel for filings, injunctions, and courtroom advocacy.",
    },
  };

  return (
    <div className="canvas-bg min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
      {/* ── TOP NAV ── */}
      <header
        className="bento-card flex flex-wrap justify-between items-center px-6 py-3.5 mb-6 max-w-[1240px] w-full mx-auto"
        style={{ backgroundColor: "#171513" }}
      >
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="text-[1.25rem] font-bold text-[#ece7db] tracking-tight hover:opacity-90 no-underline flex items-center gap-1.5"
          >
            lawn<span className="text-[#c59f52]">.</span>
            <span className="text-[0.62rem] uppercase tracking-widest text-[rgba(236,231,219,0.5)] border border-[#3d3830] px-1.5 py-0.5 ml-1">
              est. 24
            </span>
          </a>

          {/* Live Availability Badge */}
          <div className="hidden sm:flex items-center gap-2 border border-[#332f28] bg-[#100f0d] px-2.5 py-1 text-[0.68rem] text-[rgba(236,231,219,0.7)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 live-indicator" />
            <span className="font-mono">18 Duty Counsel Active</span>
          </div>
        </div>

        <nav className="flex items-center gap-4 sm:gap-6 mt-2 sm:mt-0">
          <button
            onClick={() => openCounsel("General Consultation")}
            className="text-[#ece7db] text-[0.75rem] uppercase tracking-wider hover:text-[#c59f52] transition-colors cursor-pointer bg-transparent border-none"
          >
            Practice Areas
          </button>
          <button
            onClick={() => openCounsel("Urgent Triage")}
            className="text-[#ece7db] text-[0.75rem] uppercase tracking-wider hover:text-[#c59f52] transition-colors cursor-pointer bg-transparent border-none hidden md:inline"
          >
            Intake
          </button>
          <a
            href="#ethics"
            className="text-[#ece7db] text-[0.75rem] uppercase tracking-wider hover:text-[#c59f52] transition-colors no-underline hidden lg:inline"
          >
            Jurisprudence
          </a>
          <SignInButton />
        </nav>
      </header>

      {/* ── BENTO MASTER GRID ── */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1240px] w-full mx-auto flex-grow" style={{ gridAutoRows: "minmax(180px, auto)" }}>
        
        {/* 1. HERO — span 2 cols x 2 rows */}
        <div className="bento-card corner-crosshair col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-2 p-8 sm:p-10 flex flex-col justify-between bg-[#ece7db] text-[#151411]">
          <div>
            {/* Top metadata badge */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(21,20,17,0.15)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border-2 border-[#151411] flex items-center justify-center bg-white/60 shadow-sm">
                  <HugeiconsIcon icon={BalanceScaleIcon} size={26} strokeWidth={1.5} color="#151411" />
                </div>
                <div>
                  <div className="text-[0.68rem] uppercase font-bold tracking-widest text-[#151411]">
                    Lawn Chambers &amp; Legal Aid
                  </div>
                  <div className="text-[0.62rem] uppercase tracking-wider opacity-60 font-mono">
                    Docket Series 2024 / Fed. Circuit
                  </div>
                </div>
              </div>
              <span className="hidden sm:inline-block border border-[rgba(21,20,17,0.3)] px-2 py-0.5 text-[0.62rem] uppercase tracking-wider font-semibold">
                Privileged Access
              </span>
            </div>

            <h1 className="text-[2.4rem] sm:text-[3rem] font-bold leading-[1.04] tracking-tight mb-4 text-[#151411]">
              lawn,<br />legal aid<br />when needed.
            </h1>
            <p className="text-[0.88rem] leading-relaxed text-[rgba(21,20,17,0.78)] max-w-[440px] mb-6">
              Connecting individuals and growing enterprises with accredited attorneys for immediate dispute triage, contract defense, and statutory advocacy.
            </p>

            {/* Interactive Quick Triage Input */}
            <form onSubmit={handleHeroSubmit} className="mb-4">
              <div className="relative flex items-center border-2 border-[#151411] bg-white shadow-sm">
                <span className="absolute left-3.5 text-neutral-500">
                  <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={1.5} />
                </span>
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Describe your legal matter (e.g. lease dispute, NDA breach)..."
                  className="w-full py-3 pl-10 pr-28 text-[0.82rem] bg-transparent outline-none text-[#151411] placeholder:text-neutral-500 font-mono"
                />
                <button
                  type="submit"
                  className="absolute right-1 px-3 py-1.5 bg-[#151411] text-[#ece7db] text-[0.72rem] uppercase tracking-wider font-semibold hover:bg-neutral-800 transition-colors cursor-pointer border-none font-mono"
                >
                  Consult →
                </button>
              </div>
            </form>

            {/* Quick suggested chips */}
            <div className="flex flex-wrap gap-1.5 text-[0.66rem] text-[rgba(21,20,17,0.65)]">
              <span className="font-semibold uppercase tracking-wider text-[rgba(21,20,17,0.8)] mr-1">
                Common Matters:
              </span>
              {[
                "Contract Breach",
                "Tenancy Dispute",
                "Cease & Desist",
                "IP Protection",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => openCounsel(chip)}
                  className="border border-[rgba(21,20,17,0.25)] bg-[rgba(255,255,255,0.4)] px-2 py-0.5 hover:bg-[#151411] hover:text-[#ece7db] transition-colors cursor-pointer font-mono"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-[rgba(21,20,17,0.15)] flex flex-wrap justify-between items-center text-[0.66rem] uppercase tracking-widest text-[rgba(21,20,17,0.6)] font-mono">
            <span>Verified Bar Affiliation</span>
            <span>Zero Retainer Triage</span>
            <span>Rule 1.6 Confidential</span>
          </div>
        </div>

        {/* 2. RAPID RESPONSE / CORE DEFENSE — Crimson */}
        <div className="bento-card corner-crosshair col-span-1 row-span-1 bg-[#8f2e22] text-[#f6f1e8] p-0 flex flex-col justify-between overflow-hidden">
          <div className="px-5 py-3 border-b border-[rgba(246,241,232,0.18)] flex justify-between items-center bg-black/15">
            <span className="text-[0.68rem] uppercase tracking-widest font-bold">
              Core Protections
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-300 animate-ping" />
          </div>
          <div className="grid grid-cols-2 grid-rows-2 flex-grow">
            {[
              { label: "Injunctions", icon: BalanceScaleIcon, tag: "Emergency" },
              { label: "Contracts", icon: File01Icon, tag: "Audit" },
              { label: "Defense", icon: ShieldCheckIcon, tag: "Trial" },
              { label: "Mediation", icon: LegalHammerIcon, tag: "Dispute" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => openCounsel(item.label)}
                className="flex flex-col justify-center items-center p-3 text-center border border-[rgba(246,241,232,0.12)] hover:bg-black/25 transition-colors cursor-pointer bg-transparent text-left"
              >
                <span className="mb-1 text-[#f6f1e8]">
                  <HugeiconsIcon icon={item.icon} size={22} strokeWidth={1.5} color="#f6f1e8" />
                </span>
                <span className="text-[0.74rem] font-bold tracking-tight">{item.label}</span>
                <span className="text-[0.58rem] opacity-70 uppercase tracking-wider">{item.tag}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. CTA — Immediate Counsel (Royal Navy) */}
        <div
          onClick={() => openCounsel("Urgent Counsel Request")}
          className="bento-card corner-crosshair col-span-1 row-span-1 p-6 flex flex-col justify-between bg-[#1f2c68] text-[#f5f0e8] cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="text-[0.66rem] uppercase tracking-widest text-[rgba(245,240,232,0.7)] font-mono">
              Direct Counsel
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 live-indicator" />
          </div>

          <div>
            <div className="text-[1.25rem] font-bold tracking-tight mb-1 group-hover:text-amber-200 transition-colors">
              Dispatch Counsel
            </div>
            <p className="text-[0.72rem] text-[rgba(245,240,232,0.7)] leading-relaxed">
              12-minute average intake response. Confidential preliminary evaluation.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-[rgba(245,240,232,0.2)] pt-3">
            <span className="text-[0.74rem] uppercase font-bold tracking-wider">
              Get Counsel
            </span>
            <span className="w-7 h-7 rounded-full border border-[rgba(245,240,232,0.4)] flex items-center justify-center group-hover:bg-[#f5f0e8] group-hover:text-[#1f2c68] transition-all">
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.5} />
            </span>
          </div>
        </div>

        {/* 4. EXTERNAL LINK — fits.sv7.space */}
        <a
          href="https://fits.sv7.space/"
          target="_blank"
          rel="noreferrer"
          className="bento-card corner-crosshair col-span-1 row-span-1 p-6 flex flex-col justify-between no-underline bg-[#8f2e22] text-[#f5f0e8] group"
        >
          <div className="flex justify-between items-center text-[0.65rem] uppercase tracking-widest text-[rgba(245,240,232,0.65)] font-mono">
            <span>Portfolio / Ecosystem</span>
            <span className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} strokeWidth={1.5} />
            </span>
          </div>
          <div>
            <div className="text-[2.2rem] font-bold tracking-tight mb-0.5">fits ↗</div>
            <div className="text-[0.72rem] text-[rgba(245,240,232,0.75)] font-mono">fits.sv7.space</div>
          </div>
          <div className="text-[0.66rem] uppercase tracking-wider text-[rgba(245,240,232,0.55)]">
            Explore sister projects
          </div>
        </a>

        {/* 5. PRACTICE AREAS — Interactive List */}
        <div className="bento-card corner-crosshair col-span-1 row-span-1 p-5 bg-[#1b254d] text-[#f5f0e8] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-[rgba(245,240,232,0.15)]">
            <span className="text-[0.66rem] uppercase tracking-widest text-[rgba(245,240,232,0.6)] font-mono">
              Practice Areas
            </span>
            <span className="text-[0.6rem] font-mono opacity-60">4 Sectors</span>
          </div>
          <ul className="list-none p-0 m-0 space-y-1.5">
            {[
              { name: "Corporate Law", count: "18 Attorneys" },
              { name: "Civil Litigation", count: "24 Attorneys" },
              { name: "IP & Trademark", count: "14 Attorneys" },
              { name: "Employment & Labor", count: "11 Attorneys" },
            ].map((s) => (
              <li key={s.name}>
                <button
                  onClick={() => openCounsel(s.name)}
                  className="w-full flex justify-between items-center py-1 px-1.5 hover:bg-white/10 transition-colors text-left cursor-pointer bg-transparent border-none text-[#f5f0e8]"
                >
                  <span className="text-[0.76rem]">{s.name}</span>
                  <span className="text-[0.62rem] opacity-60 font-mono group-hover:opacity-100">
                    {s.count} →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 6. PRIVILEGE & SECURITY VAULT — Warm Slate */}
        <div className="bento-card corner-crosshair col-span-1 row-span-1 p-5 bg-[#3d3830] text-[#ece7db] flex flex-col justify-between">
          <div className="flex justify-between items-center pb-2 border-b border-[rgba(236,231,219,0.15)]">
            <span className="text-[0.66rem] uppercase tracking-widest text-[#c59f52] font-mono">
              Privilege Vault
            </span>
            <HugeiconsIcon icon={LockKeyIcon} size={14} strokeWidth={1.5} color="#c59f52" />
          </div>

          <div className="grid grid-cols-2 gap-2.5 my-auto">
            <div className="border border-[rgba(236,231,219,0.12)] p-2 bg-black/20">
              <HugeiconsIcon icon={Shield01Icon} size={15} strokeWidth={1.5} color="#c59f52" className="mb-1" />
              <div className="text-[0.68rem] font-bold">Rule 1.6 Privilege</div>
              <div className="text-[0.58rem] opacity-60">Protected comms</div>
            </div>
            <div className="border border-[rgba(236,231,219,0.12)] p-2 bg-black/20">
              <HugeiconsIcon icon={LockKeyIcon} size={15} strokeWidth={1.5} color="#c59f52" className="mb-1" />
              <div className="text-[0.68rem] font-bold">256-bit AES</div>
              <div className="text-[0.58rem] opacity-60">Client vault</div>
            </div>
            <div className="border border-[rgba(236,231,219,0.12)] p-2 bg-black/20">
              <HugeiconsIcon icon={CourtHouseIcon} size={15} strokeWidth={1.5} color="#c59f52" className="mb-1" />
              <div className="text-[0.68rem] font-bold">State Bar Admitted</div>
              <div className="text-[0.58rem] opacity-60">Verified counsel</div>
            </div>
            <div className="border border-[rgba(236,231,219,0.12)] p-2 bg-black/20">
              <HugeiconsIcon icon={File02Icon} size={15} strokeWidth={1.5} color="#c59f52" className="mb-1" />
              <div className="text-[0.68rem] font-bold">Strict NDA</div>
              <div className="text-[0.58rem] opacity-60">Standard mutual</div>
            </div>
          </div>
        </div>

        {/* 7. TYPOGRAPHY CARD — Jurisprudence & Section § (span 1 col x 2 rows) */}
        <div
          id="ethics"
          className="bento-card corner-crosshair col-span-1 row-span-2 bg-[#ece7db] text-[#151411] flex flex-col justify-between p-6 sm:p-7"
        >
          <div className="flex justify-between items-center pb-2 border-b border-[rgba(21,20,17,0.15)]">
            <span className="text-[0.66rem] uppercase tracking-widest font-mono font-bold text-[#151411]">
              Jurisprudence
            </span>
            <span className="text-[0.62rem] font-mono opacity-60">Tit. 28 § 1331</span>
          </div>

          <div className="my-auto text-center py-6">
            <div className="text-[4rem] font-bold leading-none opacity-20 select-none">
              §
            </div>
            <div className="text-[4.8rem] font-bold leading-none select-none text-[#151411] -my-2">
              §
            </div>
            <div className="text-[4rem] font-light leading-none opacity-25 select-none">
              §
            </div>
            <div className="mt-4 text-[0.74rem] italic font-serif text-[rgba(21,20,17,0.8)]">
              &ldquo;Lex semper dabit remedium&rdquo;
            </div>
            <div className="text-[0.6rem] uppercase tracking-widest text-[rgba(21,20,17,0.5)] mt-1 font-mono">
              The law always provides a remedy
            </div>
          </div>

          <div className="pt-3 border-t border-[rgba(21,20,17,0.15)] text-[0.65rem] opacity-75 font-mono text-center">
            Adjudication &amp; Counsel Desk
          </div>
        </div>

        {/* 8. TAGLINE / ETHOS — span 2 cols x 1 row */}
        <div
          className="bento-card corner-crosshair col-span-1 md:col-span-2 lg:col-span-2 row-span-1 flex flex-col justify-between p-7 sm:p-8"
          style={{ backgroundColor: "#171513" }}
        >
          <div>
            <div className="text-[0.65rem] uppercase tracking-widest text-[#c59f52] font-mono mb-2">
              The Guiding Principle
            </div>
            <h2 className="text-[1.7rem] sm:text-[1.9rem] font-bold leading-tight tracking-tight text-[#ece7db] mb-2.5">
              Justice, clarity, resolve.
            </h2>
            <p className="text-[0.82rem] text-[rgba(236,231,219,0.7)] leading-relaxed max-w-xl">
              Navigating intricate statutory landscapes with uncompromising precision, transparent fees, and an unwavering commitment to defending your rights at every step.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#332f28] mt-4 text-[0.68rem] text-[rgba(236,231,219,0.6)] font-mono">
            <div>[01] Direct Attorney Access</div>
            <div>[02] Capped Cost Transparency</div>
            <div>[03] Rapid Dispute Defense</div>
          </div>
        </div>

        {/* 9. STATS & RESOLUTIONS */}
        <div
          className="bento-card corner-crosshair col-span-1 row-span-1 p-6 flex flex-col justify-between"
          style={{ backgroundColor: "#171513" }}
        >
          <div className="flex justify-between items-center text-[0.65rem] uppercase tracking-widest text-[rgba(236,231,219,0.5)] font-mono">
            <span>Matters Resolved</span>
            <HugeiconsIcon icon={Briefcase01Icon} size={14} strokeWidth={1.5} color="#c59f52" />
          </div>

          <div>
            <div className="text-[3.2rem] font-bold leading-none tracking-tighter text-[#ece7db]">
              500<span className="text-[#c59f52]">+</span>
            </div>
            <div className="text-[0.74rem] text-[rgba(236,231,219,0.7)] mt-2">
              Commercial &amp; Civil Disputes Settled
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[#332f28] text-[0.65rem] font-mono text-[rgba(236,231,219,0.5)]">
            <span>99.2% Satisfaction</span>
            <span>$48M+ Protected</span>
          </div>
        </div>

        {/* 10. TICKER — Full width marquee */}
        <div
          className="bento-card col-span-1 md:col-span-2 lg:col-span-4 p-0 overflow-hidden flex items-center"
          style={{ backgroundColor: "#141210", minHeight: "52px", height: "52px" }}
        >
          <div className="ticker-wrapper">
            <div className="ticker-track">
              {[...Array(2)].map((_, j) =>
                [
                  "Commercial Litigation",
                  "Contract Drafting & Audit",
                  "Statutory Compliance",
                  "Alternative Dispute Resolution",
                  "Appellate Advocacy",
                  "Intellectual Property Defense",
                  "Employment & Executive Severance",
                  "Emergency Injunctive Relief",
                ].map((t, i) => (
                  <span
                    key={`${j}-${i}`}
                    className="px-8 text-[0.8rem] uppercase font-mono tracking-widest text-[rgba(236,231,219,0.55)] flex items-center gap-3"
                  >
                    <span>{t}</span>
                    <span className="text-[#c59f52] text-xs">★</span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 11. ABOUT / EMBOSSED SEAL — span 2 cols x 1 row */}
        <div
          className="bento-card corner-crosshair col-span-1 md:col-span-2 lg:col-span-2 row-span-1 p-6 sm:p-7 flex items-center gap-6"
          style={{ backgroundColor: "#171513" }}
        >
          {/* Engraved Emblem Seal */}
          <div className="w-[88px] h-[88px] rounded-full border-2 border-[#c59f52] bg-gradient-to-br from-[#2a241b] to-[#171513] flex flex-col items-center justify-center text-center shrink-0 shadow-inner">
            <HugeiconsIcon icon={LegalHammerIcon} size={26} strokeWidth={1.5} color="#c59f52" className="mb-1" />
            <span className="text-[0.52rem] uppercase font-bold tracking-widest text-[#ece7db]">
              LAWN SEAL
            </span>
          </div>

          <div>
            <div className="text-[0.65rem] uppercase tracking-widest text-[#c59f52] font-mono mb-1">
              Chambers Ethos
            </div>
            <h3 className="text-[1.2rem] font-semibold text-[#ece7db] mb-1.5">
              Built on principle. Grounded in precedent.
            </h3>
            <p className="text-[0.78rem] text-[rgba(236,231,219,0.68)] leading-relaxed">
              Every client receives uncompromising attention. We combine classic legal rigor with modern dispute intelligence to deliver clean, decisive outcomes.
            </p>
          </div>
        </div>

        {/* 12. PROCESS — 3-Phase Timeline (span 2 cols x 1 row) */}
        <div
          className="bento-card corner-crosshair col-span-1 md:col-span-2 lg:col-span-2 row-span-1 p-6 sm:p-7 flex flex-col justify-between"
          style={{ backgroundColor: "#171513" }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-[0.65rem] uppercase tracking-widest text-[#c59f52] font-mono">
              Expedited Defense Pipeline
            </span>
            <span className="text-[0.62rem] font-mono opacity-50">3 Phases</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                num: "01",
                title: "Intake Triage",
                desc: "Confidential merit check and conflict verification within hours.",
              },
              {
                num: "02",
                title: "Strategy Roadmap",
                desc: "Fixed-scope retainer and decisive strategic blueprint.",
              },
              {
                num: "03",
                title: "Vigorous Defense",
                desc: "Aggressive negotiation, filings, or courtroom advocacy.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="border border-[#332f28] bg-[#12110f] p-3 flex flex-col gap-1.5 hover:border-[#4f483d] transition-colors"
              >
                <div className="text-[0.62rem] font-mono text-[#c59f52] font-semibold">
                  PHASE {step.num}
                </div>
                <div className="font-semibold text-[0.84rem] text-[#ece7db]">{step.title}</div>
                <div className="text-[0.68rem] text-[rgba(236,231,219,0.55)] leading-snug">
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 13. DOCUMENT VAULT — 6 Quick Badges (Parchment) */}
        <div className="bento-card corner-crosshair col-span-1 row-span-1 bg-[#ece7db] text-[#151411] p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center pb-2 border-b border-[rgba(21,20,17,0.15)]">
            <span className="text-[0.65rem] uppercase tracking-widest font-mono font-bold">
              Standard Vault
            </span>
            <HugeiconsIcon icon={SparklesIcon} size={15} strokeWidth={1.5} color="#151411" />
          </div>

          <div className="grid grid-cols-2 gap-1.5 my-auto">
            {[
              "Mutual NDA",
              "Cease & Desist",
              "IP Assignment",
              "Service Agrmt",
              "Lease Addendum",
              "Demand Notice",
            ].map((doc) => (
              <button
                key={doc}
                type="button"
                onClick={() => openCounsel(`Document: ${doc}`)}
                className="border border-[rgba(21,20,17,0.2)] bg-white/50 p-1.5 text-left hover:bg-[#151411] hover:text-[#ece7db] transition-colors cursor-pointer"
              >
                <div className="text-[0.68rem] font-semibold truncate">{doc}</div>
                <div className="text-[0.55rem] opacity-60 uppercase font-mono">Standardized</div>
              </button>
            ))}
          </div>

          <div className="text-[0.62rem] opacity-65 font-mono text-center pt-1 border-t border-[rgba(21,20,17,0.15)]">
            Attorney-Drafted Templates
          </div>
        </div>

        {/* 14. INTERACTIVE CASE FEE ESTIMATOR WIDGET */}
        <div
          className="bento-card corner-crosshair col-span-1 row-span-1 p-5 flex flex-col justify-between"
          style={{ backgroundColor: "#171513" }}
        >
          <div className="flex justify-between items-center pb-2 border-b border-[#332f28]">
            <span className="text-[0.65rem] uppercase tracking-widest text-[#c59f52] font-mono">
              Fee Transparency
            </span>
            <HugeiconsIcon icon={Clock01Icon} size={14} strokeWidth={1.5} color="#c59f52" />
          </div>

          {/* Tier buttons */}
          <div className="grid grid-cols-3 gap-1 bg-[#100f0d] p-1 border border-[#332f28]">
            {[
              { id: "audit", label: "Audit" },
              { id: "demand", label: "Demand" },
              { id: "defense", label: "Defense" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setEstimatorTier(t.id as any)}
                className={`py-1 text-[0.66rem] uppercase tracking-wider font-mono cursor-pointer transition-colors border-none ${
                  estimatorTier === t.id
                    ? "bg-[#c59f52] text-[#151411] font-bold"
                    : "bg-transparent text-[rgba(236,231,219,0.5)] hover:text-[#ece7db]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Dynamic details */}
          <div className="my-1">
            <div className="text-[0.84rem] font-bold text-[#ece7db] mb-0.5">
              {estimatorDetails[estimatorTier].title}
            </div>
            <div className="flex justify-between items-center text-[0.72rem] font-mono text-[#c59f52] mb-1">
              <span>{estimatorDetails[estimatorTier].rate}</span>
              <span className="text-[rgba(236,231,219,0.55)]">
                {estimatorDetails[estimatorTier].turnaround}
              </span>
            </div>
            <p className="text-[0.66rem] text-[rgba(236,231,219,0.6)] leading-tight">
              {estimatorDetails[estimatorTier].description}
            </p>
          </div>

          <button
            onClick={() => openCounsel(estimatorDetails[estimatorTier].title)}
            className="w-full py-1.5 border border-[#3d3830] text-[0.68rem] uppercase tracking-wider text-[#ece7db] hover:border-[#c59f52] hover:text-[#c59f52] transition-colors cursor-pointer bg-transparent font-mono"
          >
            Select Scope →
          </button>
        </div>

        {/* 15. OAK CHAMBERS / BENCH & BAR (Walnut texture) */}
        <div className="bento-card corner-crosshair col-span-1 row-span-1 wood-card-gradient p-5 flex flex-col justify-between overflow-hidden text-[#f6f1e8]">
          <div className="wood-lines absolute inset-0 opacity-25 pointer-events-none" />

          <div className="flex justify-between items-center relative z-10 pb-2 border-b border-[rgba(255,255,255,0.15)]">
            <span className="text-[0.65rem] uppercase tracking-widest text-amber-200 font-mono">
              Bench &amp; Bar
            </span>
            <HugeiconsIcon icon={CourtHouseIcon} size={16} strokeWidth={1.5} color="#fde68a" />
          </div>

          <div className="relative z-10 my-auto py-2">
            <div className="text-[1.2rem] font-bold tracking-tight text-white mb-1">
              Circuit Standing
            </div>
            <p className="text-[0.7rem] text-[rgba(255,255,255,0.8)] leading-relaxed">
              Practitioners admitted before Federal District Courts, State Supreme Courts, and Arbitration Tribunals.
            </p>
          </div>

          <div className="relative z-10 text-[0.62rem] uppercase tracking-widest text-amber-200/80 font-mono">
            Upholding Due Process
          </div>
        </div>

        {/* 16. DISPATCH DESK & DIRECT HOTLINE (Forest Green) */}
        <div className="bento-card corner-crosshair col-span-1 row-span-1 bg-[#224724] text-[#f5f0e8] p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center pb-2 border-b border-[rgba(245,240,232,0.18)]">
            <span className="text-[0.65rem] uppercase tracking-widest font-mono text-emerald-200">
              Duty Hotline
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 live-indicator" />
              <span className="text-[0.6rem] uppercase tracking-wider font-mono">24/7 Desk</span>
            </div>
          </div>

          <div className="my-auto py-2">
            <div className="text-[2.2rem] font-bold leading-none tracking-tight mb-2">
              24/7
            </div>
            <button
              onClick={copyPhoneNumber}
              className="flex items-center gap-2 text-[0.78rem] font-mono border border-[rgba(245,240,232,0.3)] bg-black/20 px-2.5 py-1.5 hover:bg-black/35 transition-colors cursor-pointer w-full text-[#f5f0e8]"
            >
              {copiedPhone ? (
                <>
                  <HugeiconsIcon icon={Tick01Icon} size={14} strokeWidth={1.5} color="#86efac" />
                  <span className="text-emerald-200">Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={Copy01Icon} size={14} strokeWidth={1.5} />
                  <span>+1 (800) 529-LAWN</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[0.62rem] text-emerald-200/80 font-mono">
            <HugeiconsIcon icon={Call02Icon} size={12} strokeWidth={1.5} />
            Emergency Injunctions &amp; Custody
          </div>
        </div>

      </main>

      {/* ── MODALS ── */}
      <SignInModal />
      <CounselModal
        isOpen={isCounselModalOpen}
        onClose={() => setIsCounselModalOpen(false)}
        initialTopic={modalTopic}
      />

      {/* ── BENTO FOOTER ── */}
      <footer
        className="bento-card flex flex-col md:flex-row justify-between items-center px-6 py-4 mt-8 max-w-[1240px] w-full mx-auto gap-4 text-[0.72rem] text-[rgba(236,231,219,0.55)] font-mono"
        style={{ backgroundColor: "#171513" }}
      >
        <div className="flex items-center gap-4">
          <span className="text-[#ece7db] font-bold">lawn.</span>
          <span>&copy; {new Date().getFullYear()} Lawn Legal Aid. All rights reserved.</span>
        </div>

        {/* Integrations & Trust from thesvg.org */}
        <div className="flex items-center gap-4 text-[rgba(236,231,219,0.6)]">
          <span className="text-[0.65rem] uppercase tracking-wider text-[rgba(236,231,219,0.4)]">Verified Stack:</span>
          <span title="Stripe Verified Retainers" className="opacity-75 hover:opacity-100 transition-opacity">
            <StripeIcon width={28} height={14} />
          </span>
          <span title="Google Workspace SSO" className="opacity-75 hover:opacity-100 transition-opacity">
            <GoogleIcon width={14} height={14} />
          </span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            title="Open Legal Framework"
            className="text-[rgba(236,231,219,0.6)] hover:text-[#ece7db] transition-colors"
          >
            <GithubIcon width={14} height={14} />
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span>Rule 1.6 Privilege Maintained</span>
          <span className="text-[#c59f52]">Justice with precision.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
