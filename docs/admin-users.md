# Cadastro de usuários

A conta proprietária configurada em `ECOJOI_OWNER_EMAIL` é a administradora. Em produção ela é mkt@ecojoi.com.br. A permissão vem da sessão válida e do e-mail já salvo no banco, comparado à configuração do servidor. Não é aceita uma permissão informada pelo navegador.

O menu Usuários leva a `/admin/users`. O administrador informa nome, e-mail, senha inicial e confirmação. A conta é criada ativa, com perfil de usuário comum e identificador próprio. Cada usuário visualiza apenas seus designs, mantendo a política de propriedade já existente. A própria conta pode alterar sua senha pela opção Alterar senha.

O cadastro usa as tabelas de autenticação existentes. Não há mudança de esquema, migração, alteração de contas existentes, alteração de designs, artes ou modelos 3D. Não há cadastro público, envio automático de e-mail, promoção de outros administradores, exclusão, bloqueio ou redefinição administrativa de senha nesta entrega.

A lista e o cadastro são protegidos no servidor. `POST /api/admin/users` exige origem correspondente, autenticação administrativa, nome até 120 caracteres, e-mail válido e senha entre 12 e 128 caracteres. Senhas usam o hash e salt do login já implantado. E-mails são normalizados e uma duplicidade não substitui uma conta existente. A lista nunca retorna hashes, salts ou senhas.

Validação: `tests/admin-users.mjs`, somente local, com `STUDIO_TEST_COOKIE` de uma sessão administrativa local. São 20 verificações cobrindo cadastro, validações, duplicidade, login, logout, isolamento de designs e tentativas de acesso administrativo indevido. Contas de teste não devem ser criadas em produção.
