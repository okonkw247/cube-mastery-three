const brands = ["GAN", "MoYu", "QiYi", "SpeedCubeShop", "Cubelelo", "TheCubicle"];

const allBrands = [...brands, ...brands, ...brands];

const BrandWordmark = ({ name }: { name: string }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px 22px",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.02)",
      fontSize: 16,
      fontWeight: 700,
      letterSpacing: "0.12em",
      color: "#ffffff",
      textTransform: "uppercase",
      fontFamily: "'Poppins', 'Inter', sans-serif",
      height: 44,
      whiteSpace: "nowrap",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
    }}
  >
    {name}
  </span>
);

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
        {allBrands.map((name, i) => (
          <span
            key={i}
            className="marquee-item"
            style={{
              display: "inline-flex",
              alignItems: "center",
              paddingRight: 24,
            }}
          >
            <BrandWordmark name={name} />
          </span>
        ))}
      </div>
    </div>
  </section>
);

export default BrandMarquee;
