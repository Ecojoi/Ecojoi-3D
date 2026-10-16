# Paletas em tempo real

Os controles aproveitam o catálogo, upload, autenticação e salvamento existentes. Não há migração de banco ou alteração de geometria. Uploads novos preservam a imagem original e salvam separadamente até quatro cores de tinta. As cores são contadas em grupos RGB de 16 níveis por canal para reduzir a influência de pequenas variações. A tinta 1 é a mais frequente; todos os grupos excedentes usam essa tinta. Transparência não conta como tinta. A redução é uma simulação raster, não uma separação vetorial para fabricação.

Designs antigos mantêm sua aparência até aplicar a paleta. A apresentação compartilhada permite experimentar cores localmente; alterações definitivas continuam restritas à edição autenticada. O servidor valida de uma a quatro tintas e mantém o controle existente de conflitos por versão.

## Publicação e sincronização

A configuração encontrada usa Sites/Cloudflare, com D1 e R2. Não foi encontrada configuração de cPanel. Esta alteração não cria uma conexão entre cPanel, ChatGPT e Work, nem publica automaticamente comandos do chat.

Para configurar essa conexão, é necessário identificar qual hospedagem serve o domínio, o ambiente compatível com o servidor e armazenamento existentes e o mecanismo autorizado de implantação. Depois, deve-se definir um único repositório como fonte, implantação rastreável e retorno de estado. Não substituir D1/R2 por uma hospedagem cPanel sem planejar a compatibilidade. Não registrar credenciais no repositório.
