import base64, json, html, os
from collections import OrderedDict

D = '/tmp/claude-1000/-home-gedai-Projetos-Pessoais-so-mais-um/7a88062c-df5d-45b3-bcab-1329543c878f/scratchpad'
dados = json.load(open(f'{D}/metricas-todas.json'))

def pega(a, n, v, l, t):
    return next(x for x in dados if x['area'] == a and x['nome'] == n and x['versao'] == v and x['largura'] == l and x['tema'] == t)

telas = list(OrderedDict(((x['area'], x['nome']), 1) for x in dados))
linhas = []
for a, n in telas:
    r = {'area': a, 'nome': n}
    for v in ('antes', 'depois'):
        r[v] = {
            'vaza': pega(a, n, v, 360, 'light')['vazando'],
            'fora': pega(a, n, v, 360, 'light')['controlesFora'],
            'vaza768': pega(a, n, v, 768, 'light')['vazando'],
            'alvos': pega(a, n, v, 390, 'light')['alvosPequenos'],
            'texto': pega(a, n, v, 390, 'light')['textoMenor12'],
            'campos': pega(a, n, v, 390, 'light')['camposMenor16'],
            'contraste': pega(a, n, v, 390, 'light')['contrasteBaixo'] + pega(a, n, v, 390, 'dark')['contrasteBaixo'],
            'desk': pega(a, n, v, 1280, 'light')['vazando'],
            'ex': pega(a, n, v, 390, 'dark')['exemplos']['contraste'][:2] + pega(a, n, v, 390, 'light')['exemplos']['contraste'][:2],
        }
    linhas.append(r)

tot = lambda v, k: sum(r[v][k] for r in linhas)
fmt = lambda n: f'{n:,}'.replace(',', '.')

METRICAS = [
    ('vaza', 'Elementos passando da borda', 'a 360px'),
    ('fora', 'Botões e campos fora da tela', 'a 360px — ações que o dedo não alcança'),
    ('alvos', 'Alvos de toque abaixo de 44px', 'a 390px, em tela de toque'),
    ('texto', 'Textos menores que 12px', 'a 390px'),
    ('campos', 'Campos com fonte abaixo de 16px', 'no celular o iPhone dá zoom ao focar'),
    ('contraste', 'Textos abaixo do contraste AA', '4,5:1, ou 3:1 no texto grande; claro + escuro'),
]

def resumo():
    out = []
    for k, nome, nota in METRICAS:
        a, d = tot('antes', k), tot('depois', k)
        queda = '' if a == 0 else f'{round((a - d) / a * 100)}% a menos'
        estado = 'zerou' if d == 0 and a > 0 else ('resta' if d > 0 else 'ok')
        out.append(f'''
      <div class="metrica" data-estado="{estado}">
        <p class="rotulo">{nome}</p>
        <p class="numeros"><span class="antes">{fmt(a)}</span><span class="seta" aria-hidden="true">→</span><span class="depois">{fmt(d)}</span></p>
        <p class="nota">{nota}{' · <strong>' + queda + '</strong>' if queda else ''}</p>
      </div>''')
    return ''.join(out)

def celula(a, d):
    if a == 0 and d == 0:
        return '<td class="num zero">0</td>'
    cls = 'melhorou' if d < a else ('piorou' if d > a else 'igual')
    return f'<td class="num {cls}"><span class="a">{fmt(a)}</span><span class="s" aria-hidden="true">→</span><b>{fmt(d)}</b></td>'

