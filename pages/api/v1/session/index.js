import { createRouter } from "next-connect";
import controller from "infra/controller";
import authentication from "models/authentication";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const session = await authentication.createSession(request.body);
  const cookieAttributes = [
    `session=${session.token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${authentication.sessionDurationInSeconds}`,
    `Expires=${session.expires_at.toUTCString()}`,
  ];

  if (process.env.NODE_ENV === "production") {
    cookieAttributes.push("Secure");
  }

  response.setHeader("Set-Cookie", cookieAttributes.join("; "));
  return response.status(201).json(session);
}
