# Aplicação da arte

## Tamanho do logotipo

O modo logotipo agora oferece Pequeno, Médio e Grande, com Grande como padrão para produtos sem tamanho salvo. A largura máxima da face aumentou de 1,4 para 1,9 vezes o menor raio da faixa imprimível, ainda abaixo do diâmetro para manter a malha sobre a superfície. A margem interna passou de 6% para 2,5%. Em artes limitadas pela largura, isso aumenta o desenho em aproximadamente 47%, sem alterar a proporção nem recortar o arquivo. Pequeno usa 65% e Médio 82% do tamanho Grande. Artes limitadas pela altura continuam dentro da faixa útil.

O campo opcional `logoSize` fica no JSON existente do produto e é validado pela API. Os gabaritos completos preservam a escala e o posicionamento da versão anterior; o controle de tamanho só aparece no modo logotipo. Não há migração de dados ou alteração do arquivo de arte.

O Silk frente e verso usa duas áreas independentes, com centros a 180°. O padrão para arquivos antigos e novos é repetir o mesmo logotipo nas duas faces. A imagem é ajustada proporcionalmente, preservando suas margens transparentes. A visualização inicia de frente, sem rotação automática, para permitir a leitura.

Na edição, “Gabarito completo” interpreta a metade esquerda do arquivo como a frente e a metade direita como o verso. As duas metades têm a mesma escala e são aplicadas em lados opostos; um lado vazio continua vazio. Enviar apenas a arte final, sem desenhos dos copos, cotas ou linhas de referência. PNG transparente preserva a cor do produto; fundos de JPG não são removidos automaticamente.

Em todos os processos, o modo inicial é logotipo proporcional. Em Digital 360 e Silk 360, o logotipo ocupa uma face; escolher “Gabarito completo (arte 360°)” para envolver o produto com a arte planificada. Arquivos já existentes sem `artMode` usam o modo logotipo, podendo ser alternados na edição sem reenviar a arte. No Silk frente e verso, o logotipo é repetido nas duas faces. O tipo de impressão comercial não é alterado pela escolha de posicionamento.

Cada um dos 18 modelos tem uma faixa vertical própria em `MODEL_PRINT_BANDS`, definida sobre a geometria existente. A garrafa evita os ombros e o gargalo; as taças evitam hastes e bases; as canecas têm um intervalo de impressão na região da alça para arquivos 360°. O espaçamento é visual normalizado, não uma medida de produção confirmada. O ajuste proporcional usa as proporções da área de impressão. Teste `tests/all-print-models.mjs`: cobertura dos 18 modelos e 48 combinações de modelo/processo, limites, proporções e afastamento da alça.

A planilha “Planilha Layout 3D - Ecojoi (1).xlsx”, aba GABARITO, contém imagem identificada como 450 ML. B100:B110 informa área 235,8 × 138,5 mm, margens 3/3,5 mm, emenda 1,5 mm e faces a 180°. Essas medidas não foram atribuídas à taça gin nem a outros modelos: faltam seus gabaritos físicos. As áreas desses produtos continuam estimativas visuais, agora com aplicação legível. A distância entre centros informada de 119,4 mm não equivale exatamente à metade de 235,8 mm; confirmar com a produção antes de calibração dimensional.

Não houve alteração dos modelos geométricos, autenticação, rotas, tabelas, arquivos de arte ou links existentes. `artMode` é um campo opcional no JSON do produto, validado pela API. Sem migração de banco. O componente de visualização é compartilhado pelo rascunho e apresentação pública.
