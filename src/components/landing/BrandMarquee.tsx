const logos = [
  "MoYu", "GAN", "QY Toys",
  "BLVCK Paris", "GoCube",
  "Energize Lab", "Ocoopa",
  "OLIGHT", "LIVING.AI", "CARD MAFIA"
];

const allLogos = [...logos, ...logos];

const BrandMarquee = () => {
  return (
    <section style={{ padding: "48px 0", background: "transparent" }}>
      <p style={{
        textAlign: "center",
        color: "#888",
        fontSize: "14px",
        marginBottom: "32px",
        letterSpacing: "1px",
        textTransform: "uppercase"
      }}>
        Trusted by the world's top cube brands
      </p>
      <div className="marquee-outer">
        <div className="marquee-track">
          {allLogos.map((logo, i) => (
            <span key={i} className="marquee-item">
              {logo}
              <span style={{ marginLeft: "40px", color: "#333" }}>•</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandMarquee;
