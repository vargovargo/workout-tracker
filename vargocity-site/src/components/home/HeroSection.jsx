export default function HeroSection() {
  return (
    <section className="pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-xs font-medium tracking-widest uppercase mb-6"
          style={{ color: '#8A8A8A' }}>
          Jason Vargo
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight max-w-2xl"
          style={{ color: '#1A1A1A' }}>
          measuring my own<br />rate of change
        </h1>
        <p className="mt-5 text-lg" style={{ color: '#4A4A4A' }}>
          Researcher. Builder. Climber. Reader.
        </p>
        <p className="mt-4 text-base leading-relaxed max-w-xl" style={{ color: '#4A4A4A' }}>
          Senior Researcher at the Federal Reserve Bank of San Francisco. I study how
          climate risk and economic opportunity intersect in the communities that need
          it most. The through-line from chemical engineering to climate science:
          learning at the cutting edge, doing hard things that matter, building
          something real.
        </p>
      </div>
    </section>
  )
}
