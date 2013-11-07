mmcafe_chat
===========

NodeJS w/ socket.io

Usada estrutura do http://psitsmike.com/2011/09/node-js-and-socket-io-chat-tutorial/ como base

Testado com Express 3.4.4 e Socket.io 0.8.2

Configurações
=============

Há um arquivo config.js. nele deve ser definido:
config.origin -> domínio da view. Por exemplo:
config.origin = "demo.mmcafe.com.br"
Não testei, mas pelo que vi na documentação pode ter mais de um domínio usando expressões complexas.

config.socketport -> porta em que a aplicação rodará no servidor. Por exemplo:
config.sockerport = 8094

config.queue.path -> pasta no servidor que guardará mensagens temporárias. Pode ser um valor relativo (exemplo: "queue") ou absoluto (exemplo: "/var/logs/nodechat")

config.logging.path -> pasta no servidor que guardará logs da aplicação. Pode ser relativo ou absoluto.
Será gerado um arquivo de log por dia e o nome terá o formato ANO_MES_DIA_access.log

config.logging.chat_path -> pasta no servidor que guardará logs das conversas aplicação. Pode ser relativo ou absoluto.
Será gerado um arquivo de log por dia por conversa entre 2 usuários e o nome terá o formato ANO_MES_DIA_ID1_ID2_access.log 
ID1 sempre terá o valor do id do usuário de menor valor.

Todos esses caminhos de pasta são obrigatórios.

Iniciando a aplicação
=====================
Pela linha de comando, caso tenha forever instalado:
forever start --killSignal SIGINT app.js 
Senão
node app.js
Acessar pelo browser a url: http://[nome / ip do servidor]:[config.socketport]/index.html
deverá aparecer uma mensagem de que o servidor está no ar.