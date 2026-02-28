export default function SectionHeader({ label, title, description }) {
  return (
    <div className="mb-10">
      {label && (
        <p className="text-xs font-medium tracking-widest uppercase mb-3"
          style={{ color: '#8A8A8A' }}>
          {label}
        </p>
      )}
      <h1 className="text-3xl font-semibold tracking-tight" style={{ color: '#1A1A1A' }}>
        {title}
      </h1>
      {description && (
        <p className="mt-3 text-base leading-relaxed max-w-2xl" style={{ color: '#4A4A4A' }}>
          {description}
        </p>
      )}
    </div>
  )
}
