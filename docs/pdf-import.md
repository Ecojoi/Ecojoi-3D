# Importação de PDF

O seletor e o arraste de arquivos aceitam PDF até 15 MB. A janela mostra uma prévia e permite escolher uma página. Confirmar converte a página em PNG transparente e usa o envio existente, com as mesmas regras de autenticação e armazenamento. O PDF original não é enviado ou armazenado; permanece com o usuário. A arte atual só é trocada quando o envio da nova imagem termina.

PDF.js 6.3.289 é carregado sob demanda. Worker, fontes, CMaps e WebAssembly são servidos pela própria aplicação em caminho com versão. O script prepare-pdf.mjs prepara esses arquivos antes de desenvolvimento e build; public/pdfjs é gerado e ignorado no Git. Documentação: https://mozilla.github.io/pdf.js/examples/

A página usa até 300 dpi, limitada a 4096 pixels no maior lado, e mantém a proporção. O contexto de canvas tem alpha:true para evitar fundo preto. Branco desenhado no PDF é preservado. O PNG deve ter até 15 MB; os limites já existentes do servidor continuam ativos. O arquivo recebe sufixo -pagina-N.png. Cotas, linhas e rótulos presentes no PDF também aparecem: enviar a arte final. Não há extração seletiva de elementos vetoriais, remoção automática de fundo branco ou armazenamento do PDF de produção.

Arquivos protegidos por senha e PDFs inválidos são tratados com mensagens. Cancelar fecha a janela e encerra o processamento; trocar de página invalida a conversão anterior. Nenhuma migração de banco ou alteração dos modelos 3D foi necessária.

Validação local em 16/09/2026: PDF de duas páginas composto pelos gabaritos Gin e Prime; primeira página renderizada com transparência, seleção da segunda página, confirmação em PNG de 1771 × 472 pixels. PDF protegido mostrou mensagem específica e confirmação desabilitada; cancelar preservou a imagem previamente confirmada. A rota temporária de teste foi removida antes do build.
