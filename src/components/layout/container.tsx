export function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-container px-4 tablet:px-6 ${className}`}>
      {children}
    </div>
  )
}
