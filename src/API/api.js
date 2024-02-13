const express = require("express");
const QR = require("qrcode-terminal");
const routes = express.Router();
const { LIMIT_TIMEOUT } = require("../utils/config.js");
const {
  getLastMessageByChatId,
  getParticipantsByChatId,
  startSession,
  sendMessageByChatName,
  forwardMessage,
  getQrCode,
  getCountMessagesByChatId,
  closeAndDeleteSession,
  addParticipants,
  deleteChat,
  archiveChat,
  clearMessages,
  pinChat,
  muteChat,
  removeParticipants,
  revokeInvite,
  unarchiveChat,
  unmuteChat,
  unpinChat,
  promoteParticipants,
  demoteParticipants,
  setPictureChat,
  getInviteCode,
} = require("../utils/functions.js");

/**
 * @swagger
 * tags:
 *   name: WhatsApp APIs
 *   description: Endpoints para o WhatsApp
 */

/**
 * @swagger
 * /connect-session:
 *   get:
 *     summary: Inicia uma sessão de WhatsApp
 *     tags: [Client]
 *     responses:
 *       200:
 *         description: Retorna uma mensagem informando sobre o status da conexão e o qr code para realizar a conexão
 */
routes.get("/connect-session", async (req, res) => {
  try {
    let limit = LIMIT_TIMEOUT;
    const status = await startSession();
    if (status) {
      res.send(
        JSON.stringify({
          message: "Client is already connected",
        })
      );
    } else {
      const qrCode = await getQrCode();
      const interval = setInterval(() => {
        limit--;
        if (!qrCode) return;
        if (limit === 0) {
          clearInterval(interval);
          res.send(
            JSON.stringify({
              message: "Time out or connection has been established",
            })
          );
        }
        clearInterval(interval);
        res.send(
          JSON.stringify({
            message: "Scan the qr code",
            qrCode,
          })
        );
      }, 1000);
    }
  } catch (error) {
    res.status(500).send(
      JSON.stringify({
        message: "Error to connect session",
      })
    );
  }
});

/**
 * @swagger
 * /message/forward-last-message:
 *   post:
 *     summary: Envia uma mensagem para um chat
 *     tags: [Message]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatId:
 *                 type: string
 *               destinationChatId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Retorna uma mensagem informando sobre o status do envio
 */
routes.post("/message/forward-last-message", async (req, res) => {
  const { chatId, destinationChatId } = req.body;
  const message = await getLastMessageByChatId(chatId);
  if (!message) {
    res.send(JSON.stringify({ message: "Chat not found" }));
  }
  const result = await forwardMessage(destinationChatId);
  res.send(JSON.stringify({ result, message: "Send message" }));
});

/**
 * @swagger
 * /group/get-all-participants/{id}:
 *   get:
 *     summary: Obtém os participantes de um grupo
 *     tags: [Group]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do grupo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retorna uma lista de participantes
 */
routes.get("/group/get-all-participants/:id", async (req, res) => {
  const chatId = req.params.id;
  const participants = await getParticipantsByChatId(chatId);
  if (!participants) {
    res.send(JSON.stringify({ message: "Chat not Found" }));
  }
  const count = participants.length;
  res.send(JSON.stringify({ participants, count }));
});

/**
 * @swagger
 * /message/send-message-by-chat-name/:
 *   post:
 *     summary: Envia uma mensagem para um chat pelo nome
 *     tags: [Message]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatName:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Retorna uma mensagem informando sobre o status do envio
 */
routes.post("/message/send-message-by-chat-name/", async (req, res) => {
  try {
    const { chatName, message } = req.body;
    await sendMessageByChatName(chatName, message).then((result) => {
      if (result) {
        res.send(JSON.stringify({ message: "message sent" }));
      }
      res.send(JSON.stringify({ message: "chat not found" }));
    });
  } catch (e) {}
});

/**
 * @swagger
 * /group/get-admins/{id}:
 *   get:
 *     summary: Obtém os administradores de um grupo
 *     tags: [Group]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do grupo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retorna uma lista de participantes que são administradores
 */
