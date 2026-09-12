# Atualização do acesso — 12/09/2026

O Studio agora possui login próprio com e-mail e senha nas rotas `/` e `/login`. A conta inicial é vinculada ao proprietário já autenticado em `/ativar`, preservando seu identificador e seus designs. `ECOJOI_OWNER_EMAIL` deve ser configurado na hospedagem com o e-mail proprietário autorizado. Depois da ativação, os acessos diários não usam o ChatGPT. `/senha` altera a senha e invalida as sessões anteriores; Sair encerra a sessão atual.

A sessão expira em oito horas e usa cookie HttpOnly, Secure e SameSite=Lax; somente seu hash fica no banco. Senhas usam PBKDF2-SHA256 com salt individual e 100.000 iterações. Há limite de tentativas por conta e IP. Não há cadastro público, envio de e-mails ou recuperação automática de senha. Recuperação administrativa e convites de equipe ainda não foram implementados. Não cadastrar contas no banco com senha em texto puro.

Para exibir a entrada ECOJOI sem a tela anterior da plataforma, a audiência da hospedagem precisa permitir visitantes anônimos. O painel e as artes privadas continuam protegidos pela autenticação da aplicação; apresentações com token válido podem abrir para clientes. A migração 0002 adiciona somente tabelas de autenticação, sem modificar designs ou assets.

Validação local: 17 verificações de autenticação e 27 de integração passaram. `tests/auth.mjs` exige banco local de teste sem a conta seedy@sites.test previamente ativada, migrações aplicadas e ECOJOI_OWNER_EMAIL=seedy@sites.test em .dev.vars. Não executar contra produção. A suíte de integração usa STUDIO_TEST_COOKIE para a sessão local. As seções abaixo registram a implantação original; suas referências ao login exclusivo do ChatGPT foram substituídas por esta atualização.

---

# ECOJOI Studio 3D — aplicação e implantação

Versão de avaliação funcional baseada na inspeção autorizada da conta Designer ECOJOI na Amostra Virtual 3D, em 10 e 11/09/2026.

## Situação da entrega

A aplicação reproduz o fluxo operacional observado: listagem, busca, filtros, ordenação, paginação, cadastro de designs, até cinco produtos, seleção encadeada de impressão/modelo/cor, upload individual de arte, salvamento automático, rascunho 3D e links com validade de 30 dias, renovação, expiração e revogação.

O catálogo foi levantado por navegação dos seletores da conta: **18 modelos, 70 nomes distintos de cores e acabamentos, 48 pares impressão/modelo e 989 combinações impressão/modelo/cor**. Os nomes foram preservados, inclusive variantes semelhantes como ROSA GOLD e ROSE GOLD. Não foram unificados porque aparecem como opções distintas na referência.

**Não se trata de uma cópia idêntica homologada para produção.** Os modelos 3D são aproximações próprias. As medidas, espessuras, alças, bases, materiais, cores físicas e áreas de impressão não foram disponibilizados. A ECOJOI informou não possuir os arquivos 3D e gabaritos. A autenticação desta versão usa o acesso da plataforma Sites/ChatGPT; não replica o login de e-mail e senha do fornecedor. A área administrativa do fornecedor não está disponível no perfil Designer examinado.

## Uso diário

1. Entre no Studio com a conta autorizada.
2. Clique em **Novo design** e informe um nome que identifique o cliente ou trabalho.
3. Clique em **Adicionar produto**. Escolha primeiro a impressão, depois o modelo e a cor. As opções respeitam o catálogo levantado.
4. Envie a arte desse produto. Repita para os demais, até cinco produtos.
5. Aguarde **Todas as alterações salvas**. Em caso de falha, mantenha a página aberta e tente novamente; alterações locais pendentes não devem ser descartadas.
6. Abra **Visualizar rascunho**. Arraste para girar, use a roda para ampliar e o botão de tela cheia quando necessário.
7. Com nome, produto, configuração e arte completos, clique em **Gerar link para o cliente**.
8. Copie o link ou abra o preview. A validade é de 30 dias corridos a partir da criação do link.
9. **Gerar novo link** invalida o endereço anterior. **Expirar** encerra a validade. **Revogar** bloqueia o endereço mantendo o registro da revogação separado da data de expiração.

Na edição, o salvamento é automático após uma breve pausa. Se duas abas alterarem a mesma versão, o servidor rejeita a gravação desatualizada para evitar sobrescrita silenciosa. Nesse caso, copie as alterações que deseja preservar e reabra o design para reconciliar manualmente.

## Publicação e acesso aos clientes

A publicação de avaliação é privada para o proprietário. **Um link gerado não contorna essa restrição da plataforma**: clientes externos não poderão abri-lo enquanto o Site estiver privado.

