// Source: Catálogo ECOJOI 2026_compressed.pdf, 21 pages, approved 22 Sep 2026.
// Dimensions are cm. Missing/conflicting dimensions are documented, never production templates.
export type CatalogueProduct={model:string;page:number;kind:'cup'|'bucks'|'bottle'|'bag'|'gin'|'flute'|'mug'|'paper'|'disposable'|'strap';height:number;mouth:number;base:number;colors:string[];prints:string[];note?:string};
const neon=['Verde Neon','Amarelo Neon','Laranja Neon','Azul Neon','Rosa Neon','Fumê','Roxo Neon','Cristal','Vermelho'];
const eco250=['Amarelo Opaco','Marrom Opaco','Azul Celeste Opaco','Preto Opaco','Bege Opaco','Rosa Opaco','Branco Opaco','Azul Bic','Rosa Bebê',...neon];
const eco450=['Amarelo Opaco','Marrom Opaco','Azul Celeste Opaco','Preto Opaco','Bege Opaco','Rosa Opaco','Branco Opaco','Vermelho Opaco','Dourado','Prata','Verde Bandeira','Azul Bic','Vermelho Rosê',...neon];
const eco600=['Amarelo Canário','Marrom Opaco','Azul Celeste Opaco','Preto Opaco','Bege Opaco','Rosa Opaco','Branco Opaco','Vermelho Opaco','Rosa Bebê','Azul Bic','Verde Bandeira','Vermelho Rosê',...neon];
const silk=['SILK','SILK FRENTE E VERSO'];
const bagColors=['Preta','Natural','Bege','Azul Marinho','Azul Tiffany','Verde Militar','Verde Padrão','Cinza Chumbo','Vermelho Padrão','Laranja Padrão','Marrom','Dourado'];
const paperColors=['Branco','Kraft','Preto'];
const basic=['Branco Opaco','Preto Opaco',...neon];
export const ECOJOI_CATALOGUE:CatalogueProduct[]=[
 {model:'COPO ECO 250 ML COM TAMPA BUCKS',page:4,kind:'bucks',height:9.5,mouth:7.6,base:6,colors:eco250,prints:silk},
 {model:'COPO ECO 250 ML',page:5,kind:'cup',height:8.3,mouth:7.6,base:6,colors:eco250,prints:silk},
 {model:'COPO ECO 450 ML COM TAMPA BUCKS',page:6,kind:'bucks',height:15.7,mouth:7.6,base:5.4,colors:['Amarelo Opaco','Marrom Opaco','Azul Celeste Opaco','Preto Opaco','Bege Opaco','Rosa Opaco','Branco Opaco','Vermelho Opaco','Verde B','Rosa Bebê',...neon],prints:silk},
 {model:'COPO ECO 450 ML',page:7,kind:'cup',height:14.5,mouth:7.6,base:5.4,colors:eco450,prints:silk},
 {model:'COPO ECO 600 ML',page:8,kind:'cup',height:15.4,mouth:8.4,base:6.3,colors:eco600,prints:silk},
 {model:'GARRAFA ECOBIO 500 ML',page:9,kind:'bottle',height:20,mouth:7,base:6,colors:['Preto Opaco','Amarelo Opaco','Marrom Opaco','Azul Celeste Opaco','Bege Opaco','Rosa Bebê','Rosa Opaco','Branco Opaco','Vermelho Opaco',...neon],prints:silk},
 {model:'ECOBAG PARA BEBIDAS 26 × 44 CM',page:10,kind:'bag',height:26,mouth:44,base:33,colors:bagColors,prints:silk,note:'Largura 44 cm; profundidade e base aproximadas pela foto.'},
 {model:'ECOBAG PARA BEBIDAS 16 × 40 CM',page:10,kind:'bag',height:16,mouth:40,base:30,colors:bagColors,prints:silk,note:'Largura 40 cm; profundidade e base aproximadas pela foto.'},
 {model:'TAÇA GIN 550 ML',page:11,kind:'gin',height:20,mouth:10,base:8,colors:['Preto Opaco','Rosa Opaco','Branco Opaco','Verde Neon','Vermelho Neon','Cristal'],prints:silk},
 {model:'TAÇA PRIME 170 ML',page:12,kind:'flute',height:21.65,mouth:5.8,base:6.4,colors:['Branco Opaco','Preto Opaco','Rosa Opaco','Cristal','Vermelho Neon'],prints:silk},
 {model:'COPO LONG DRINK 330 ML',page:13,kind:'cup',height:15,mouth:6.5,base:5,colors:['Branco Opaco','Preto Opaco','Rosa Opaco','Verde Bandeira','Azul Bic','Amarelo Canário','Dourado','Prata',...neon],prints:silk,note:'Usadas cotas do desenho (15 × 6,5 × 5 cm); ficha textual da mesma página diverge.'},
 {model:'CANECA CHOPP 500 ML',page:14,kind:'mug',height:10.8,mouth:6.5,base:6.5,colors:['Branco Opaco','Preto Opaco','Cristal'],prints:silk},
 {model:'COPO TWISTER 500 ML',page:15,kind:'cup',height:14.6,mouth:9,base:6.3,colors:basic,prints:silk},
 {model:'COPO VISUAL DRINK 500 ML',page:16,kind:'cup',height:14.6,mouth:9,base:6.3,colors:basic,prints:silk},
 {model:'COPO DESCARTÁVEL DE PAPEL 110 ML',page:18,kind:'paper',height:6,mouth:6.2,base:4.6,colors:paperColors,prints:['PERSONALIZAÇÃO FRENTE']},
 {model:'COPO DESCARTÁVEL DE PAPEL 200 ML',page:18,kind:'paper',height:7.8,mouth:7.3,base:5,colors:paperColors,prints:['PERSONALIZAÇÃO FRENTE']},
 ...[330,440,550,770].map(volume=>({model:`COPO DESCARTÁVEL ${volume} ML`,page:19,kind:'disposable' as const,height:12*Math.cbrt(volume/330),mouth:8*Math.cbrt(volume/330),base:5.2*Math.cbrt(volume/330),colors:['Cristal'],prints:['SILK FRENTE E VERSO'],note:'Página informa capacidade, sem cotas; proporções visuais aproximadas.'})),
 {model:'TIRANTE 100 × 2 CM',page:20,kind:'strap',height:100,mouth:2,base:2,colors:['Branco'],prints:['SUBLIMAÇÃO'],note:'Fita aberta de 100 × 2 cm. Impressão sem escala física de fabricação.'},
];
export const catalogueProduct=(model:string)=>ECOJOI_CATALOGUE.find(p=>p.model===model);
