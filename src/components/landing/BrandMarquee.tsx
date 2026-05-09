import { useState } from "react";

type Brand =
  | { name: string; type: "image"; src: string }
  | { name: string; type: "text" };

const brands: Brand[] = [
  { name: "GAN", type: "image", src: "https://www.gancube.com/favicon.ico" },
  { name: "MoYu", type: "text" },
  { name: "QiYi", type: "image", src: "https://www.qiyi.com/favicon.ico" },
  { name: "SpeedCubeShop", type: "image", src: "https://speedcubeshop.com/favicon.ico" },
  { name: "Cubelelo", type: "image", src: "https://www.cubelelo.com/favicon.ico" },
];

const allBrands = [...brands, ...brands, ...brands];

const BrandLogo = ({ brand }: { brand: Brand }) => {
  const [failed, setFailed] = useState(false);

  if (brand.type === "text" || failed) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "6px 14px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.04)",
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: 0.6,
          color: "#f5f5f5",
          fontFamily: "'Poppins', sans-serif",
          height: 36,
        }}
      >
        {brand.name}
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <img
        src={brand.src}
        alt={brand.name}
        height={28}
        width={28}
        style={{
          height: 28,
          width: 28,
          objectFit: "contain",
          filter: "brightness(0) invert(1)",
          opacity: 0.9,
        }}
        loading="lazy"
        onError={() => setFailed(true)}
      />
      <span
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#e5e5e5",
          letterSpacing: 0.4,
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        {brand.name}
      </span>
    </span>
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
              paddingRight: 56,
            }}
          >
            <BrandLogo brand={b} />
          </span>
        ))}
      </div>
    </div>
  </section>
);

export default BrandMarquee;