Para operação com clientes externos, configurar o público autorizado do Site e validar o acesso em um navegador sem sessão. O painel e as APIs de edição exigem identidade, e as consultas são limitadas ao proprietário de cada design. Um token de apresentação só permite leitura do design associado e das artes vinculadas enquanto o token está ativo. A mudança da audiência do Site deve ser feita conscientemente após essa validação.

Para uma equipe compartilhando a mesma carteira, é necessário acrescentar a entidade organização, convites e papéis de equipe. A versão atual separa designs por usuário, como a listagem pessoal observada. Não há módulo administrativo de usuários da ECOJOI nesta entrega.

## Arquivos de arte

Nesta implementação: PNG, JPEG e WebP, até 15 MB. No navegador, limite adicional de 16 megapixels e 8192 pixels por lado. O servidor verifica o tamanho e a assinatura do formato. PDF, CDR, AI e SVG não são aceitos como arte nesta versão. Esses limites são decisões de implementação; não foram confirmados como limites do fornecedor.

Use PNG com transparência para logos recortados. O fundo branco de um JPEG é parte da arte e também aparecerá na simulação. A aplicação não remove fundo, não vetoriza, não separa cores de silk e não gera arquivo de fabricação.

O arquivo é aplicado como uma composição ao redor da superfície imprimível aproximada. O tipo de impressão controla a compatibilidade do catálogo e sua identificação; a calibração específica de cada técnica e os gabaritos frente/verso ainda precisam ser definidos. Esta versão não pode servir para aprovar registro, dimensão ou posicionamento final de produção.

## Calibração para chegar à fidelidade necessária

Para cada um dos 18 modelos, obter uma peça física e registrar:

- Altura total; diâmetro externo em pelo menos cinco alturas; abertura e diâmetro da base.
- Espessura da parede, borda, fundo, detalhes de relevo, alça e tampa quando houver.
- Fotografias frontal, lateral, superior e inferior, com régua no mesmo plano da peça.
- Área imprimível em milímetros para cada técnica, distância da borda e da base, emenda, sangria e margem segura.
- Orientação de frente/verso, afastamento da alça, sentido de leitura e proporção do gabarito.
- Amostras físicas dos acabamentos: opaco, translúcido, cristal, gelado, fosco, degradê, metálico e brilhantes.

Um modelador deverá produzir os modelos medidos com superfície de impressão e mapeamento UV, ou ajustar os perfis geométricos desta base. As formas devem ser comparadas contra fotos e medidas, e os materiais contra amostras sob iluminação controlada. Os valores de cor atuais são estimativas para visualização, não referências Pantone ou valores colorimétricos medidos.

O aceite exige comparar pelo menos uma arte real de cada técnica nos modelos utilizados pela operação, verificando frente, verso, emenda, topo, base e distorção nas curvas. A saída aprovada deve ser versionada por modelo e técnica antes de substituir a rotina atual.

## Organização técnica

- Interface: React, TypeScript, Vinext e componentes acessíveis Radix/Shadcn.
- Visualização: Three.js, malhas por perfis de revolução, materiais físicos, iluminação, câmera orbital e texturas de arte.
- Servidor: Cloudflare Workers, compatível com a plataforma Sites.
- Persistência: D1 para designs e metadados, R2 para arquivos de arte.
- Identidade: cabeçalhos autenticados da plataforma Sites, verificados no servidor pelo helper de autenticação.
- Dados de negócio não usam localStorage. O navegador mantém apenas estado temporário de edição e preferências da interface.

A estrutura de referência do catálogo está em `lib/reference-catalog.json`. Compatibilidade e materiais estimados ficam em `lib/catalog.ts`. O editor e painel estão em `app/studio.tsx`, a visualização em `app/product-viewer.tsx`, e o servidor em `app/api/studio/[...path]/route.ts`.

### Dados

**designs:** identificador, proprietário, nome, produtos em JSON, datas de criação e alteração, validade, revogação, token e número da versão.

**assets:** identificador, design, proprietário, chave do objeto no R2, nome, formato, tamanho e data de criação.

Índices: proprietário/data de criação, token exclusivo e artes por design. SQL parametrizado; verificação de propriedade no servidor; controle de concorrência por versão.

### Endpoints

| Método | Rota | Função |
|---|---|---|
| GET / POST | `/api/studio/designs` | Listar e criar designs do usuário |
| GET / PUT | `/api/studio/designs/:id` | Ler e salvar um design, validando propriedade e versão |
| POST | `/api/studio/designs/:id/assets` | Enviar imagem para o design |
| POST | `/api/studio/designs/:id/publish` | Validar requisitos e gerar novo token por 30 dias |
| POST | `/api/studio/designs/:id/expire` | Encerrar a validade |
| POST | `/api/studio/designs/:id/revoke` | Registrar revogação |
| GET | `/api/studio/public/:token` | Ler apresentação com token ativo |
| GET | `/api/studio/assets/:id` | Ler arte com identidade ou token autorizado |

