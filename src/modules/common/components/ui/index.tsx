import clsx from "clsx"
import {
  ButtonHTMLAttributes,
  forwardRef,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  TextareaHTMLAttributes,
  ThHTMLAttributes,
} from "react"

// TODO: Add Toaster component back when needed for notifications

// Re-export clsx as clx for compatibility
export { clsx as clx }

// Text Component
type TextProps = HTMLAttributes<HTMLParagraphElement> & {
  as?: "p" | "span" | "div"
}

export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, as: Component = "p", children, ...props }, ref) => {
    return (
      <Component ref={ref} className={clsx("text-base", className)} {...props}>
        {children}
      </Component>
    )
  }
)
Text.displayName = "Text"

// Heading Component
type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: "h1" | "h2" | "h3"
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level: Component = "h2", children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={clsx(
          "font-semibold",
          Component === "h1" && "text-3xl",
          Component === "h2" && "text-2xl",
          Component === "h3" && "text-xl",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
Heading.displayName = "Heading"

// Button Component
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "transparent"
  size?: "small" | "medium" | "large"
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "medium",
      isLoading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={clsx(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" &&
            "bg-primary text-on-primary shadow-soft hover:bg-primary-hover",
          variant === "secondary" &&
            "border border-border bg-card text-foreground shadow-soft hover:bg-subtle",
          variant === "outline" &&
            "border border-primary bg-transparent text-primary hover:bg-primary/10",
          (variant === "ghost" || variant === "transparent") &&
            "bg-transparent text-foreground hover:bg-subtle",
          variant === "danger" &&
            "bg-danger text-white shadow-soft hover:bg-danger/90",
          size === "small" && "h-8 px-3 text-ui-sm",
          size === "medium" && "h-10 px-4 text-ui-base",
          size === "large" && "h-12 px-6 text-ui-lg",
          className
        )}
        {...props}
      >
        {isLoading ? "Yükleniyor..." : children}
      </button>
    )
  }
)
Button.displayName = "Button"

// Container Component
type ContainerProps = HTMLAttributes<HTMLDivElement>

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "rounded-rounded bg-card p-4 text-foreground",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Container.displayName = "Container"

type CardProps = HTMLAttributes<HTMLDivElement>

const CardRoot = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        "rounded-rounded border border-border bg-card text-foreground shadow-card",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
CardRoot.displayName = "Card"

const CardHeader = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx("space-y-1.5 p-6", className)} {...props}>
      {children}
    </div>
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={clsx("text-heading-4 font-semibold", className)}
    {...props}
  >
    {children}
  </h3>
))
CardTitle.displayName = "CardTitle"

const CardContent = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  )
)
CardContent.displayName = "CardContent"

const CardFooter = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx("flex items-center p-6 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  )
)
CardFooter.displayName = "CardFooter"

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Content: CardContent,
  Footer: CardFooter,
})

// Badge Component
type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  color?: "green" | "red" | "blue" | "orange" | "grey" | "purple"
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, color = "grey", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
          color === "green" && "bg-success/15 text-success",
          color === "red" && "bg-danger/15 text-danger",
          color === "blue" && "bg-info/15 text-info",
          color === "orange" && "bg-warning/15 text-warning",
          color === "grey" && "bg-muted/15 text-muted",
          color === "purple" &&
            "bg-purple-500/15 text-purple-600 dark:text-purple-300",
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)
Badge.displayName = "Badge"

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  status?: "success" | "warning" | "danger" | "info" | "neutral"
  dot?: boolean
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status = "neutral", dot = true, children, ...props }, ref) => {
    const tone =
      status === "success"
        ? "bg-success/15 text-success"
        : status === "warning"
        ? "bg-warning/15 text-warning"
        : status === "danger"
        ? "bg-danger/15 text-danger"
        : status === "info"
        ? "bg-info/15 text-info"
        : "bg-muted/15 text-muted"

    return (
      <span
        ref={ref}
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-circle px-2.5 py-1 text-ui-xs font-semibold",
          tone,
          className
        )}
        {...props}
      >
        {dot && (
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-circle bg-current"
          />
        )}
        {children}
      </span>
    )
  }
)
StatusBadge.displayName = "StatusBadge"

type TooltipProps = HTMLAttributes<HTMLSpanElement> & {
  content: React.ReactNode
}

