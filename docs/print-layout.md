# Aplicação da arte

## Catálogo confirmado em 22/09/2026

Fonte: Catálogo ECOJOI 2026_compressed.pdf, versão de 21 páginas confirmada pelo usuário. Agora são 21 opções, incluindo duas Ecobags, tirante e seis descartáveis. A lista nova usa `ecojoi-catalog.ts`; os catálogos anteriores permanecem como compatibilidade, sem migração dos designs. As escolhas antigas não aparecem em novos produtos. A integração anterior do GitHub (8b31dd6, 18 recipientes) também é aceita para reabrir seus produtos e cores.

As medidas, páginas e limitações estão junto dos produtos. Long Drink usa o desenho cotado (15 × 6,5 × 5 cm), que diverge da ficha textual da mesma página. Descartáveis de 330/440/550/770 ml não têm cotas e usam proporções aproximadas. Ecobags usam corpo elíptico com profundidade estimada; tirante mostra a fita aberta. Modelos são simulações, não moldes de fabricação.

O salvamento compara campos editáveis em ordem fixa, ignorando a ordem dos campos JSON e metadados de arquivos retornados pelo servidor. O envio de arte persiste a associação antes de confirmar sucesso; pedidos têm prazo de 60 segundos e o diálogo de PDF permite tentar novamente após falha.


## Tamanho do logotipo

O modo logotipo agora oferece Pequeno, Médio e Grande, com Grande como padrão para produtos sem tamanho salvo. A largura máxima da face aumentou de 1,4 para 1,9 vezes o menor raio da faixa imprimível, ainda abaixo do diâmetro para manter a malha sobre a superfície. A margem interna passou de 6% para 2,5%. Em artes limitadas pela largura, isso aumenta o desenho em aproximadamente 47%, sem alterar a proporção nem recortar o arquivo. Pequeno usa 65% e Médio 82% do tamanho Grande. Artes limitadas pela altura continuam dentro da faixa útil.

O campo opcional `logoSize` fica no JSON existente do produto e é validado pela API. Os gabaritos completos preservam a escala e o posicionamento da versão anterior; o controle de tamanho só aparece no modo logotipo. Não há migração de dados ou alteração do arquivo de arte.

O Silk frente e verso usa duas áreas independentes, com centros a 180°. O padrão para arquivos antigos e novos é repetir o mesmo logotipo nas duas faces. A imagem é ajustada proporcionalmente, desconsiderando margens totalmente transparentes apenas no enquadramento da logo. A visualização inicia de frente, sem rotação automática, para permitir a leitura.

Na edição, “Gabarito completo” interpreta a metade esquerda do arquivo como a frente e a metade direita como o verso. As duas metades têm a mesma escala e são aplicadas em lados opostos; um lado vazio continua vazio. Enviar apenas a arte final, sem desenhos dos copos, cotas ou linhas de referência. PNG transparente preserva a cor do produto; fundos de JPG não são removidos automaticamente.

Em todos os processos, o modo inicial é logotipo proporcional. Em Digital 360 e Silk 360, o logotipo ocupa uma face; escolher “Gabarito completo (arte 360°)” para envolver o produto com a arte planificada. Arquivos já existentes sem `artMode` usam o modo logotipo, podendo ser alternados na edição sem reenviar a arte. No Silk frente e verso, o logotipo é repetido nas duas faces. O tipo de impressão comercial não é alterado pela escolha de posicionamento.

Cada um dos 18 modelos tem uma faixa vertical própria em `MODEL_PRINT_BANDS`, definida sobre a geometria existente. A garrafa evita os ombros e o gargalo; as taças evitam hastes e bases; as canecas têm um intervalo de impressão na região da alça para arquivos 360°. O espaçamento é visual normalizado, não uma medida de produção confirmada. O ajuste proporcional usa as proporções da área de impressão. Teste `tests/all-print-models.mjs`: cobertura dos 18 modelos e 48 combinações de modelo/processo, limites, proporções e afastamento da alça.

A planilha “Planilha Layout 3D - Ecojoi (1).xlsx”, aba GABARITO, contém imagem identificada como 450 ML. B100:B110 informa área 235,8 × 138,5 mm, margens 3/3,5 mm, emenda 1,5 mm e faces a 180°. Essas medidas não foram atribuídas à taça gin nem a outros modelos: faltam seus gabaritos físicos. As áreas desses produtos continuam estimativas visuais, agora com aplicação legível. A distância entre centros informada de 119,4 mm não equivale exatamente à metade de 235,8 mm; confirmar com a produção antes de calibração dimensional.

Não houve alteração dos modelos geométricos, autenticação, rotas, tabelas, arquivos de arte ou links existentes. `artMode` é um campo opcional no JSON do produto, validado pela API. Sem migração de banco. O componente de visualização é compartilhado pelo rascunho e apresentação pública.

