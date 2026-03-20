import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--zd-bg-deep)" }}
    >
      <div className="text-center">
        <h1
          className="text-3xl font-light tracking-widest mb-2"
          style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
        >
          <span style={{ color: "#C8A428" }}>ZEN</span>{" "}
          <span style={{ color: "#F0E4C0" }}>DHANDHO</span>
          <span className="text-xs align-super ml-0.5" style={{ color: "#8A7A58" }}>&reg;</span>
        </h1>
        <p
          className="text-sm tracking-widest uppercase mb-8"
          style={{ color: "#8A7A58", fontFamily: "var(--font-jost), 'Jost', sans-serif" }}
        >
          Stock Analyzer
        </p>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-[#0F2014] border border-[rgba(200,164,40,0.2)]",
            },
          }}
        />
      </div>
    </div>
  );
}
