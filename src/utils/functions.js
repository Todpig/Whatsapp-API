const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { EXECUTABLE, HEADLEES_BROWSER, SESSION_NAME } = require("./config");
const fs = require("fs");
const { Response } = require("express");

/**@param {number} ms */
async function sleep(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  /**@type {WAWebJS.Chat} */
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
  /**@type {WAWebJS.Chat} */
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
  /**@type {WAWebJS.Chat} */
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
  /**@type {WAWebJS.Chat} */
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

/**
 * @param {string[]} participants
 * @param {string} chatId
 */
async function addParticipants(chatId, participants) {
  /**@type {WAWebJS.Chat} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  await chat.addParticipants(participants);
}

/**
 * @param {string[]} participants
 * @param {string} chatId
 */
async function removeParticipants(chatId, participants) {
  /**@type {WAWebJS.Chat} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  await chat.removeParticipants(participants);
}

/**
 * @param {string[]} participants
 * @param {string} chatId
 */
async function promoteParticipants(chatId, participants) {
  /**@type {WAWebJS.Chat} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  await chat.promoteParticipants(participants);
}

/**
 * @param {string[]} participants
 * @param {string} chatId
 */
async function demoteParticipants(chatId, participants) {
  /**@type {WAWebJS.Chat} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  await chat.demoteParticipants(participants);
}

/**@param {string} */
async function deleteChat(chatId) {
  /**@type {WAWebJS.Chat} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  await chat.delete();
}

/**@param {string} */
async function archiveChat(chatId) {
  /**@type {WAWebJS.Chat} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  await chat.archive();
}

/**@param {string} */
async function unarchiveChat(chatId) {
  /**@type {WAWebJS.Chat} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  await chat.unarchive();
}

/**@param {string} */
async function clearMessages(chatId) {
  /**@type {WAWebJS.Chat} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  await chat.clearMessages();
}

/**@param {string} */
async function pinChat(chatId) {
  /**@type {WAWebJS.Chat} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  await chat.pin();
}

/**@param {string} */
async function unpinChat(chatId) {
  /**@type {WAWebJS.Chat} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  await chat.unpin();
}

/**@param {string} */
async function muteChat(chatId) {
  /**@type {WAWebJS.Chat} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  await chat.mute();
}

/**@param {string} */
async function unmuteChat(chatId) {
  /**@type {WAWebJS.Chat} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  await chat.unmute();
}

/**
 * @param {string} chatId
 * @param {string} pathMedia
 */
async function setPictureChat(chatId, pathMedia) {
  const media = MessageMedia.fromFilePath(pathMedia);
  /**@type {WAWebJS.Chat} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  await chat.setPicture(media);
}

/**
 * @param {string} chatId
 * @param {Response} res
 */
async function revokeInvite(chatId, res) {
  /**@type {WAWebJS.Chat} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  /**@type {string} */
  const link = await chat.revokeInvite();
  const concactlink = "https://chat.whatsapp.com/" + link;
  return res.send(JSON.stringify({ link: concactlink }));
}

/**
 * @param {string} chatId
 */
async function getInviteCode(chatId, res) {
  /**@type {WAWebJS.Chat} */
  const chat = userGroups.find((chat) => chat.id._serialized === chatId);
  /**@type {string} */
  const link = await chat.getInviteCode();
  const concactlink = "https://chat.whatsapp.com/" + link;
  return res.send(JSON.stringify({ link: concactlink }));
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
  addParticipants,
  removeParticipants,
  deleteChat,
  archiveChat,
  clearMessages,
  pinChat,
  muteChat,
  revokeInvite,
  unarchiveChat,
  sleep,
  unmuteChat,
  unpinChat,
  promoteParticipants,
  demoteParticipants,
  setPictureChat,
  getInviteCode,
};