routes.get("/group/get-admins/:id", async (req, res) => {
  try {
    const chatId = req.params.id;
    const participants = await getParticipantsByChatId(chatId);
    const admins = participants.filter((participant) => participant.isAdmin);
    res.send(JSON.stringify({ admins }));
  } catch (e) {
    res.send(JSON.stringify({ message: "Error to get admins to chat" }));
  }
});

/**
 * @swagger
 * /message/get-count-messages/{id}/{limit}:
 *   get:
 *     summary: Obtém uma quantidade de mensagens de um chat
 *     tags: [Message]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do grupo
 *         schema:
 *           type: string
 *       - in: path
 *         name: limit
 *         required: true
 *         description: limite de mensagens
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Retorna a quantidade determinada de mensagens
 */
routes.get("/message/get-count-messages/:id/:limit", async (req, res) => {
  try {
    const chatId = req.params.id;
    const limitMessages = req.params.limit;
    const messages = await getCountMessagesByChatId(chatId, limitMessages);
    messages === false
      ? res.send(JSON.stringify({ message: "Chat not found" }))
      : res.send(JSON.stringify({ messages }));
  } catch (error) {
    res.send(JSON.stringify({ message: "Error to get count messages" }));
  }
});

/**
 * @swagger
 * /close-and-delete-session/{deleteS}:
 *   delete:
 *     summary: Fecha e deleta a sessão do cliente whastapp conectado
 *     tags: [Client]
 *     parameters:
 *       - in: path
 *         name: deleteS
 *         required: true
 *         description: Booleano para deletar a sessão
 *         schema:
 *           type: boolean
 */
routes.delete("/close-and-delete-session/:deleteS", async (req, res) => {
  /**@type {boolean} */
  const deleteS = req.params.deleteS;
  const status = closeAndDeleteSession(deleteS);
  status === false
    ? res.send(JSON.stringify({ message: "Session not found" }))
    : res.send(JSON.stringify({ message: "successful operation" }));
});

/**
 * @swagger
 * /group/add-participants:
 *   post:
 *     summary: Adiciona uma lista de participantes no grupo
 *     tags: [Group]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatId:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Retorna uma mensagem informando sobre o status da ação
 */

routes.post("/group/add-participants", async (req, res) => {
  const { chatId, participants } = req.body;
  await addParticipants(chatId, participants);
  res.send(JSON.stringify({ message: "Adicionando participantes" }));
});

/**
 * @swagger
 * /group/remove-participants:
 *   post:
 *     summary: Remove uma lista de participantes no grupo
 *     tags: [Group]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatId:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Retorna uma mensagem informando sobre o status da ação
 */

routes.post("/group/remove-participants", async (req, res) => {
  const { chatId, participants } = req.body;
  await removeParticipants(chatId, participants);
  res.send(JSON.stringify({ message: "Removendo participantes" }));
});

/**
 * @swagger
 * /group/promote-participants:
 *   put:
 *     summary: Promove a admin uma lista de participantes no grupo
 *     tags: [Group]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatId:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Retorna uma mensagem informando sobre o status da ação
 */

routes.put("/group/promote-participants", async (req, res) => {
  const { chatId, participants } = req.body;
  await promoteParticipants(chatId, participants);
  res.send(
    JSON.stringify({ message: "Promovendo participantes à administrador" })
  );
});

/**
 * @swagger
 * /group/update-picture:
 *   put:
 *     summary: Atualiza a foto do grupo
 *     tags: [Group]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatId:
 *                 type: string
 *               pathMedia:
 *                 type: string
 *     responses:
 *       200:
 *         description: Retorna uma mensagem informando sobre o status da ação
 */

routes.put("/group/update-picture", async (req, res) => {
  const { chatId, pathMedia } = req.body;
  await setPictureChat(chatId, pathMedia);
  res.send(JSON.stringify({ message: "Atualizando imagem" }));
});

/**
 * @swagger
 * /group/demote-participants:
 *   put:
 *     summary: Remove o admin de uma lista de participantes no grupo
 *     tags: [Group]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatId:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Retorna uma mensagem informando sobre o status da ação
 */

