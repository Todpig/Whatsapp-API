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
 *     tags: [Session]
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
  res.send(JSON.stringify({ participants }));
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
 *     summary: Obtém os participantes de um grupo
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
 *         description: Retorna uma lista de participantes
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

module.exports = { routes };
