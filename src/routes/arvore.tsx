import { Route, Navigate } from 'react-router-dom'

import {
  FullPageLoader, PublicRoute, PrivateRoute, PartidaShell,
  AdminRoute, OwnerRoute, AdminPanelLayout, OwnerPanelLayout,
} from './shells'
import { Suspense } from 'react'
import MainLayout from '../components/MainLayout'
import PlanGate from '../components/PlanGate'
import {
  Register, ForgotPassword, ResetPassword, OwnerAccess,
  Home, Profile, QueroJogar, DayUses, CriarPartida, Tournaments, MinhasPartidas,
  Historico, Avaliacoes, PartidaDetail, TournamentDetail, Times, TimeDetail, Jogador, Amigos,
  ConviteDeProfessor,
  ConviteDeEspaco, DesignSystem, AreaDoProfessor,
  AdminDashboard, AdminUsers, AdminRequests, AdminPlaces, AdminSubscriptions, AdminSuporte,
  OwnerDashboard, OwnerPlans, OwnerPlaces, OwnerInventory, OwnerEquipment, OwnerRequests, OwnerCourts,
  OwnerProfessores,
  OwnerTurmas,
  OwnerDayUses,
  OwnerEntradasDoDayUse,
  OwnerAlunos,
  OwnerChamada,
  OwnerMensalidades,
  OwnerSuporte,
} from './paginas'

/**
 * A árvore de rotas, fora do componente.
 *
 * Fica exportada porque é a **única fonte de verdade sobre quantas rotas o app
 * tem**, e o README anuncia esse número. Contá-lo por regex sobre este arquivo
 * é o erro que a api documentou em `verifica-numeros-do-readme.ts` — foi assim
 * que quatro issues inválidas nasceram lá. Com a árvore exportada,
 * `createRoutesFromElements` a percorre de verdade, e a conferência lê o que o
 * roteador leria.
 *
 * O `<Routes>` aceita um fragmento e recursa nele, então mover isto para cá
 * não muda o que é montado — só dá nome ao que já existia.
 */
