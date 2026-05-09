import { useState } from "react";

const brands = [
  { name: "GAN", domain: "gancube.com" },
  { name: "MoYu", domain: "moyucube.com" },
  { name: "QiYi", domain: "qiyicube.com" },
  { name: "SpeedCubeShop", domain: "speedcubeshop.com" },
  { name: "Cubelelo", domain: "cubelelo.com" },
];

const allBrands = [...brands, ...brands, ...brands];

const BrandLogo = ({ name, domain }: { name: string; domain: string }) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 0.5,
          color: "#cfcfcf",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        {name}
      </span>
    );
  }
  return (
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={name}
      height={28}
      style={{
        height: 28,
        width: "auto",
        objectFit: "contain",
        filter: "grayscale(1) brightness(2)",
        opacity: 0.75,
      }}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

const BrandMarquee = () => (
  <section style={{ padding: "48px 0", background: "transparent" }}>
    <p
      style={{
        textAlign: "center",
        color: "#888",
        fontSize: "14px",
        marginBottom: "32px",
        letterSpacing: "1px",
        textTransform: "uppercase",
      }}
    >
      Trusted by the world's top cube brands
    </p>
    <div className="marquee-outer">
      <div className="marquee-track" style={{ minHeight: 80, alignItems: "center" }}>
        {allBrands.map((b, i) => (
          <span
            key={i}
            className="marquee-item"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 32,
              paddingRight: 56,
            }}
          >
            <BrandLogo name={b.name} domain={b.domain} />
          </span>
        ))}
      </div>
    </div>
  </section>
);

export default BrandMarquee;
