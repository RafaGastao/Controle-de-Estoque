# Casa de Madeira — Controle de Estoque

Sistema de controle de ingredientes do restaurante Casa de Madeira. Consulte as quantidades disponíveis, registre entradas e saídas e acompanhe os produtos que precisam de reposição.

## Acessar o sistema

Abra o endereço do sistema no navegador e entre com seu usuário e senha de administrador. Após entrar, você verá o painel de estoque.

O acesso é exclusivo aos administradores. Para encerrar a sessão, clique em **Sair** no topo da página.

## Entender o painel

O painel mostra:

- **Ingredientes cadastrados:** total de produtos no estoque.
- **Estoque em dia:** ingredientes com quantidade acima do mínimo definido.
- **Precisam de atenção:** ingredientes com quantidade igual ou inferior ao mínimo.
- **Movimentações hoje:** quantidade de entradas e saídas registradas no dia.

## Cadastrar um ingrediente

1. Clique em **Novo ingrediente**.
2. Informe o nome e escolha a categoria.
3. Selecione a unidade de medida: kg, g, L, mL ou un.
4. Preencha a quantidade inicial disponível.
5. Defina o estoque mínimo para receber um alerta de reposição.
6. Clique em **Salvar**.

Use sempre a mesma unidade ao movimentar um ingrediente. Por exemplo: se o arroz está cadastrado em kg, uma saída de 500 g deve ser registrada como 0,5 kg.

Não é permitido cadastrar dois ingredientes com o mesmo nome. Uma quantidade inicial maior que zero aparece no histórico como entrada de estoque inicial.

## Consultar e editar ingredientes

Na tela **Estoque de ingredientes**, use a busca pelo nome ou filtre por categoria e situação.

Cada linha mostra a quantidade disponível, o estoque mínimo e a situação do produto. Clique em **Editar** para alterar o nome, a categoria ou o estoque mínimo.

Para alterar a quantidade disponível, registre uma entrada ou saída. A unidade de medida não pode ser alterada após o cadastro.

## Registrar entradas

Registre uma entrada quando receber produtos ou repor o estoque.

1. Clique em **Registrar movimentação** ou no botão **+** do ingrediente.
2. Selecione o ingrediente e o tipo **Entrada de produtos**.
3. Informe a quantidade recebida na unidade cadastrada.
4. Se desejar, acrescente uma observação, como “Compra da semana”.
5. Clique em **Salvar**.

A quantidade é somada ao saldo disponível.

## Registrar saídas

Registre uma saída quando usar ingredientes na cozinha ou retirar produtos por perda ou descarte.

1. Clique em **Registrar movimentação** ou no botão **−** do ingrediente.
2. Selecione o ingrediente e o tipo **Saída de produtos**.
3. Informe a quantidade retirada na unidade cadastrada.
4. Se desejar, descreva o motivo na observação.
5. Clique em **Salvar**.

A quantidade é descontada do saldo. O sistema impede saídas maiores que a quantidade disponível.

## Acompanhar os alertas

Abra **Alertas de estoque** no menu para consultar os ingredientes que precisam de reposição.

- **Em dia:** quantidade acima do mínimo.
- **Estoque baixo:** quantidade igual ou inferior ao mínimo, mas maior que zero.
- **Sem estoque:** quantidade disponível igual a zero.

Os alertas aparecem dentro do sistema e são atualizados conforme as movimentações. Não há envio de notificações por e-mail ou WhatsApp.

## Consultar o histórico

Abra **Movimentações** para acompanhar as entradas e saídas, das mais recentes para as mais antigas. Cada registro informa o ingrediente, o tipo de movimentação, a quantidade, a data, o horário e a observação.

Use a busca para encontrar as movimentações de um ingrediente.

## Exportar e restaurar um backup

Clique em **Exportar backup** no rodapé para baixar um arquivo com os ingredientes e o histórico de movimentações. Guarde esse arquivo em um local seguro.

Para recuperar um backup, clique em **Restaurar backup**, selecione o arquivo JSON exportado pelo sistema e confira a confirmação antes de continuar.

**A restauração substitui todo o estoque e o histórico compartilhados pelos dados do arquivo.** Exporte um backup atual antes de restaurar outro. O limite do arquivo é de 5 MB.

## Usar em mais de um dispositivo

Os dados são salvos no banco de dados e compartilhados entre os dispositivos que acessam o mesmo sistema. Mantenha a conexão com a internet durante o uso da versão online.

Se outra pessoa alterar o estoque enquanto você registra uma operação, o sistema pode pedir que você refaça o lançamento com o saldo atualizado. Confira o novo saldo antes de tentar novamente.

## Dúvidas frequentes

### Não consigo entrar

Confira o usuário e a senha, incluindo letras maiúsculas e minúsculas. Se houver muitas tentativas incorretas, aguarde 15 minutos antes de tentar novamente. Se o problema continuar, procure o responsável pelo sistema.

### Minha sessão terminou

Entre novamente para continuar usando o estoque. A sessão tem duração de até 8 horas.

### O sistema não salvou uma alteração

Confira sua conexão e a mensagem exibida. Antes de repetir o lançamento, consulte o saldo e o histórico para verificar se a operação já foi registrada.

### Cadastrei uma quantidade incorreta

Registre uma movimentação compensatória e explique a correção na observação. Por exemplo: se registrou uma entrada de 10 kg em vez de 8 kg, registre uma saída de 2 kg com a observação “Correção de lançamento”.

