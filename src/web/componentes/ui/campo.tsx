import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Entrada({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "min-h-[52px] w-full rounded-[8px] border border-white bg-card px-4 text-[17px] text-white placeholder:text-cinza aria-invalid:border-2",
        className,
      )}
      {...props}
    />
  );
}

export function Selecao({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn("min-h-[52px] w-full rounded-[8px] border border-white bg-card px-4 text-[17px] text-white", className)}
      {...props}
    />
  );
}

/** Rótulo + controle + mensagem de erro, com ids ligados para leitores de tela. */
export function Campo({
  rotulo,
  erro,
  ajuda,
  children,
  className,
}: {
  rotulo: string;
  erro?: string;
  ajuda?: string;
  children: (id: string, descricao?: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const descricao = erro || ajuda ? `${id}-desc` : undefined;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="rotulo">
        {rotulo}
      </label>
      {children(id, descricao)}
      {(erro || ajuda) && (
        <p id={descricao} role={erro ? "alert" : undefined} className={cn("text-sm", erro ? "font-semibold text-white" : "text-cinza")}>
          {erro ? `⚠ ${erro}` : ajuda}
        </p>
      )}
    </div>
  );
}

/** Campo em reais que guarda centavos: digitar 210000 mostra R$ 2.100,00. */
export function EntradaDinheiro({
  valor,
  aoMudar,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange"> & { valor: number; aoMudar: (centavos: number) => void }) {
  const texto = (valor / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return (
    <Entrada
      inputMode="numeric"
      value={texto}
      onChange={(e) => {
        const digitos = e.target.value.replace(/\D/g, "").slice(0, 11);
        aoMudar(Number(digitos || "0"));
      }}
      {...props}
    />
  );
}