def tabela():
    corpo = []
    area = None
    for r in linhas:
        if r['area'] != area:
            area = r['area']
            corpo.append(f'<tr class="grupo"><th colspan="7" scope="rowgroup">{"Painel do admin" if area == "Admin" else "Painel do dono"}</th></tr>')
        corpo.append('<tr><th scope="row">' + html.escape(r['nome']) + '</th>' + ''.join(celula(r['antes'][k], r['depois'][k]) for k, _, _ in METRICAS) + '</tr>')
    corpo.append('<tr class="total"><th scope="row">Total</th>' + ''.join(celula(tot('antes', k), tot('depois', k)) for k, _, _ in METRICAS) + '</tr>')
    cab = ''.join(f'<th scope="col">{n}</th>' for _, n, _ in METRICAS)
    return f'<table><thead><tr><th scope="col">Tela</th>{cab}</tr></thead><tbody>{"".join(corpo)}</tbody></table>'

MUDOU = {
    ('Admin', 'Gestão de Usuários'): 'Tabela de 870px vira cartão; filtros um por linha; "Convidar Owner" sai do verde de 2,3:1 para a cor primária do tema.',
    ('Admin', 'Visão Geral'): 'Contratos e pagamentos viram cartão; números dois por linha; padding duplicado some; selo de status corrigido ("Cancelada" saía amarela).',
    ('Admin', 'Estabelecimentos'): 'Tabela de 775px vira cartão, com Fechar e Trocar Owner no pé; botões e selo passam para os tokens do tema.',
    ('Admin', 'Solicitações'): 'Abas duas por linha ("Rejeitadas" saía da tela); nome e e-mail longos quebram; cores de status pelos tokens.',
    ('Dono', 'Visão Geral'): 'Números dois por linha, e a agenda do dia chega à primeira tela; botão legível no escuro; ✓ junto do item.',
    ('Dono', 'Turmas'): 'Cartão de 503px volta à largura da tela; as cinco ações ficam em duas colunas, com 44px.',
    ('Dono', 'Meus Estabelecimentos'): 'Rótulo "ESTABELECIMENTOS" inteiro (correção no StatCard comum); ações em pares; nome da unidade sem reticências.',
    ('Dono', 'Quadras'): 'Título deixa de virar "Quad…" (ação só com ícone); editor de faixas com atalhos de 44px e horário numa linha.',
    ('Dono', 'Estoque'): 'Três números lado a lado; selo e histórico sobem de 10–11px para 12px; seis larguras soltas viram os degraus do tema.',
    ('Dono', 'Equipamentos'): 'Números lado a lado e Atualizar/Novo equipamento dividindo a linha: as pendências chegam à primeira tela.',
    ('Dono', 'Day use'): 'Mesma grade sem minmax de Turmas; ações dividem o cartão; "Quem está" ganha margem no voltar.',
    ('Dono', 'Alunos'): 'Links de texto de 16px viram alvos de 44px; o exemplo do campo de contato cabe inteiro.',
    ('Dono', 'Chamada'): '"Veio" e "Faltou" eram rádios de 13px; em tela de toque viram botões de 44px com o marcado em destaque.',
    ('Dono', 'Mensalidades'): 'Faixa verde em quem pagou; "Desmarcar" neutro, "Marcar como paga" em verde.',
    ('Dono', 'Professores'): '"Convidar" e "Gerar link" deixam o branco fixo (2,00:1 no escuro); botões de 24–36px vão a 44px.',
    ('Dono', 'Suporte'): 'Em tela de toque o Enter quebra a linha e só o botão envia: no celular não havia como escrever em duas linhas.',
    ('Dono', 'Planos'): 'Uso com os dois números lado a lado; botões dos planos e do Pix com 44px; selo do plano atual em 12px.',
}

def img(area, nome, versao):
    p = f'{D}/metricas/{area}-{nome}-{versao}.png'.replace(' ', '_')
    b = base64.b64encode(open(p, 'rb').read()).decode()
    return f'data:image/png;base64,{b}'

