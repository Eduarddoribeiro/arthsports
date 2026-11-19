import { describe, expect, it } from "vitest";
import { calcularEntrega, diasDeAtraso, proximaEtapa, resumoGrade, totalGrade } from "./dominio";
import { pedidoSchema } from "./esquemas";

describe("calcularEntrega (RN-02, RN-03)", () => {
  it("soma o prazo máximo à data do sinal", () => {
    expect(calcularEntrega("2026-12-01", [30])).toBe("2026-12-31");
  });
  it("usa o maior prazo entre as peças", () => {
    expect(calcularEntrega("2026-10-01", [30, 45, 30])).toBe("2026-11-15");
  });
  it("atravessa a virada do ano", () => {
    expect(calcularEntrega("2026-12-20", [15])).toBe("2027-01-04");
  });
});

describe("diasDeAtraso (RN-04)", () => {
  const base = { entregaCalculada: "2026-12-31", etapaAtual: "acabamento" as const, status: "ativo" as const };
  it("é zero no dia previsto", () => {
    expect(diasDeAtraso(base, new Date(2026, 11, 31))).toBe(0);
  });
  it("conta a partir do dia seguinte", () => {
    expect(diasDeAtraso(base, new Date(2027, 0, 1))).toBe(1);
  });
  it("ignora pedido entregue ou cancelado", () => {
    expect(diasDeAtraso({ ...base, etapaAtual: "entregue" }, new Date(2027, 0, 10))).toBe(0);
    expect(diasDeAtraso({ ...base, status: "cancelado" }, new Date(2027, 0, 10))).toBe(0);
  });
});

describe("etapas", () => {
  it("segue a ordem sem pular", () => {
    expect(proximaEtapa("arte")).toBe("costura");
    expect(proximaEtapa("acabamento")).toBe("entregue");
    expect(proximaEtapa("entregue")).toBeNull();
  });
});

describe("grade", () => {
  it("soma e resume", () => {
    const g = { PP: 0, P: 4, M: 10, G: 10, GG: 6 };
    expect(totalGrade(g)).toBe(30);
    expect(resumoGrade(g)).toBe("P 4 · M 10 · G 10 · GG 6");
  });
});

describe("pedidoSchema", () => {
  const ok = {
    clienteId: 1,
    itens: [{ pecaId: 1, grade: { PP: 0, P: 1, M: 0, G: 0, GG: 0 } }],
    valorTotalCentavos: 10000,
    sinalCentavos: 5000,
    dataSinal: "2026-11-18",
  };
  it("aceita pedido válido", () => {
    expect(pedidoSchema.safeParse(ok).success).toBe(true);
  });
  it("recusa sinal maior que o total", () => {
    expect(pedidoSchema.safeParse({ ...ok, sinalCentavos: 20000 }).success).toBe(false);
  });
  it("recusa peça sem tamanhos", () => {
    const itens = [{ pecaId: 1, grade: { PP: 0, P: 0, M: 0, G: 0, GG: 0 } }];
    expect(pedidoSchema.safeParse({ ...ok, itens }).success).toBe(false);
  });
});
