import * as React from "react"

const Slot = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }
>(({ children, ...props }, ref) => {
  if (!children) {
    return null
  }

  if (React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      ...children.props,
      ref: ref
        ? (nextRef: unknown) => {
            if (typeof ref === "function") {
              ref(nextRef as HTMLElement)
            } else if (ref) {
              ref.current = nextRef as HTMLElement
            }

            const { ref: childRef } = children.props as {
              ref?: React.Ref<HTMLElement>
            }

            if (typeof childRef === "function") {
              childRef(nextRef as HTMLElement)
            } else if (childRef) {
              ;(childRef as React.MutableRefObject<unknown>).current = nextRef
            }
          }
        : children.props.ref,
    })
  }

  return children as React.ReactElement
})

Slot.displayName = "Slot"

export { Slot } 