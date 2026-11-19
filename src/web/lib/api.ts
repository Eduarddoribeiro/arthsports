export class ErroApi extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function chamar<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`/api${caminho}`, {
      method: metodo,
      credentials: "same-origin",
      headers: corpo === undefined ? undefined : { "content-type": "application/json" },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroApi("Sem conexão com o servidor. Verifique a internet.", 0);
  }
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new ErroApi(dados.erro ?? "Algo deu errado", resposta.status);
  return dados as T;
}

export const api = {
  get: <T>(caminho: string) => chamar<T>("GET", caminho),
  post: <T>(caminho: string, corpo: unknown = {}) => chamar<T>("POST", caminho, corpo),
  put: <T>(caminho: string, corpo: unknown) => chamar<T>("PUT", caminho, corpo),
};
