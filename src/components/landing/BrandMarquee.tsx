import { useState } from "react";

const brands = [
  { name: "MoYu", logo: "https://logo.clearbit.com/moyucube.com" },
  { name: "GAN", logo: "https://logo.clearbit.com/gancube.com" },
  { name: "QY Toys", logo: "https://logo.clearbit.com/qytoys.com" },
  { name: "BLVCK Paris", logo: null },
  { name: "GoCube", logo: "https://logo.clearbit.com/gocube.com" },
  { name: "Energize Lab", logo: "https://logo.clearbit.com/energizelab.com" },
  { name: "Ocoopa", logo: null },
  { name: "OLIGHT", logo: "https://logo.clearbit.com/olightstore.com" },
  { name: "LIVING.AI", logo: null },
  { name: "CARD MAFIA", logo: null },
];

const allBrands = [...brands, ...brands];

const LetterAvatar = ({ name }: { name: string }) => (
  <span style={{
    width: 32, height: 32, borderRadius: 6,
    background: "#00d4d4", color: "#000",
    fontWeight: 700, fontSize: 16,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  }}>
    {name.charAt(0)}
  </span>
);

const BrandLogo = ({ name, logo }: { name: string; logo: string | null }) => {
  const [failed, setFailed] = useState(false);
  if (!logo || failed) return <LetterAvatar name={name} />;
  return (
    <img
      src={logo} alt={name} width={32} height={32}
      style={{ borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
      onError={() => setFailed(true)}
    />
  );
};

const BrandMarquee = () => (
  <section style={{ padding: "48px 0", background: "transparent" }}>
    <p style={{
      textAlign: "center", color: "#888", fontSize: "14px",
      marginBottom: "32px", letterSpacing: "1px", textTransform: "uppercase",
    }}>
      Trusted by the world's top cube brands
    </p>
    <div className="marquee-outer">
      <div className="marquee-track" style={{ minHeight: 80, alignItems: "center" }}>
        {allBrands.map((b, i) => (
          <span key={i} className="marquee-item" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <BrandLogo name={b.name} logo={b.logo} />
            {b.name}
            <span style={{ marginLeft: 38, color: "#333" }}>•</span>
          </span>
        ))}
      </div>
    </div>
  </section>
);

export default BrandMarquee;
