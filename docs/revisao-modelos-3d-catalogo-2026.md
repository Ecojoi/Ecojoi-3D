# Conferência visual dos modelos 3D — catálogo ECOJOI 2026

Referência: **Catálogo ECOJOI - 2026 (1).pdf**, 21 páginas, com fotografias e cotas. Esta revisão preserva a interface, estrutura dos dados, edição e apresentação do projeto. Geometrias permanecem procedurais em Three.js.

## Revisão por produto

| Produto | Página | Geometria / detalhe desta revisão |
| --- | --- | --- |
| Copo ECO 250 ml com tampa Bucks | 4 | corpo levemente cônico, base e boca dimensionais, borda reforçada e tampa com relevo |
| Copo ECO 250 ml | 5 | corpo cônico arredondado, base e borda |
| Copo ECO 450 ml com tampa Bucks | 6 | corpo alto cônico, tampa e proporções de altura do corpo |
| Copo ECO 450 ml | 7 | cone sutil, boca larga e base menor |
| Copo ECO 600 ml | 8 | boca maior que base, fundo arredondado e borda reforçada |
| Garrafa Ecobio 500 ml | 9 | corpo cilíndrico, base arredondada, tampa preta e bico basculante aberto |
| Ecobag para bebidas 26 x 44 cm | 10 | corpo achatado trapezoidal, abertura real na alça e superfície frontal plana |
| Ecobag para bebidas 16 x 40 cm | 10 | corpo achatado trapezoidal, abertura real na alça e superfície frontal plana |
| Taça Gin 550 ml | 11 | pé circular, haste e bojo aberto curvo |
| Taça Prime 170 ml | 12 | pé, haste longa, taça estreita e borda discreta |
| Copo Long Drink 330 ml | 13 | desenho cônico alto conforme ilustração cotada (há divergência com o texto) |
| Caneca Chopp 500 ml | 14 | corpo cilíndrico e alça retangular vazada, sem alça oval genérica sobreposta |
| Copo Twister 500 ml | 15 | parede cônica translúcida com irregularidade sutil |
| Copo Visual Drink 500 ml | 16 | perfil do mesmo tipo de copo ilustrado, com variação suave de superfície |
| Copo descartável papel 110 ml | 18 | corpo de papel cônico com tampa de vedação preta |
| Copo descartável papel 200 ml | 18 | corpo de papel cônico com tampa de vedação preta |
| Copo descartável 330 ml | 19 | copo leve de parede fina, boca reforçada e pé com anéis |
| Copo descartável 440 ml | 19 | idem |
| Copo descartável 550 ml | 19 | idem |
| Copo descartável 770 ml | 19 | idem |
| Tirante 100 x 2 cm | 20 | prévia de fita planificada preservada: geometria de lanyard montado ainda não calibrada |

## Divergências do material de origem

- **Long Drink, página 13:** desenho cotado indica 15 cm de altura; texto descritivo informa 10,8 cm. A base descrita como 6,5 cm diverge da fotografia afunilada. O visual segue a ilustração e a fotografia; confirmar dimensões da peça na produção antes do uso como referência física.
- **Copo Twister e Visual Drink, páginas 15–16:** fotografias e cotas semelhantes; falta vista lateral/rotação completa para separar com precisão os eventuais relevos.
- **Copos descartáveis 330, 440, 550 e 770 ml:** o catálogo não traz dimensões individuais, portanto continuam aproximados com base nas capacidades e imagens.
- **Ecobags:** largura e altura constam no catálogo, mas espessura e desenho do recorte não estão cotados; o corpo foi reconstruído visualmente.
- **Garrafa Ecobio:** o bico e a tampa são reconstruções das fotos. Altura do bico quando aberto não está cotada.
- **Tirante:** a fita é exibida em estado aberto por compatibilidade com a personalização; não é réplica física do acessório com mosquetão mostrado na foto.

## Validação antes da publicação

1. Rodar `node --experimental-strip-types tests/catalogue-geometry.mjs` com dependências instaladas.
2. Rodar os testes existentes de impressão e catálogo.
3. Conferir cada item na prévia 3D em quatro ângulos e compará-lo visualmente com a página do catálogo correspondente.
4. Validar presencialmente as dimensões faltantes com régua/paquímetro ou foto ortogonal e atualizar os perfis para uso em produção.
5. Publicar somente depois da aprovação visual do comercial.

Esta revisão não altera autenticação, banco de dados, URLs, produtos salvos, gabaritos PDF ou identidade visual da aplicação. Modelagem baseada em fotos **não é idêntica ao molde industrial** sem CAD ou digitalização da peça.
