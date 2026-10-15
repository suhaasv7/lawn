import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Tick01Icon,
  Shield01Icon,
  Clock01Icon,
  SentIcon,
  BalanceScaleIcon,
} from "@hugeicons/core-free-icons";

interface CounselModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

export const CounselModal: React.FC<CounselModalProps> = ({
  isOpen,
  onClose,
  initialTopic = "",
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [category, setCategory] = useState("Corporate & Commercial");
  const [urgency, setUrgency] = useState<"urgent" | "standard" | "scheduled">("urgent");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setTopic("");
    setEmail("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: "rgba(10, 9, 8, 0.82)" }}
      onClick={handleReset}
    >
      <div
        className="relative border-2 border-[#453e34] p-8 max-w-[520px] w-full text-[#ece7db] shadow-2xl"
        style={{ backgroundColor: "#171513" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner marks */}
        <span className="absolute top-2 left-2 text-[#453e34] text-xs font-mono">+</span>
        <span className="absolute top-2 right-2 text-[#453e34] text-xs font-mono">+</span>
        <span className="absolute bottom-2 left-2 text-[#453e34] text-xs font-mono">+</span>
        <span className="absolute bottom-2 right-2 text-[#453e34] text-xs font-mono">+</span>

        <button
          onClick={handleReset}
          className="absolute top-5 right-5 text-[#ece7db] opacity-60 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none"
          aria-label="Close modal"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} />
        </button>

        {!submitted ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 live-indicator" />
              <span className="text-[0.7rem] uppercase tracking-widest text-[#c59f52]">
                Verified Attorney Dispatch
              </span>
            </div>

            <h2 className="text-[1.6rem] font-bold tracking-tight mb-2 text-[#ece7db]">
              Request Counsel Triage
            </h2>
            <p className="text-[0.8rem] text-[rgba(236,231,219,0.65)] mb-6 leading-relaxed">
              Submit your matter for confidential evaluation. A qualified attorney will review your facts under strict attorney-client privilege.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[0.7rem] uppercase tracking-wider text-[rgba(236,231,219,0.7)] mb-1.5">
                  Practice Area
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#100f0d] border border-[#3d3830] px-3.5 py-2.5 text-[0.85rem] text-[#ece7db] focus:border-[#c59f52] focus:outline-none transition-colors"
                >
                  <option value="Corporate & Commercial">Corporate & Commercial Law</option>
                  <option value="Civil & Commercial Litigation">Civil & Commercial Litigation</option>
                  <option value="Contract & Lease Dispute">Contract & Lease Dispute</option>
                  <option value="Intellectual Property">Intellectual Property & Patents</option>
                  <option value="Employment & Labor">Employment & Non-Compete</option>
                  <option value="Emergency Injunction">Emergency Injunction / Cease & Desist</option>
                </select>
              </div>

              <div>
                <label className="block text-[0.7rem] uppercase tracking-wider text-[rgba(236,231,219,0.7)] mb-1.5">
                  Matter Summary
                </label>
                <textarea
                  required
                  rows={3}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Outline key facts, deadlines, or claims involved..."
                  className="w-full bg-[#100f0d] border border-[#3d3830] p-3 text-[0.85rem] text-[#ece7db] focus:border-[#c59f52] focus:outline-none transition-colors resize-none placeholder:text-[rgba(236,231,219,0.3)] font-mono"
                />
              </div>

              <div>
                <label className="block text-[0.7rem] uppercase tracking-wider text-[rgba(236,231,219,0.7)] mb-1.5">
                  Priority Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "urgent", label: "Immediate (< 2 hrs)", icon: Clock01Icon },
                    { id: "standard", label: "Today (< 24 hrs)", icon: BalanceScaleIcon },
                    { id: "scheduled", label: "Routine Intake", icon: Shield01Icon },
                  ].map((p) => {
                    const isSelected = urgency === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setUrgency(p.id as any)}
                        className={`border p-2 text-left cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#c59f52] bg-[rgba(197,159,82,0.12)] text-[#f6f2e8]"
                            : "border-[#332f28] bg-[#12110f] text-[rgba(236,231,219,0.6)] hover:border-[#453e34]"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <HugeiconsIcon
                            icon={p.icon}
                            size={14}
                            strokeWidth={1.5}
                            color={isSelected ? "#c59f52" : "#8b857a"}
                          />
                          <span className="text-[0.68rem] font-bold uppercase">{p.id}</span>
                        </div>
                        <div className="text-[0.65rem] opacity-75">{p.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[0.7rem] uppercase tracking-wider text-[rgba(236,231,219,0.7)] mb-1.5">
                  Your Direct Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="counsel@yourdomain.com"
                  className="w-full bg-[#100f0d] border border-[#3d3830] px-3.5 py-2.5 text-[0.85rem] text-[#ece7db] focus:border-[#c59f52] focus:outline-none transition-colors placeholder:text-[rgba(236,231,219,0.3)] font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#ece7db] text-[#151411] font-bold text-[0.85rem] uppercase tracking-wider py-3 border border-[#ece7db] hover:bg-transparent hover:text-[#ece7db] transition-colors flex items-center justify-center gap-2 cursor-pointer font-mono"
                >
                  <HugeiconsIcon icon={SentIcon} size={16} strokeWidth={1.5} />
                  Dispatch To Duty Counsel
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[0.68rem] text-[rgba(236,231,219,0.5)] pt-1">
                <HugeiconsIcon icon={Shield01Icon} size={14} strokeWidth={1.5} color="#c59f52" />
                Protected by Rule 1.6 Attorney-Client Confidentiality
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-900/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4">
              <HugeiconsIcon icon={Tick01Icon} size={30} strokeWidth={1.5} />
            </div>
            <h3 className="text-[1.4rem] font-bold mb-2 text-[#ece7db]">
              Intake Docket Created
            </h3>
            <p className="text-[0.8rem] text-[rgba(236,231,219,0.7)] max-w-sm mx-auto mb-6 leading-relaxed">
              Matter reference <span className="text-[#c59f52] font-mono">#LWN-{Math.floor(100000 + Math.random() * 900000)}</span>. 
              Our on-call attorney for <span className="text-[#ece7db] font-semibold">{category}</span> has received your brief and will reach out at <span className="underline">{email}</span>.
            </p>
            <button
              onClick={handleReset}
              className="border border-[#ece7db] px-6 py-2 uppercase text-[0.78rem] tracking-wider hover:bg-[#ece7db] hover:text-[#151411] transition-colors cursor-pointer font-mono"
            >
              Return to Chambers
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
