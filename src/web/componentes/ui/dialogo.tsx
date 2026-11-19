import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/** Folha inferior no celular, janela central no PC. */
export function Dialogo({
  aberto,
  aoMudar,
  titulo,
  descricao,
  children,
}: {
  aberto: boolean;
  aoMudar: (v: boolean) => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
}) {
  return (
    <D.Root open={aberto} onOpenChange={aoMudar}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-40 bg-black/80" />
        <D.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-[8px] border-t border-white bg-card px-5 pt-5 pb-[max(20px,env(safe-area-inset-bottom))] lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:w-[520px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[4px] lg:border lg:p-8">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <D.Title className="titulo text-[32px]">{titulo}</D.Title>
              <D.Description className={descricao ? "mt-2 text-cinza-medio" : "sr-only"}>{descricao ?? titulo}</D.Description>
            </div>
            <D.Close
              className="-mt-1 -mr-2 grid size-11 shrink-0 place-items-center rounded-[4px] hover:bg-white/10"
              aria-label="Fechar"
            >
              <X className="size-6" />
            </D.Close>
          </div>
          {children}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
