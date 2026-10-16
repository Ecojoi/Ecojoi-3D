# Recuperação de senha · ECOJOI Studio 3D

## Como funciona
1. Na tela de login, clique em **Esqueceu sua senha? Redefinir por e-mail**.
2. Informe o e-mail de uma conta ativa e abra a mensagem enviada pelo Studio.
3. Use o link, válido por **20 minutos**, para criar uma senha de 12 a 128 caracteres.
4. Volte ao login e entre com a nova senha. As sessões antigas serão encerradas.

A opção usa token aleatório de 256 bits, armazenado somente pelo hash SHA-256, e consumido em um único uso. Contas existentes, designs, artes e papéis não são alterados.

## Configuração obrigatória para colocar em produção
A tela de recuperação não envia mensagens por si só. O servidor deve ter um provedor de e-mail configurado:

1. Aplicar a migração **drizzle/0003_password_reset.sql** ao D1 **DB** usado em produção. A migração está registrada no journal e no snapshot Drizzle. É preciso seguir o mecanismo de migração do ambiente de hospedagem e confirmar que ela foi aplicada antes de publicar o código.
2. Configurar a variável secreta **RESEND_API_KEY** no serviço que hospeda a aplicação. Não colocar a chave no GitHub, navegador, log ou conversa.
3. Configurar a variável de servidor **ECOJOI_RESET_FROM** com um remetente verificado no Resend, por exemplo ECOJOI Studio 3D <acesso@ecojoi.com.br>, somente depois de verificar o domínio.
4. Confirmar que a URL oficial é **https://3d.ecojoi.com.br**. Links de redefinição apontam exclusivamente para esse domínio.
5. Validar com uma conta de teste. Usar link de recuperação somente no próprio e-mail, sem compartilhá-lo em capturas de tela.

Sem remetente e chave configurados, a API de solicitação retorna 503 e informa que a recuperação está indisponível. Não promete envio fictício.

## Proteções de segurança
- 20 minutos de validade e uso único do link.
- Respostas genéricas para e-mails inexistentes, evitando revelar contas cadastradas.
- Limite por IP e por endereço de e-mail, utilizando a tabela atual de tentativas.
- Rejeição de requisições de outra origem e de corpos grandes.
- Ao redefinir: novo PBKDF2-SHA256 com salt, revogação de sessões e links pendentes.
- Somente contas ativas podem solicitar e concluir redefinição.
- Cabeçalho no-store nas APIs e no-referrer na página de redefinição.
- Senhas legadas com menos de 12 caracteres podem ser verificadas no login, mas senhas novas continuam exigindo 12 caracteres ou mais.
- Não há reset de senha sem comprovação de posse do e-mail cadastrado.

## Testes e implantação
Executar testes de autenticação e migrações em **ambiente local**, testar recuperação completa em homologação com um domínio de envio verificado e revisar os logs sem expor tokens. Não executar scripts de testes com contas e senhas de produção.
