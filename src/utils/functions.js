const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { EXECUTABLE, HEADLEES_BROWSER, SESSION_NAME } = require("./config");
const fs = require("fs");

/**
 * @typedef {Object.<string, Client>} Sessions
 */

/**@type {WAWebJS.Chat[]} */
let userGroups;

/** @type {Sessions} */
const sessions = {};

/**
 * @param {string} chatId
 * */
async function getLastMessageByChatId(chatId) {
  /**@type {WAWebJS.Chat[]} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  if (!chat) {
    return false;
  }
  /**
   * @type {import("whatsapp-web.js").Message[]}
   */
  const messages = await chat.fetchMessages({ limit: 1 });
  return messages[0];
}

/**
 * @param {string} chatId
 * @param {import("whatsapp-web.js").Message} message
 */
async function forwardMessage(chatId, message) {
  const result = await message.forward(chatId);
  return result;
}

/**
 * @param {string} chatId
 * */
async function getParticipantsByChatId(chatId) {
  /**@type {WAWebJS.Chat[]} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  if (!chat) return false;
  const participants = await chat.participants;
  return participants;
}

async function startSession() {
  if (sessions[SESSION_NAME]) {
    return true;
  }
  const client = new Client({
    puppeteer: {
      headless: HEADLEES_BROWSER,
      executablePath: EXECUTABLE,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    },
    authStrategy: new LocalAuth({ clientId: SESSION_NAME }),
  });

  client.initialize();

  sessions[SESSION_NAME] = client;
  client.on("ready", async () => {
    userGroups = await sessions[SESSION_NAME].getChats();
  });
}

async function getQrCode() {
  return new Promise((resolve, reject) => {
    sessions[SESSION_NAME].on("qr", (qr) => {
      qrcode.generate(qr, { small: true });
      resolve(qr);
    });
  });
}

/**
 * @param {string} chatName
 * @param {string} message */
async function sendMessageByChatName(chatName, message) {
  /**@type {WAWebJS.Chat[]} */
  const group = userGroups.find((group) => group.name === chatName);
  if (!group) {
    return false;
  }
  await group.sendMessage(message, group.id._serialized);
  return true;
}
/**
 * @param {string} chatId
 * @param {number} limitMessage
 * @returns
 */
async function getCountMessagesByChatId(chatId, limitMessage = 1) {
  /**@type {WAWebJS.Chat[]} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  if (!chat) {
    return false;
  }
  /**@type {import("whatsapp-web.js").Message[]} */
  const messages = await chat.fetchMessages({ limit: limitMessage });
  return messages;
}

/**@param {boolean} deleteSession */
function closeAndDeleteSession(deleteS) {
  const fileExists = fs.existsSync(`.wwebjs_auth/session-${SESSION_NAME}`);
  if (!fileExists || !sessions[SESSION_NAME]) return false;
  sessions[SESSION_NAME].destroy();
  if (deleteS) deleteSession(`.wwebjs_auth/session-${SESSION_NAME}`);
  return true;
}

/**@param {string} path */
function deleteSession(path) {
  delete sessions[SESSION_NAME];
  fs.rmdirSync(path, { recursive: true, force: true });
}

module.exports = {
  getLastMessageByChatId,
  getParticipantsByChatId,
  startSession,
  getQrCode,
  sendMessageByChatName,
  sessions,
  forwardMessage,
  getCountMessagesByChatId,
  closeAndDeleteSession,
};
