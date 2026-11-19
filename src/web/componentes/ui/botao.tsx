import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variantes = cva(
  "inline-flex select-none items-center justify-center gap-2 rounded-[4px] font-semibold transition-[background-color,color,opacity,transform] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variante: {
        primario: "bg-white text-black hover:bg-white/90",
        secundario: "border-[1.5px] border-white bg-transparent text-white hover:bg-white/10",
        escuro: "bg-black text-white hover:bg-black/85",
        fantasma: "text-white hover:bg-white/10",
      },
      tamanho: {
        normal: "min-h-11 px-5 text-[15px]",
        grande: "min-h-[54px] px-6 text-[17px]",
        icone: "size-11",
      },
    },
    defaultVariants: { variante: "primario", tamanho: "normal" },
  },
);

type Props = ComponentProps<"button"> & VariantProps<typeof variantes> & { asChild?: boolean };

export function Botao({ className, variante, tamanho, asChild, type, ...props }: Props) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      type={asChild ? undefined : (type ?? "button")}
      className={cn(variantes({ variante, tamanho }), className)}
      {...props}
    />
  );
}