Nenhum endpoint entrega a lista de designs a visitantes anônimos. O acesso por token é somente leitura. Tokens antigos deixam de funcionar quando renovados. Revogação impede novos acessos; não apaga imagens já visualizadas ou baixadas pelo destinatário.

## Instalação local e publicação

Requisitos: Node.js compatível com `package.json` e npm. O pacote contém o lockfile para instalação reproduzível. Em ambiente convencional, executar na pasta da aplicação:

```text
npm ci
npm run build
```

As migrações são geradas por Drizzle e ficam em `drizzle/`. Para o banco de prévia local, executar uma vez, em ordem:

```text
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_lyrical_shinko_yamashiro.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_moaning_steve_rogers.sql
npm run dev
```

A prévia usa o login local de desenvolvimento do starter. Ele não é uma credencial de produção. O script auxiliar de Windows trata particularidades do ambiente de desenvolvimento e não altera a autenticação de produção.

Na plataforma Sites, usar o projeto indicado em `.openai/hosting.json`, manter os vínculos lógicos `DB` e `BUCKET`, publicar o código validado e aplicar as migrações pela plataforma. O projeto já criado deve ser reutilizado. Não recriar o banco ou reaplicar manualmente migrações já registradas.

**Hospedagem própria fora de Sites:** o servidor confia em cabeçalhos inseridos pelo gateway autenticado da plataforma. Não publicar diretamente esse servidor na internet aceitando cabeçalhos fornecidos pelo visitante. Antes de migrar para outro provedor, substituir a integração de identidade por autenticação confiável e configurar D1/R2, domínio e acesso. O pacote de código não implica uma integração pronta com qualquer hospedagem.

## Verificações realizadas

27 verificações de integração passaram localmente: integridade do catálogo, acesso anônimo bloqueado, origem de escrita bloqueada, criação e persistência, combinações inválidas rejeitadas, limite de cinco produtos, concorrência, imagem falsa rejeitada, upload, vínculo e leitura da arte, requisitos de publicação, 30 dias, leitura por token, proteção dos arquivos, renovação, expiração, revogação e reativação por novo link.

Com o servidor local em execução, repetir usando `node tests/integration.mjs`. O teste recusa endereços externos e cria somente registros de teste locais. Esses registros não são copiados para produção.

A checagem de tipos passou. A compilação de produção também passou, e a versão final é recompilada antes de publicação. A validação visual dos 18 modelos contra peças reais permanece pendente. Não foi realizado um ensaio completo de navegação da nova interface em diferentes navegadores e celulares. As funções opcionais de WebMCP foram implementadas, mas não verificadas em um contexto WebMCP compatível.

## Operação e manutenção

- Separar ambiente de teste de produção e realizar aceite antes de usar com pedidos reais.
- Definir retenção dos arquivos e backups de D1/R2. Ao remover uma arte do design, o vínculo some, mas o objeto é preservado no armazenamento; não há coleta automática de arquivos órfãos nesta versão.
- Exportar dados e arquivos antes de alterações de schema e testar restauração. Não há tela de backup automático no produto.
- Monitorar erros de upload, gravação e carregamento 3D, e acompanhar os custos de armazenamento/tráfego no provedor.
- Controlar atualização do catálogo, versões dos modelos, políticas de acesso e desligamento de colaboradores.
- A busca e a paginação atuais são processadas no navegador após listar os designs do proprietário. Para volumes elevados, migrar filtros e paginação para consultas no servidor.

## Limites do levantamento

Acesso utilizado: perfil Designer ECOJOI, com menus Designs e Novo design. Foram inspecionados o relatório, os formulários de edição e adição de produto, os seletores de todas as combinações, as ações de produtos, o compartilhamento ativo e as apresentações interna e pública. Os trabalhos existentes e seus links não foram modificados, renovados ou revogados durante a inspeção.

Não foram acessados código-fonte privado, banco interno, administração de usuários, integrações ocultas ou recursos de outros perfis. Comportamentos destrutivos e a criação de trabalhos na conta original não foram executados para teste. Limites de upload, processamento interno, política de armazenamento, algoritmo de materiais, gabaritos, animações de todos os produtos e equivalência visual completa não foram confirmados.

Referência consultada: [Amostra Virtual 3D — área Designer](https://www.amostravirtual3d.com.br/designer/previews). A base de renderização usa a [documentação oficial do Three.js](https://threejs.org/docs/).