export const Tooltip = forwardRef<HTMLSpanElement, TooltipProps>(
  ({ className, content, children, ...props }, ref) => (
    <span
      ref={ref}
      className={clsx("group relative inline-flex", className)}
      {...props}
    >
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-64 -translate-x-1/2 rounded-base bg-foreground px-2.5 py-1.5 text-ui-xs text-background opacity-0 shadow-elevated transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {content}
      </span>
    </span>
  )
)
Tooltip.displayName = "Tooltip"

// IconBadge Component
type IconBadgeProps = HTMLAttributes<HTMLSpanElement>

export const IconBadge = forwardRef<HTMLSpanElement, IconBadgeProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center rounded-full bg-gray-100 p-1",
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)
IconBadge.displayName = "IconBadge"

// IconButton Component
type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "small" | "medium" | "large"
  isLoading?: boolean
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      children,
      variant = "ghost",
      size = "medium",
      isLoading,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={clsx(
          "relative inline-flex shrink-0 items-center justify-center rounded-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" &&
            "bg-primary text-on-primary hover:bg-primary-hover",
          variant === "secondary" &&
            "border border-border bg-card text-foreground hover:bg-subtle",
          variant === "ghost" &&
            "bg-transparent text-foreground hover:bg-subtle",
          variant === "danger" && "bg-danger text-white hover:bg-danger/90",
          size === "small" && "h-8 w-8",
          size === "medium" && "h-10 w-10",
          size === "large" && "h-12 w-12",
          className
        )}
        {...props}
      >
        <span className={clsx(isLoading && "opacity-0")}>{children}</span>
        {isLoading && (
          <span
            aria-hidden="true"
            className="absolute h-4 w-4 animate-spin rounded-circle border-2 border-current border-r-transparent"
          />
        )}
      </button>
    )
  }
)
IconButton.displayName = "IconButton"

// Label Component
type LabelProps = LabelHTMLAttributes<HTMLLabelElement>

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={clsx("text-sm font-medium", className)}
        {...props}
      >
        {children}
      </label>
    )
  }
)
Label.displayName = "Label"

// Input Component
export type InputControlProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
  unstyled?: boolean
}

export const InputControl = forwardRef<HTMLInputElement, InputControlProps>(
  ({ className, invalid = false, unstyled = false, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={clsx(
        !unstyled &&
          "flex h-10 w-full rounded-base border border-border bg-input px-3 py-2 text-ui-base text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        !unstyled && invalid && "border-danger focus:ring-danger",
        className
      )}
      {...props}
    />
  )
)
InputControl.displayName = "InputControl"

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
  containerClassName?: string
  unstyled?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      label,
      hint,
      error,
      id,
      unstyled = false,
      ...props
    },
    ref
  ) => {
    const descriptionId =
      id && (error || hint) ? `${id}-description` : undefined
    return (
      <div className={clsx("flex flex-col gap-1.5", containerClassName)}>
        {label && <Label htmlFor={id}>{label}</Label>}
        <InputControl
          ref={ref}
          id={id}
          invalid={Boolean(error)}
          aria-describedby={descriptionId}
          className={className}
          unstyled={unstyled}
          {...props}
        />
        {(error || hint) && (
          <span
            id={descriptionId}
            className={clsx("text-ui-xs", error ? "text-danger" : "text-muted")}
          >
            {error || hint}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, rows = 4, ...props }, ref) => {
    const descriptionId =
      id && (error || hint) ? `${id}-description` : undefined
    return (
      <div className="flex flex-col gap-1.5">
        {label && <Label htmlFor={id}>{label}</Label>}
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionId}
          className={clsx(
            "min-h-24 w-full resize-y rounded-base border border-border bg-input px-3 py-2 text-ui-base text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-danger focus:ring-danger",
            className
          )}
          {...props}
        />
        {(error || hint) && (
          <span
            id={descriptionId}
            className={clsx("text-ui-xs", error ? "text-danger" : "text-muted")}
          >
            {error || hint}
          </span>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export type SelectControlProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean
  unstyled?: boolean
}

export const SelectControl = forwardRef<HTMLSelectElement, SelectControlProps>(
  (
    { className, invalid = false, unstyled = false, children, ...props },
    ref
  ) => (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={clsx(
        !unstyled &&
          "h-10 w-full rounded-base border border-border bg-input px-3 text-ui-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        !unstyled && invalid && "border-danger focus:ring-danger",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
)
SelectControl.displayName = "SelectControl"

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  hint?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, error, id, children, ...props }, ref) => {
    const descriptionId =
      id && (error || hint) ? `${id}-description` : undefined
    return (
      <div className="flex flex-col gap-1.5">
        {label && <Label htmlFor={id}>{label}</Label>}
        <SelectControl
          ref={ref}
          id={id}
          invalid={Boolean(error)}
          aria-describedby={descriptionId}
          className={className}
          {...props}
        >
          {children}
        </SelectControl>
        {(error || hint) && (
          <span
            id={descriptionId}
            className={clsx("text-ui-xs", error ? "text-danger" : "text-muted")}
          >
            {error || hint}
          </span>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

// Table Components
type TableProps = TableHTMLAttributes<HTMLTableElement>

const TableRoot = forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <table
        ref={ref}
        className={clsx("w-full caption-bottom text-sm", className)}
        {...props}
      >
        {children}
      </table>
    )
  }
)
TableRoot.displayName = "Table"

type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={clsx("[&_tr]:border-b", className)}
        {...props}
      >
        {children}
      </thead>
    )
  }
)
TableHeader.displayName = "TableHeader"

type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={clsx("[&_tr:last-child]:border-0", className)}
        {...props}
      >
        {children}
      </tbody>
    )
  }
)
TableBody.displayName = "TableBody"

