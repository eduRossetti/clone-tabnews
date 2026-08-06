export class InternalServerError extends Error {
  constructor({ cause }) {
    super("Um erro interno não esperado aconteceu.", {
      cause: cause,
    });
    this.name = "InternalServerError";
    this.action = "Entre em contato com o suporte.";
    this.statusCode = 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class MethodNotAllowledError extends Error {
  constructor() {
    super("Metodo não permitido para esse endpoint.");
    this.name = "MethodNotAllowledError";
    this.action =
      "Verifique se o método HTTP enviado é valido para esse endpoint.";
    this.statusCode = 405;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}
