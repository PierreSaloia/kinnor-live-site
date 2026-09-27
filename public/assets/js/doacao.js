// A interface usa a mesma regra para mostrar valores, Pix e cartão.
export function opcoesDoacao({ pix, linkCartao, pagina = '' }) {
  const pixDisponivel = Boolean(pix.chave && pix.nome && pix.cidade);
  const cartaoDisponivel = Boolean(linkCartao);
  return {
    pixDisponivel,
    cartaoDisponivel,
    paginaDisponivel: Boolean(pagina),
    valoresDisponiveis: pixDisponivel || cartaoDisponivel
  };
}