routes.put("/group/demote-participants", async (req, res) => {
  const { chatId, participants } = req.body;
  await demoteParticipants(chatId, participants);
  res.send(
    JSON.stringify({
      message: "Removendo participantes la lista de administradores",
    })
  );
});

/**
 * @swagger
 * /group/delete-chat/{id}:
 *   delete:
 *     summary: Apaga o chat
 *     tags: [Group]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do grupo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retorna o status da ação
 */
routes.delete("/group/delete-chat/:id", async (req, res) => {
  const chatId = req.params.id;
  await deleteChat(chatId);
  res.send(JSON.stringify({ message: "Apagando o chat" }));
});

/**
 * @swagger
 * /group/archive-chat/{id}:
 *   patch:
 *     summary: Arquiva o chat
 *     tags: [Group]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do grupo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retorna o status da ação
 */
routes.patch("/group/archive-chat/:id", async (req, res) => {
  const chatId = req.params.id;
  await archiveChat(chatId);
  res.send(JSON.stringify({ message: "Arquivando o chat" }));
});

/**
 * @swagger
 * /group/unarchive-chat/{id}:
 *   patch:
 *     summary: Desarquiva o chat
 *     tags: [Group]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do grupo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retorna o status da ação
 */
routes.patch("/group/unarchive-chat/:id", async (req, res) => {
  const chatId = req.params.id;
  await unarchiveChat(chatId);
  res.send(JSON.stringify({ message: "Desarquivando o chat" }));
});

/**
 * @swagger
 * /group/clear-messages/{id}:
 *   delete:
 *     summary: Limpa todas as conversas do chat
 *     tags: [Group]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do grupo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retorna o status da ação
 */
routes.delete("/group/clear-messages/:id", async (req, res) => {
  const chatId = req.params.id;
  await clearMessages(chatId);
  res.send(JSON.stringify({ message: "Apagando mensagens o chat" }));
});

/**
 * @swagger
 * /group/pin-chat/{id}:
 *   patch:
 *     summary: Fixa o chat
 *     tags: [Group]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do grupo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retorna o status da ação
 */
routes.patch("/group/pin-chat/:id", async (req, res) => {
  const chatId = req.params.id;
  await pinChat(chatId);
  res.send(JSON.stringify({ message: "Fixando o chat" }));
});

/**
 * @swagger
 * /group/unpin-chat/{id}:
 *   patch:
 *     summary: Desfixa o chat
 *     tags: [Group]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do grupo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retorna o status da ação
 */
routes.patch("/group/unpin-chat/:id", async (req, res) => {
  const chatId = req.params.id;
  await unpinChat(chatId);
  res.send(JSON.stringify({ message: "Fixando o chat" }));
});

/**
 * @swagger
 * /group/mute-chat/{id}:
 *   patch:
 *     summary: Silencia o chat
 *     tags: [Group]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do grupo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retorna o status da ação
 */
routes.patch("/group/mute-chat/:id", async (req, res) => {
  const chatId = req.params.id;
  await muteChat(chatId);
  res.send(JSON.stringify({ message: "Silenciando o chat" }));
});

/**
 * @swagger
 * /group/unmute-chat/{id}:
 *   patch:
 *     summary: Descilencia o chat
 *     tags: [Group]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do grupo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retorna o status da ação
 */
routes.patch("/group/unmute-chat/:id", async (req, res) => {
  const chatId = req.params.id;
  await unmuteChat(chatId);
  res.send(JSON.stringify({ message: "Descilenciando o chat" }));
});

/**
 * @swagger
 * /group/revoke-invite-chat/{id}:
 *   put:
 *     summary: Redefini o link de entrada do chat
 *     tags: [Group]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do grupo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retorna o status da ação
 */
routes.put("/group/revoke-invite-chat/:id", async (req, res) => {
  const chatId = req.params.id;
  await revokeInvite(chatId, res);
});

/**
 * @swagger
 * /group/get-invite-code/{id}:
 *   get:
 *     summary: Obtém o link de entrada do chat
 *     tags: [Group]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do grupo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retorna o status da ação
 */
routes.get("/group/get-invite-code/:id", async (req, res) => {
  const chatId = req.params.id;
  await getInviteCode(chatId, res);
});
module.exports = { routes };