def galeria():
    out = []
    for r in linhas:
        a, n = r['area'], r['nome']
        out.append(f'''
    <figure class="par">
      <figcaption><span class="area">{'Admin' if a == 'Admin' else 'Dono'}</span> {html.escape(n)}<span class="mudou">{html.escape(MUDOU[(a, n)])}</span></figcaption>
      <div class="lado">
        <div><p class="etiqueta">Antes</p><img loading="lazy" src="{img(a, n, 'antes')}" alt="{html.escape(n)} antes, a 390px" width="390" height="800"></div>
        <div><p class="etiqueta depois">Depois</p><img loading="lazy" src="{img(a, n, 'depois')}" alt="{html.escape(n)} depois, a 390px" width="390" height="800"></div>
      </div>
    </figure>''')
    return ''.join(out)

usuarios = next(r for r in linhas if r['nome'] == 'Gestão de Usuários')

pagina = f'''<title>Só+1 no celular</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
:root {{
  --chao: #f6f8f6;
  --cartao: #ffffff;
  --tinta: #111827;
  --tinta-2: #4b5563;
  --tinta-3: #6b7280;
  --linha: #e3e8e4;
  --verde: #15803d;
  --verde-claro: #dcfce7;
  --ambar: #92400e;
  --ambar-claro: #fef3c7;
  --erro: #b91c1c;
  --erro-claro: #fee2e2;
  --riscado: #9aa19c;
}}
@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{
    --chao: #111111; --cartao: #1c1c1c; --tinta: #e8e8e8; --tinta-2: #a0a0a0; --tinta-3: #8a8a8a;
    --linha: #2c2c2c; --verde: #3ecf8e; --verde-claro: #0d1f15; --ambar: #f59e0b; --ambar-claro: #1a1000;
    --erro: #f87171; --erro-claro: #1a0808; --riscado: #6b6b6b;
  }}
}}
:root[data-theme="dark"] {{
  --chao: #111111; --cartao: #1c1c1c; --tinta: #e8e8e8; --tinta-2: #a0a0a0; --tinta-3: #8a8a8a;
  --linha: #2c2c2c; --verde: #3ecf8e; --verde-claro: #0d1f15; --ambar: #f59e0b; --ambar-claro: #1a1000;
  --erro: #f87171; --erro-claro: #1a0808; --riscado: #6b6b6b;
}}
* {{ box-sizing: border-box; }}
body {{
  background: var(--chao); color: var(--tinta);
  font: 15px/1.6 Inter, "Segoe UI", system-ui, sans-serif;
  padding-inline: 16px; padding-block: 40px 72px;
}}
.pagina {{ max-width: 1080px; margin: 0 auto; display: grid; gap: 56px; }}
h1, h2, h3 {{ text-wrap: balance; margin: 0; letter-spacing: -0.02em; }}
h1 {{ font-size: clamp(30px, 5vw, 44px); line-height: 1.1; font-weight: 800; }}
h2 {{ font-size: 22px; font-weight: 700; }}
p {{ margin: 0; }}
.mono, .num, .numeros {{ font-family: "JetBrains Mono", ui-monospace, monospace; font-variant-numeric: tabular-nums; }}
.olho {{ font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--verde); }}
header {{ display: grid; gap: 14px; }}
header .lead {{ max-width: 65ch; color: var(--tinta-2); font-size: 17px; }}
.ficha {{ display: flex; flex-wrap: wrap; gap: 8px 20px; color: var(--tinta-3); font-size: 13px; }}
.ficha b {{ color: var(--tinta); font-weight: 600; }}
section {{ display: grid; gap: 18px; }}
section > .intro {{ max-width: 68ch; color: var(--tinta-2); }}

.metricas {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 1px; background: var(--linha); border: 1px solid var(--linha); border-radius: 14px; overflow: hidden; }}
.metrica {{ background: var(--cartao); padding: 20px 22px; display: grid; gap: 6px; align-content: start; }}
.metrica .rotulo {{ font-size: 13px; font-weight: 600; color: var(--tinta-2); }}
.numeros {{ display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }}
.numeros .antes {{ font-size: 20px; color: var(--riscado); text-decoration: line-through; text-decoration-thickness: 1px; }}
.numeros .seta {{ color: var(--tinta-3); font-size: 16px; }}
.numeros .depois {{ font-size: 36px; font-weight: 600; line-height: 1; color: var(--verde); }}
.metrica[data-estado="resta"] .depois {{ color: var(--ambar); }}
.metrica .nota {{ font-size: 12.5px; color: var(--tinta-3); }}
.metrica .nota strong {{ color: var(--tinta-2); font-weight: 600; }}

.rolagem {{ overflow-x: auto; border: 1px solid var(--linha); border-radius: 14px; background: var(--cartao); }}
table {{ border-collapse: collapse; width: 100%; min-width: 860px; font-size: 13.5px; }}
th, td {{ padding: 10px 14px; text-align: right; border-bottom: 1px solid var(--linha); }}
thead th {{ font-size: 11.5px; font-weight: 600; color: var(--tinta-3); text-transform: uppercase; letter-spacing: 0.04em; vertical-align: bottom; line-height: 1.35; }}
th:first-child {{ text-align: left; }}
tbody th {{ font-weight: 500; }}
tr.grupo th {{ text-align: left; background: var(--chao); font-size: 12px; font-weight: 600; color: var(--tinta-2); padding-block: 7px; }}
tr.total th, tr.total td {{ border-bottom: 0; font-weight: 700; }}
tr.total {{ background: var(--chao); }}
.num {{ white-space: nowrap; }}
.num .a {{ color: var(--riscado); text-decoration: line-through; }}
.num .s {{ color: var(--tinta-3); margin-inline: 6px; }}
.num.melhorou b {{ color: var(--verde); }}
.num.piorou b {{ color: var(--erro); }}
.num.igual b {{ color: var(--ambar); }}
.num.zero {{ color: var(--tinta-3); }}

.duas {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(min(420px, 100%), 1fr)); gap: 20px; }}
.bloco {{ background: var(--cartao); border: 1px solid var(--linha); border-radius: 14px; padding: 22px; display: grid; gap: 14px; align-content: start; }}
.bloco h3 {{ font-size: 16px; }}
.bloco ul {{ margin: 0; padding-left: 18px; display: grid; gap: 10px; color: var(--tinta-2); }}
.bloco li strong {{ color: var(--tinta); font-weight: 600; }}
.selo {{ display: inline-block; font-size: 11.5px; font-weight: 600; padding: 2px 9px; border-radius: 999px; }}
.selo.ok {{ background: var(--verde-claro); color: var(--verde); }}
.selo.pendente {{ background: var(--ambar-claro); color: var(--ambar); }}
code {{ font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 0.88em; background: var(--chao); padding: 1px 5px; border-radius: 4px; }}

.codigo {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)); gap: 12px; }}
.codigo div {{ border-top: 2px solid var(--verde); padding-top: 10px; display: grid; gap: 2px; }}
.codigo .numeros .depois {{ font-size: 28px; }}
.codigo p:last-child {{ font-size: 13px; color: var(--tinta-3); }}

.galeria {{ display: grid; gap: 28px; }}
.par {{ margin: 0; display: grid; gap: 12px; }}
.par figcaption {{ font-weight: 700; font-size: 16px; display: grid; gap: 2px; }}
.par .area {{ font-size: 11.5px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--tinta-3); }}
.par .mudou {{ font-weight: 400; font-size: 14px; color: var(--tinta-2); max-width: 70ch; }}
.lado {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; max-width: 640px; }}
.lado img {{ width: 100%; height: auto; display: block; border: 1px solid var(--linha); border-radius: 10px; background: var(--cartao); }}
.etiqueta {{ font-size: 12px; font-weight: 600; color: var(--tinta-3); margin-bottom: 6px; }}
.etiqueta.depois {{ color: var(--verde); }}
details {{ background: var(--cartao); border: 1px solid var(--linha); border-radius: 14px; padding: 16px 20px; }}
summary {{ cursor: pointer; font-weight: 600; }}
summary:focus-visible {{ outline: 2px solid var(--verde); outline-offset: 4px; border-radius: 4px; }}
details[open] summary {{ margin-bottom: 20px; }}
footer {{ color: var(--tinta-3); font-size: 13px; border-top: 1px solid var(--linha); padding-top: 18px; }}
</style>

<div class="pagina">
  <header>
    <p class="olho">web#511 · responsividade</p>
    <h1>O Só+1 no celular, antes e depois</h1>
    <p class="lead">Dezessete telas dos painéis do admin e do dono, medidas com o mesmo script no código da <code>develop</code> e no código com as correções. Os números abaixo são contagens do navegador, não estimativas.</p>
    <p class="ficha"><span>Medido em <b>16/09/2026</b></span><span>Larguras <b>360, 390, 768 e 1280px</b></span><span>Temas <b>claro e escuro</b></span><span>PRs <b>web#513</b> (admin) e <b>web#514</b> (dono)</span></p>
  </header>

  <section aria-labelledby="t-resumo">
    <h2 id="t-resumo">O que mudou, somando as dezessete telas</h2>
    <div class="metricas">{resumo()}
    </div>
  </section>

  <section aria-labelledby="t-telas">
    <h2 id="t-telas">Tela por tela</h2>
    <p class="intro">Cada célula é <span class="mono">antes → depois</span>. Vazamento a 360px; alvos, textos e campos a 390px em tela de toque; contraste somando os temas claro e escuro a 390px. No computador (1280px), nenhuma tela vazava antes nem vaza depois.</p>
    <div class="rolagem" role="region" aria-label="Métricas por tela" tabindex="0">{tabela()}</div>
  </section>

  <section aria-labelledby="t-codigo">
    <h2 id="t-codigo">No código</h2>
    <div class="codigo">
      <div><p class="numeros"><span class="antes">36</span><span class="seta">→</span><span class="depois">0</span></p><p>larguras soltas em <code>@media</code> nos arquivos tocados; todas viraram <code>ate.celular</code>, <code>ate.tablet</code> ou <code>ate.notebook</code></p></div>
      <div><p class="numeros"><span class="antes">126</span><span class="seta">→</span><span class="depois">30</span></p><p>cores hexadecimais fixas nos mesmos arquivos; o que sobrou são acentos de cartão e ícones de modalidade</p></div>
      <div><p class="numeros"><span class="depois">34</span></p><p>arquivos de código alterados: 17 commits de tela e 3 de correção, estes achados pela própria medição</p></div>
      <div><p class="numeros"><span class="antes">1.254</span><span class="seta">→</span><span class="depois">1.256</span></p><p>testes passando; os dois novos protegem o Enter do Suporte em tela de toque</p></div>
    </div>
  </section>

  <section aria-labelledby="t-achados">
    <h2 id="t-achados">O que a medição achou</h2>
    <div class="duas">
      <div class="bloco">
        <h3><span class="selo ok">Corrigido</span> Regressões que as correções tinham criado</h3>
        <ul>
          <li><strong>Seletor de espaço da agenda, a 360px.</strong> Com a fonte de 16px, ele ficou mais largo que a tela para o dono com dois espaços. Agora espaço e dia ficam um por linha.</li>
          <li><strong>Selo de Trial e Cancelada.</strong> O selo novo da Visão Geral do admin deu 4,24:1 e 4,33:1, abaixo dos 4,5:1. O texto passou para a cor de leitura do tema.</li>
          <li><strong>Horário no balão do Suporte.</strong> Sobre o verde-claro da mensagem do dono, dava 4,40:1. Passou para a cor de leitura do tema.</li>
        </ul>
      </div>
      <div class="bloco">
        <h3><span class="selo pendente">Pendente</span> O que continua abaixo do padrão</h3>
        <ul>
          <li><strong>Do contraste que resta, {fmt(usuarios["depois"]["contraste"])} de {fmt(tot("depois", "contraste"))} ocorrências estão na Gestão de Usuários ({fmt(usuarios["depois"]["contraste"] // 2)} por tema).</strong> As iniciais do avatar (2,95:1 no escuro) e o selo de papel "Usuário" (4,24:1), repetidos nas 96 linhas. O selo é o <code>RoleBadge</code>, componente comum.</li>
          <li><strong>"Painel do Dono" e "OWNER" na barra lateral,</strong> com 2,15:1 no claro, e <strong>o número do sino</strong>, com 10px e 2,77:1 no escuro. São do layout comum; o sino é o texto menor que 12px que sobra no Suporte.</li>
          <li><strong>Emoji como ícone</strong> na previsão do tempo (⛅🌧️) e na nota média (⭐). A skill de UI/UX recomenda SVG.</li>
          <li><strong>Sem dado na seed para ver:</strong> o seletor de professor no cartão da turma sem professor e a lista de convites por e-mail em Professores.</li>
          <li><strong>Recarregar</strong> Alunos, Chamada, Mensalidades e as entradas do day use mostra "Falta o espaço no endereço" quando o endereço não traz o espaço. Não é layout; anotado na web#511.</li>
          <li><strong>Rolagem dentro da rolagem</strong> no histórico do Estoque (lista de 640px de altura dentro da página).</li>
        </ul>
      </div>
    </div>
  </section>

  <section aria-labelledby="t-galeria">
    <h2 id="t-galeria">As telas a 390px</h2>
    <details>
      <summary>Ver as dezessete telas, antes e depois</summary>
      <div class="galeria">{galeria()}
      </div>
    </details>
  </section>

  <section aria-labelledby="t-como">
    <h2 id="t-como">Como foi medido</h2>
    <div class="bloco">
      <ul>
        <li><strong>Duas cópias do app lado a lado:</strong> a <code>develop</code> e a <code>develop</code> com os ramos do admin e do dono, contra a mesma api e o mesmo banco de dev (seed de 15/09), logadas como admin, como o dono Na Praia FTV e, no Suporte, como a Arena Beach Lavras, que tem conversa na seed.</li>
        <li><strong>Vazamento:</strong> todo elemento visível cuja caixa passa da largura da tela. Não conta a gaveta do menu fechada nem o conteúdo das faixas que rolam de lado de propósito (<code>RolagemHorizontal</code>).</li>
        <li><strong>Alvo de toque:</strong> botão, link, campo ou seletor com menos de 44×44px em tela de toque. Caixa de seleção conta como alvo pelo rótulo quando o rótulo tem 44px.</li>
        <li><strong>Contraste:</strong> cor do texto contra a cor de fundo efetiva (somando as camadas transparentes), pela fórmula da WCAG 2.1. Não conta texto desabilitado nem texto sobre gradiente.</li>
        <li><strong>Solicitações do admin</strong> foi medida com a resposta da api simulada no navegador: a seed não tem solicitação pendente, e sem ela os botões de aprovar e rejeitar não aparecem. <strong>A Chamada</strong> foi medida no dia 08/09/2026, com a chamada da aula aberta.</li>
        <li><strong>Critérios</strong> da skill <em>ui-ux-pro-max</em>: sem rolagem lateral, alvo de 44px, 8px entre alvos, 16px nos campos do celular, contraste 4,5:1 e mobile-first adaptado às larguras de corte do <code>telas.ts</code>.</li>
      </ul>
    </div>
  </section>

  <footer>Só+1 · web#511 · gerado a partir das medições de 16/09/2026 · PRs web#513 e web#514</footer>
</div>
'''
open(f'{D}/so-mais-um-no-celular.html', 'w').write(pagina)
print(os.path.getsize(f'{D}/so-mais-um-no-celular.html'))
