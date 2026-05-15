import crypto from "crypto";
import { getStore as getBlobStore } from "@netlify/blobs";

const PORTAL_USERS_STORE = "client-portal";
const USERS_KEY = "portal-users:v1";

function cleanText(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeUsername(value = "") {
  return cleanText(value).toLowerCase();
}

function randomId(prefix = "USR") {
  const value = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${value.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derived = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

function getPasswordEncryptionKey() {
  const secret = process.env.CLIENT_PORTAL_SECRET || process.env.ADMIN_SESSION_SECRET || "contarae-client-portal-local-secret";
  return crypto.createHash("sha256").update(String(secret)).digest();
}

function encryptPortalPassword(password = "") {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getPasswordEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(password), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptPortalPassword(cipherText = "") {
  const [version, ivHex, tagHex, encryptedHex] = String(cipherText || "").split(":");
  if (version !== "v1" || !ivHex || !tagHex || !encryptedHex) return "";
  const decipher = crypto.createDecipheriv("aes-256-gcm", getPasswordEncryptionKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final()
  ]).toString("utf8");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""), "hex");
  const rightBuffer = Buffer.from(String(right || ""), "hex");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyPassword(password, passwordHash = "") {
  const [algorithm, salt, expected] = String(passwordHash || "").split(":");
  if (algorithm !== "scrypt" || !salt || !expected) return false;
  const actual = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  return safeEqual(actual, expected);
}

function getStore() {
  return getBlobStore(PORTAL_USERS_STORE);
}

function createAudit(action, actor = "admin", details = {}) {
  return {
    id: randomId("AUD"),
    action,
    at: new Date().toISOString(),
    by: cleanText(actor) || "admin",
    ...details
  };
}

function sanitizeUser(user = {}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email || "",
    companyId: user.companyId,
    companyName: user.companyName,
    status: user.status || "active",
    mustChangePassword: Boolean(user.mustChangePassword),
    temporaryPasswordPreview: user.mustChangePassword ? String(user.temporaryPasswordPreview || "") : "",
    temporaryPasswordCreatedAt: user.temporaryPasswordCreatedAt || "",
    lastLoginAt: user.lastLoginAt || "",
    lastPasswordChangeAt: user.lastPasswordChangeAt || "",
    lastImpersonatedAt: user.lastImpersonatedAt || "",
    createdAt: user.createdAt || "",
    updatedAt: user.updatedAt || "",
    auditTrail: Array.isArray(user.auditTrail) ? user.auditTrail.slice(-20) : []
  };
}

function normalizeUsersData(data = {}) {
  return {
    users: Array.isArray(data.users) ? data.users : [],
    resetTokens: Array.isArray(data.resetTokens) ? data.resetTokens : [],
    auditTrail: Array.isArray(data.auditTrail) ? data.auditTrail : [],
    updatedAt: data.updatedAt || ""
  };
}

async function loadUsersData() {
  const store = getStore();
  const data = await store.get(USERS_KEY, { type: "json" });
  return normalizeUsersData(data || {});
}

async function saveUsersData(data = {}) {
  const nextData = normalizeUsersData({
    ...data,
    updatedAt: new Date().toISOString()
  });
  await getStore().setJSON(USERS_KEY, nextData);
  return nextData;
}

export async function listClientPortalUsers() {
  const data = await loadUsersData();
  return data.users.map(sanitizeUser).sort((left, right) => {
    const leftName = left.companyName || left.username;
    const rightName = right.companyName || right.username;
    return leftName.localeCompare(rightName, "es");
  });
}

export async function upsertClientPortalUser(input = {}, actor = "admin") {
  const data = await loadUsersData();
  const now = new Date().toISOString();
  const id = cleanText(input.id) || randomId("CPU");
  const username = normalizeUsername(input.username);
  const email = cleanText(input.email).toLowerCase();
  const companyId = cleanText(input.companyId).toLowerCase().replace(/[^a-z0-9-_]/g, "-");
  const companyName = cleanText(input.companyName);
  const status = cleanText(input.status) === "suspended" ? "suspended" : "active";
  const temporaryPassword = String(input.temporaryPassword || "");

  if (!username) throw new Error("Ingresa el usuario de acceso.");
  if (!companyId) throw new Error("Ingresa el ID interno de empresa.");
  if (!companyName) throw new Error("Ingresa el nombre de la empresa o cliente.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Ingresa un correo valido.");

  const existingIndex = data.users.findIndex((user) => user.id === id || normalizeUsername(user.username) === username);
  const existing = existingIndex >= 0 ? data.users[existingIndex] : {};

  const usernameTaken = data.users.some((user, index) => index !== existingIndex && normalizeUsername(user.username) === username);
  if (usernameTaken) throw new Error("Ese usuario ya existe.");
  const companyTaken = data.users.some((user, index) => index !== existingIndex && cleanText(user.companyId).toLowerCase() === companyId);
  if (companyTaken) throw new Error("Ese ID de empresa ya tiene un usuario asignado.");
  if (existingIndex < 0 && !temporaryPassword) throw new Error("Para crear el usuario debes asignar una clave temporal.");

  const passwordPatch = temporaryPassword
    ? {
        passwordHash: hashPassword(temporaryPassword),
        passwordCipher: encryptPortalPassword(temporaryPassword),
        mustChangePassword: true,
        temporaryPasswordPreview: temporaryPassword,
        temporaryPasswordCreatedAt: now
      }
    : {};

  const user = {
    ...existing,
    ...passwordPatch,
    id: existing.id || id,
    username,
    email,
    companyId,
    companyName,
    status,
    createdAt: existing.createdAt || now,
    createdBy: existing.createdBy || actor,
    updatedAt: now,
    updatedBy: actor,
    auditTrail: [
      ...(existing.auditTrail || []),
      createAudit(existingIndex >= 0 ? "portal_user_updated" : "portal_user_created", actor, {
        companyId,
        temporaryPasswordAssigned: Boolean(temporaryPassword)
      })
    ]
  };

  data.users = existingIndex >= 0
    ? data.users.map((item, index) => index === existingIndex ? user : item)
    : [...data.users, user];
  data.auditTrail = [...data.auditTrail, createAudit(existingIndex >= 0 ? "portal_user_updated" : "portal_user_created", actor, { userId: user.id, companyId })];
  await saveUsersData(data);
  return sanitizeUser(user);
}

export async function resetClientPortalPassword(userId, temporaryPassword, actor = "admin") {
  const data = await loadUsersData();
  const index = data.users.findIndex((user) => user.id === cleanText(userId));
  if (index < 0) throw new Error("Usuario del portal no encontrado.");
  if (!String(temporaryPassword || "").trim()) throw new Error("Ingresa una clave temporal.");

  const now = new Date().toISOString();
  const user = {
    ...data.users[index],
    passwordHash: hashPassword(temporaryPassword),
    passwordCipher: encryptPortalPassword(temporaryPassword),
    mustChangePassword: true,
    temporaryPasswordPreview: temporaryPassword,
    temporaryPasswordCreatedAt: now,
    updatedAt: now,
    updatedBy: actor,
    auditTrail: [
      ...(data.users[index].auditTrail || []),
      createAudit("portal_user_password_reset", actor)
    ]
  };

  data.users[index] = user;
  data.auditTrail = [...data.auditTrail, createAudit("portal_user_password_reset", actor, { userId: user.id, companyId: user.companyId })];
  await saveUsersData(data);
  return sanitizeUser(user);
}

export async function changeClientPortalPassword(username, currentPassword, nextPassword) {
  const data = await loadUsersData();
  const index = data.users.findIndex((user) => normalizeUsername(user.username) === normalizeUsername(username));
  if (index < 0) throw new Error("Usuario no encontrado.");
  const user = data.users[index];
  if (user.status === "suspended") throw new Error("El usuario esta suspendido.");
  if (!verifyPassword(currentPassword, user.passwordHash)) throw new Error("La contraseña actual no es valida.");
  if (String(nextPassword || "").trim().length < 8) throw new Error("La nueva contraseña debe tener minimo 8 caracteres.");

  const now = new Date().toISOString();
  const nextUser = {
    ...user,
    passwordHash: hashPassword(nextPassword),
    passwordCipher: encryptPortalPassword(nextPassword),
    mustChangePassword: false,
    temporaryPasswordPreview: "",
    temporaryPasswordCreatedAt: "",
    lastPasswordChangeAt: now,
    updatedAt: now,
    updatedBy: user.username,
    auditTrail: [...(user.auditTrail || []), createAudit("portal_user_password_changed", user.username)]
  };
  data.users[index] = nextUser;
  await saveUsersData(data);
  return sanitizeUser(nextUser);
}

export async function authenticateStoredClientPortalUser(username, password) {
  const data = await loadUsersData();
  const index = data.users.findIndex((user) => normalizeUsername(user.username) === normalizeUsername(username));
  if (index < 0) return { ok: false, reason: "not_found" };
  const user = data.users[index];
  if (user.status === "suspended") return { ok: false, reason: "suspended" };
  if (!verifyPassword(password, user.passwordHash)) return { ok: false, reason: "invalid_credentials" };

  const now = new Date().toISOString();
  data.users[index] = {
    ...user,
    lastLoginAt: now,
    auditTrail: [...(user.auditTrail || []), createAudit("portal_user_login", user.username)]
  };
  await saveUsersData(data);

  return {
    ok: true,
    user: {
      username: user.username,
      companyId: user.companyId,
      companyName: user.companyName,
      mustChangePassword: Boolean(user.mustChangePassword),
      email: user.email || ""
    }
  };
}

export async function getClientPortalUser(userId) {
  const data = await loadUsersData();
  const user = data.users.find((item) => item.id === cleanText(userId) || normalizeUsername(item.username) === normalizeUsername(userId));
  return user ? sanitizeUser(user) : null;
}

export async function revealClientPortalPassword(userId, actor = "admin") {
  const data = await loadUsersData();
  const index = data.users.findIndex((user) => user.id === cleanText(userId));
  if (index < 0) throw new Error("Usuario del portal no encontrado.");

  const user = data.users[index];
  const password = decryptPortalPassword(user.passwordCipher);
  if (!password) {
    throw new Error("Esta clave no se puede revelar porque fue creada antes de activar la consulta protegida. Restablece una clave temporal.");
  }

  data.users[index] = {
    ...user,
    auditTrail: [
      ...(user.auditTrail || []),
      createAudit("portal_user_password_revealed", actor)
    ]
  };
  data.auditTrail = [...data.auditTrail, createAudit("portal_user_password_revealed", actor, { userId: user.id, companyId: user.companyId })];
  await saveUsersData(data);

  return {
    user: sanitizeUser(data.users[index]),
    password
  };
}

export async function recordClientPortalImpersonation(userId, actor = "admin", reason = "") {
  const data = await loadUsersData();
  const index = data.users.findIndex((user) => user.id === cleanText(userId));
  if (index < 0) throw new Error("Usuario del portal no encontrado.");
  const now = new Date().toISOString();
  const user = data.users[index];
  const nextUser = {
    ...user,
    lastImpersonatedAt: now,
    auditTrail: [
      ...(user.auditTrail || []),
      createAudit("portal_user_impersonated", actor, { reason: cleanText(reason) })
    ]
  };
  data.users[index] = nextUser;
  data.auditTrail = [...data.auditTrail, createAudit("portal_user_impersonated", actor, { userId: user.id, companyId: user.companyId, reason: cleanText(reason) })];
  await saveUsersData(data);
  return sanitizeUser(nextUser);
}
