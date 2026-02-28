export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #E5E5E0', backgroundColor: '#FAFAF8' }}
      className="mt-24 py-10">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>Jason Vargo</p>
          <p className="text-xs mt-0.5" style={{ color: '#8A8A8A' }}>measuring my own rate of change</p>
        </div>
        <div className="flex gap-5">
          <a href="https://scholar.google.com/citations?user=18KgmXAAAAAJ"
            target="_blank" rel="noopener noreferrer"
            className="text-xs transition-colors hover:text-[#1A1A1A]"
            style={{ color: '#8A8A8A' }}>
            Scholar
          </a>
          <a href="https://www.frbsf.org/our-people/experts/jason-vargo/"
            target="_blank" rel="noopener noreferrer"
            className="text-xs transition-colors hover:text-[#1A1A1A]"
            style={{ color: '#8A8A8A' }}>
            Fed Profile
          </a>
          <a href="https://twitter.com/_vargo"
            target="_blank" rel="noopener noreferrer"
            className="text-xs transition-colors hover:text-[#1A1A1A]"
            style={{ color: '#8A8A8A' }}>
            @_vargo
          </a>
          <a href="https://github.com/vargovargo"
            target="_blank" rel="noopener noreferrer"
            className="text-xs transition-colors hover:text-[#1A1A1A]"
            style={{ color: '#8A8A8A' }}>
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
