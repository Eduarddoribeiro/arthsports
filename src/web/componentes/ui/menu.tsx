import * as M from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";

export function Menu({ gatilho, children }: { gatilho: ReactNode; children: ReactNode }) {
  return (
    <M.Root>
      <M.Trigger asChild>{gatilho}</M.Trigger>
      <M.Portal>
        <M.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[220px] rounded-[4px] border border-divisoria bg-elevado p-1 text-[15px] shadow-xl"
        >
          {children}
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}

export function ItemMenu({ children, onSelect }: { children: ReactNode; onSelect: () => void }) {
  return (
    <M.Item
      onSelect={onSelect}
      className="flex min-h-11 cursor-pointer items-center rounded-[4px] px-3 outline-none data-[highlighted]:bg-white data-[highlighted]:text-black"
    >
      {children}
    </M.Item>
  );
}
