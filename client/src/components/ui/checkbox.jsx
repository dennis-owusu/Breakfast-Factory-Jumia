import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-md border-2 border-gray-300 bg-white shadow-sm ring-offset-background focus-visible:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=checked]:text-white dark:border-gray-600 dark:bg-gray-800 dark:focus:border-orange-400 dark:focus:ring-orange-800 dark:data-[state=checked]:bg-orange-600",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>      
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }