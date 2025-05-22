import Image from 'next/image'

interface BlogImageProps {
  src: string
  alt: string
  priority?: boolean
  className?: string
}

export function BlogImage({ src, alt, priority = false, className = '' }: BlogImageProps) {
  return (
    <div className={`relative h-[400px] w-full ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        sizes="(min-width: 1280px) 1200px, (min-width: 1024px) 960px, (min-width: 768px) 720px, 100vw"
        quality={90}
      />
    </div>
  )
} 