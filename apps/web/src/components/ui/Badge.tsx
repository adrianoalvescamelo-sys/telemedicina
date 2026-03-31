import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:   'bg-primary-100 text-primary-700',
        secondary: 'bg-slate-100 text-slate-700',
        success:   'bg-green-100 text-green-700',
        warning:   'bg-yellow-100 text-yellow-700',
        danger:    'bg-red-100 text-red-700',
        purple:    'bg-purple-100 text-purple-700',
        outline:   'border border-border text-slate-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
