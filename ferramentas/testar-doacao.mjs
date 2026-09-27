import assert from 'node:assert/strict';
import { KINNOR } from '../public/assets/js/config.js';
import { opcoesDoacao } from '../public/assets/js/doacao.js';
import { pixCode } from '../public/assets/js/pix.js';

assert.deepEqual(opcoesDoacao({ ...KINNOR.doacao, pagina: '' }), {
  pixDisponivel: false,
  cartaoDisponivel: false,
  paginaDisponivel: false,
  valoresDisponiveis: false
});
const fakePix = { chave: '123e4567-e89b-12d3-a456-426614174000', nome: 'Teste Kinnor', cidade: 'Sao Paulo' };
assert.deepEqual(opcoesDoacao({ pix: fakePix, linkCartao: '' }), {
  pixDisponivel: true,
  cartaoDisponivel: false,
  paginaDisponivel: false,
  valoresDisponiveis: true
});
assert.deepEqual(opcoesDoacao({ pix: { chave: '', nome: '', cidade: '' }, linkCartao: 'https://exemplo.org/pagar' }), {
  pixDisponivel: false,
  cartaoDisponivel: true,
  paginaDisponivel: false,
  valoresDisponiveis: true
});
const code = pixCode({ key: fakePix.chave, name: fakePix.nome, city: fakePix.cidade, amount: 25 });
assert.match(code, /540525\.00/);
assert.match(code, /6304[0-9A-F]{4}$/);
assert.equal(opcoesDoacao({ pix: fakePix, linkCartao: '', pagina: 'https://exemplo.org/doar' }).paginaDisponivel, true);
console.log('Doação: estado vazio, Pix e cartão conferidos; payload Pix com valor e CRC.');