## Conferência dos PDFs de produção - 14/09/2026

A Taça Prime no modo gabarito frente/verso reconhece a proporção 150 × 40 mm (tolerância de 0,4%) e usa duas regiões de 57,16 × 40 mm nas extremidades. O vão central de 35,68 mm fica fora das faces. Outras proporções mantêm a divisão em metades. Enviar a arte final sem contornos, cotas ou rótulos. Essas medidas descrevem o arquivo fornecido, não uma nova calibração do corpo 3D.

Em modo logotipo, todos os produtos enquadram os pixels visíveis, excluindo somente margens de alfa zero. Pixels brancos, detalhes claros e semitransparentes são mantidos. Há um pixel de segurança na máscara, limitada a 4096 pixels no maior lado; os dados originais continuam intactos. Arquivos opacos, vazios e gabaritos completos mantêm suas margens. A repetição frente/verso usa exatamente o mesmo enquadramento. O ajuste Pequeno/Médio/Grande continua disponível.

Referências dimensionais extraídas dos contornos dos PDFs: gin 308 × 35 mm; Long Drink 170 × 125 mm; Eco 600 área útil 222 × 132 mm e total 242 × 150 mm. Não foram convertidas automaticamente em medidas físicas nos corpos normalizados: falta confirmar escala, posicionamento e processo. USIJET 450/600 tem curvas e sangria próprias, e não pode ser interpretado como retângulo. Caneca sem capacidade, Eco 250, Garrafa Eco e Balde também aguardam equivalência/cotas. O fotolito descartável 400 é arte, não delimitador de área útil. O gabarito acrílico 500 não veio no RAR.

Esta atualização não modifica banco, autenticação, usuários, modelos geométricos ou arquivos de arte. Ela muda o enquadramento exibido das logos com transparência e das folhas Prime reconhecidas, inclusive em links já existentes.

## Prévia durante a edição

Cada cartão de produto mostra o mesmo renderizador da apresentação, ligado aos campos em edição. Em telas largas, arte e prévia ficam lado a lado; em telas estreitas ficam empilhadas. O diálogo de configuração também mostra modelo e cor antes de salvar, sem persistir alterações canceladas. Rotação e zoom são mantidos para alterações no mesmo modelo. A renderização pausa fora da tela e libera recursos ao desmontar. Nenhum dado de design ou esquema de banco foi alterado.

A curvatura inferior da Gin segue a silhueta arredondada da página 11. O diâmetro externo da tampa Bucks usa os 7,8 cm das páginas 4/6. Texturas, espessuras e detalhes sem cotas permanecem estimativas visuais, não especificações do molde físico.

## Preparação da logo e remoção de fundo
Todas as novas importações raster e páginas de PDF passam pela preparação em PNG antes do envio. A remoção de fundo claro conectado às bordas vem ativada; tolerância e opção de remover todos os tons claros podem ser conferidas na comparação com o original. Áreas brancas internas são preservadas por padrão. Transparência existente, proporções e resolução são mantidas. Não é segmentação de fotografias: fundos coloridos/quadriculados desenhados exigem outra arte ou tratamento externo.
O botão Remover fundo abre a mesma preparação para artes já anexadas. Cancelar não substitui a arte; Aplicar PNG usa o upload existente, sem exclusão do arquivo original, alteração do banco ou dos links. A conversão é local ao navegador. Arquivos vazios após tratamento e PNGs acima do limite são rejeitados, e erros de envio permitem nova tentativa.

## Acabamento por família de produto
Copos ECO e ECOLOGIC (inclusive com tampa Bucks e designs antigos) usam superfície fosca, sem clearcoat, reflexo especular ou metalização. Acrílicos e demais modelos mantêm o acabamento anterior. Códigos de cor, transparência, arte, geometria e iluminação permanecem iguais. O mesmo material é usado na edição e nas apresentações compartilhadas.


## Proteção contra corte em frente e verso
Antes de dividir um gabarito, o visualizador verifica se há arte nos dois painéis e se a separação entre eles está vazia (incluindo o intervalo próprio da Taça Prime). Uma logo única que atravessa o corte, um painel vazio ou conteúdo no intervalo da Prime faz a arte inteira ser repetida em lados opostos. A edição informa esse ajuste; os arquivos, links e escolhas armazenadas não são regravados. O encaixe usa proporção original e limites de impressão existentes. Gabaritos de duas faces com separação vazia mantêm seu posicionamento.
A detecção auxilia a visualização, não valida medidas físicas ou intenção do arquivo. Logotipo igual nas duas faces continua sendo o modo explícito para repetir uma marca. Arquivos ambíguos devem ser preparados com duas áreas separadas e sem linhas de gabarito.