export const arvoreDeRotas = (
  <>
    {/* Público — sem layout, fallback de tela cheia */}
    {/* A raiz é o login. Até a #225 ela era uma intro animada de 4s que todo
        mundo pagava, inclusive quem já estava logado — que ainda passava por
        /login antes de o PublicRoute mandá-lo para a área dele. */}
    <Route path="/"                element={<Suspense fallback={<FullPageLoader />}><PublicRoute><Register initialMode="login"    /></PublicRoute></Suspense>} />
    <Route path="/login"           element={<Suspense fallback={<FullPageLoader />}><PublicRoute><Register initialMode="login"    /></PublicRoute></Suspense>} />
    <Route path="/register"        element={<Suspense fallback={<FullPageLoader />}><PublicRoute><Register initialMode="register" /></PublicRoute></Suspense>} />
    <Route path="/esqueci-senha"   element={<Suspense fallback={<FullPageLoader />}><PublicRoute><ForgotPassword /></PublicRoute></Suspense>} />
    <Route path="/redefinir-senha" element={<Suspense fallback={<FullPageLoader />}><PublicRoute><ResetPassword  /></PublicRoute></Suspense>} />
    <Route path="/seja-parceiro"   element={<Suspense fallback={<FullPageLoader />}><OwnerAccess /></Suspense>} />
    {/* O convite de professor (api#451). Fora do bloco privado de propósito: o
        `GET /place-invites/verify` é público, e quem ainda não tem conta precisa
        ver de quem é o convite antes de decidir se vale se cadastrar. */}
    <Route path="/convite-professor" element={<Suspense fallback={<FullPageLoader />}><ConviteDeProfessor /></Suspense>} />
    {/* O link de convite do espaço (api#509). Fora do bloco privado pelo mesmo
        motivo, e é outra tela: lá se aceita um convite endereçado, aqui se usa
        uma credencial ao portador — quem tiver o link entra, e não há o que
        recusar. */}
    <Route path="/convite-espaco" element={<Suspense fallback={<FullPageLoader />}><ConviteDeEspaco /></Suspense>} />
    {/* O catálogo do vocabulário visual (#430). Público e fora de todo menu:
        não mostra dado de ninguém, e é na URL de preview do PR que a revisão de
        desenho acontece. Sem `PublicRoute` de propósito — aquele redireciona
        quem já tem sessão para a área dele, e quem constrói costuma estar
        logado justamente quando quer abrir isto. */}
    <Route path="/design-system" element={<Suspense fallback={<FullPageLoader />}><DesignSystem /></Suspense>} />

    {/* Área do jogador — MainLayout monta uma vez e persiste entre estas rotas */}
    <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
      <Route path="/home"            element={<Home />} />
      <Route path="/perfil"          element={<Profile />} />
      <Route path="/quero-jogar"     element={<QueroJogar />} />
      <Route path="/day-uses"        element={<DayUses />} />
      <Route path="/criar-partida"    element={<CriarPartida />} />
      <Route path="/torneios"        element={<Tournaments />} />
      <Route path="/torneios/:id"    element={<TournamentDetail />} />
      <Route path="/minhas-partidas"  element={<MinhasPartidas />} />
      <Route path="/historico"       element={<Historico />} />
      <Route path="/avaliacoes"      element={<Avaliacoes />} />
      <Route path="/times"           element={<Times />} />
      <Route path="/times/:teamId"   element={<TimeDetail />} />
      {/* Fica no menu, e não numa aba do perfil: perfil é onde se configura a
          conta, e amigos é onde se usa o produto. Ver o comentário da página. */}
      <Route path="/amigos"          element={<Amigos />} />
      {/* A área do professor (api#451). Dentro do MainLayout, e não num painel
          próprio: a decisão B daquela issue diz que o professor continua
          `PLAYER` e ganha uma área A MAIS, não uma no lugar da outra. A porta é
          o vínculo, e quem a guarda é a api — `isProfessor` responde 403 a quem
          não dá aula em lugar nenhum. */}
      <Route path="/professor"       element={<AreaDoProfessor />} />
      {/* A página de outra pessoa (web#375). Autenticada: seguir exige sessão,
          e uma versão pública sem o botão seria a mesma tela sem o motivo dela. */}
      <Route path="/jogador/:userId" element={<Jogador />} />
    </Route>

    {/* Painel Admin */}
    <Route
      path="/admin"
      element={
        <AdminRoute>
          <AdminPanelLayout />
        </AdminRoute>
      }
    >
      <Route index               element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="dashboard"    element={<AdminDashboard />} />
      <Route path="users"        element={<AdminUsers />} />
      <Route path="requests"     element={<AdminRequests />} />
      <Route path="places"       element={<AdminPlaces />} />
      {/* As assinaturas, e o registro do Pix recebido por fora (api#537).
          Fica no painel admin porque é a equipe do Só+1 que recebe — o dono
          não registra o próprio pagamento. */}
      <Route path="subscriptions" element={<AdminSubscriptions />} />
      {/* A caixa do suporte (web#473). No painel admin porque quem responde aos
          donos é a equipe. Uma rota só, com o id opcional: com ele, a conversa
          abre ao lado da lista, e trocar de conversa não desmonta a caixa. */}
      <Route path="suporte/:conversaId?" element={<AdminSuporte />} />
    </Route>

    {/* Painel Owner */}
    <Route path="/owner" element={<OwnerRoute><OwnerPanelLayout /></OwnerRoute>}>
      <Route index                      element={<Navigate to="/owner/dashboard" replace />} />
      <Route path="dashboard"           element={<OwnerDashboard />} />
      <Route path="plans"               element={<OwnerPlans />} />
      <Route path="places"              element={<OwnerPlaces />} />
      <Route path="places/:placeId/courts" element={<OwnerCourts />} />
      {/* Convites de professor (api#451). Sem `PlanGate`, e continua sem depois
          de a api#531 ter portado a escolinha: a assinatura é do dono do
          espaço, e o professor é prestador — ele não assina nada. Trancá-la
          aqui deixaria um dono adimplente de ontem sem dar acesso a quem já dá
          aula na quadra dele hoje.

          Sem `:placeId` no caminho: a tela está no menu, e menu não carrega
          parâmetro. O espaço vem do seletor, com `?placeId=` na URL — mesmo
          desenho do Estoque e dos Equipamentos. */}
      <Route path="professores"           element={<OwnerProfessores />} />
      {/* As turmas do espaço (api#472), sob `ESCOLINHA` desde a api#531. Até lá
          a escolinha inteira vinha junto do degrau de entrada — não por
          decisão, mas porque foi entregue depois de a grade ser desenhada.

          Sem `:placeId` no caminho: a tela está no menu, e menu não carrega
          parâmetro — o espaço vem do seletor, com `?placeId=` na URL. */}
      <Route path="turmas"                element={<PlanGate funcionalidade="ESCOLINHA"><OwnerTurmas /></PlanGate>} />
      {/* O day use da quadra (api#505), sob `DAY_USE` desde a api#531.

          Funcionalidade própria, e não junto da escolinha: o day use vende
          sozinho — quadra que só aluga hora ganha dinheiro com ele sem nunca
          abrir uma turma.

          Sem `:placeId` no caminho: a tela está no menu, e menu não carrega
          parâmetro — o espaço vem do seletor, com `?placeId=` na URL. */}
      <Route path="day-uses"              element={<PlanGate funcionalidade="DAY_USE"><OwnerDayUses /></PlanGate>} />
      {/* Aqui o `:dayUseId` VAI no caminho: esta tela não está no menu, então a
          regra de "menu não carrega parâmetro" não se aplica. O `placeId`
          continua na query, porque é dele que a api precisa na URL da rota —
          mesmo desenho dos alunos da turma. */}
      <Route path="day-uses/:dayUseId/entradas" element={<PlanGate funcionalidade="DAY_USE"><OwnerEntradasDoDayUse /></PlanGate>} />
      {/* Os alunos de uma turma (api#474). Aqui o `:turmaId` **vai no caminho**:
          diferente da lista de turmas, esta tela não está no menu, então a
          regra de "menu não carrega parâmetro" não se aplica. O `placeId`
          continua na query, porque é dele que a api precisa na URL da rota. */}
      <Route path="turmas/:turmaId/alunos" element={<PlanGate funcionalidade="ESCOLINHA"><OwnerAlunos /></PlanGate>} />
      {/* A chamada **não** tem `PlanGate`, e é a única tela da escolinha sem.

          A api deixou `chamada.routes` e `aula.routes` fora do portão de
          propósito (api#531): o plano decide o que o dono pode montar, não
          decide que a aula de amanhã deixe de ter chamada. Um cadeado aqui
          contradiria a api e deixaria o professor sem marcar presença porque o
          dono desceu de degrau — e a chamada que não acontece é a que ninguém
          recupera depois.

          Chegar nesta tela pelo menu passa por Turmas, que é portada. Quem
          chega é quem tem o link — o professor, ou o dono que o guardou. */}
      <Route path="turmas/:turmaId/chamada" element={<OwnerChamada />} />
      <Route path="turmas/:turmaId/mensalidades" element={<PlanGate funcionalidade="ESCOLINHA"><OwnerMensalidades /></PlanGate>} />
      {/* O portão fica na rota, e não só dentro da página: sem isso, chegar pela
          URL abriria a tela que o menu marca com cadeado. A API recusa de qualquer
          jeito, mas o dono veria a tela montar e as chamadas falharem uma a uma. */}
      <Route path="inventory"           element={<PlanGate funcionalidade="ESTOQUE"><OwnerInventory /></PlanGate>} />
      <Route path="equipment"           element={<PlanGate funcionalidade="EQUIPAMENTOS"><OwnerEquipment /></PlanGate>} />
      <Route path="requests"            element={<OwnerRequests />} />
      {/* A conversa com a equipe (web#472). **Sem `PlanGate`**, nem gate de
          assinatura: o dono vencido é quem mais precisa falar com a gente, e a
          api também não passa a conversa por gate nenhum (api#571). */}
      <Route path="suporte"             element={<OwnerSuporte />} />
    </Route>

    {/* Fallback */}
    {/* Fora do bloco privado de propósito — ver `PartidaShell`. A rota
        precisa vir antes do catch-all, que manda tudo para o login. */}
    <Route element={<PartidaShell />}>
      <Route path="/partida/:eventId" element={<PartidaDetail />} />
    </Route>

    <Route path="*" element={<Navigate to="/login" replace />} />
  </>
)
