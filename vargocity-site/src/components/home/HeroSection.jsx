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
        <p className="mt-6 text-base leading-relaxed max-w-xl" style={{ color: '#4A4A4A' }}>
          For twenty-five years I've been asking the same question across different problems:
          who bears the cost of powerful systems — and what can be built to change that?
          I've tracked it through urban heat, wildfire smoke, COVID, and economic vulnerability.
          Now the question has found its most consequential application. AGI is arriving, and
          how that transition is distributed across society may be the defining challenge of
          the next generation. That's where I'm pointed.
        </p>
        <p className="mt-3 text-sm" style={{ color: '#8A8A8A' }}>
          Senior Researcher · Federal Reserve Bank of San Francisco
        </p>
      </div>
    </section>
  )
}
