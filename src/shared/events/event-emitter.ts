import EventEmitter from "node:events";

// Barramento de eventos interno do servico (ex.: "tema.criado" -> conquistas).
export const eventEmitter = new EventEmitter();