type TableRowProps = HTMLAttributes<HTMLTableRowElement>

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={clsx(
          "border-b transition-colors hover:bg-gray-50",
          className
        )}
        {...props}
      >
        {children}
      </tr>
    )
  }
)
TableRow.displayName = "TableRow"

type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement>

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={clsx(
          "h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0",
          className
        )}
        {...props}
      >
        {children}
      </th>
    )
  }
)
TableHead.displayName = "TableHead"

type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={clsx(
          "p-4 align-middle [&:has([role=checkbox])]:pr-0",
          className
        )}
        {...props}
      >
        {children}
      </td>
    )
  }
)
TableCell.displayName = "TableCell"

export const Table = Object.assign(TableRoot, {
  Header: TableHeader,
  Body: TableBody,
  Row: TableRow,
  Head: TableHead,
  HeaderCell: TableHead,
  Cell: TableCell,
})

// RadioGroup Components
type RadioGroupProps = HTMLAttributes<HTMLDivElement>

const RadioGroupRoot = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx("flex flex-col gap-2", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
RadioGroupRoot.displayName = "RadioGroup"

type RadioGroupItemProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="radio"
          id={id}
          className={clsx(
            "h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-900",
            className
          )}
          {...props}
        />
        {label && <Label htmlFor={id}>{label}</Label>}
      </div>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export const RadioGroup = Object.assign(RadioGroupRoot, {
  Item: RadioGroupItem,
})

// Checkbox Component
type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: React.ReactNode
  containerClassName?: string
  labelClassName?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { className, containerClassName, labelClassName, label, id, ...props },
    ref
  ) => {
    return (
      <label
        htmlFor={id}
        className={clsx(
          "inline-flex items-center gap-2.5 cursor-pointer select-none",
          containerClassName
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          id={id}
          className={clsx(
            "h-4 w-4 shrink-0 rounded border border-gray-300 text-primary accent-[#C98484] focus:ring-1 focus:ring-primary cursor-pointer my-0",
            className
          )}
          {...props}
        />
        {label && (
          <span
            className={clsx(
              "text-[13px] leading-none text-gray-700 font-normal flex items-center",
              labelClassName
            )}
          >
            {label}
          </span>
        )}
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

type SwitchProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> & {
  label?: string
  description?: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    { className, label, description, id, checked, defaultChecked, ...props },
    ref
  ) => {
    return (
      <label
        htmlFor={id}
        className="inline-flex cursor-pointer items-center gap-3"
      >
        <span className="relative inline-flex h-6 w-11 shrink-0">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            role="switch"
            checked={checked}
            defaultChecked={defaultChecked}
            className={clsx("peer sr-only", className)}
            {...props}
          />
          <span className="absolute inset-0 rounded-circle bg-muted/35 transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:opacity-50" />
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-circle bg-white shadow-soft transition-transform peer-checked:translate-x-5" />
        </span>
        {(label || description) && (
          <span className="flex flex-col">
            {label && (
              <span className="text-ui-sm font-medium text-foreground">
                {label}
              </span>
            )}
            {description && (
              <span className="text-ui-xs text-muted">{description}</span>
            )}
          </span>
        )}
      </label>
    )
  }
)
Switch.displayName = "Switch"
