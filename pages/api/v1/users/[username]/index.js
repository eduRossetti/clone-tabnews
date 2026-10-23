import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";
import { NotFoundError } from "infra/errors";

const router = createRouter();

router.get(getHandler);
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const updatedUser = await user.updateUsername(
    request.query.username,
    request.body,
  );
  return response.status(200).json(updatedUser);
}

async function getHandler(request, response) {
  const username = request.query.username;

  const userFound = await user.findOneByUsername(username);

  if (!userFound) {
    throw new NotFoundError({
      message: `O usuário "${username}" não foi encontrado.`,
      action: "Verifique se o nome de usuário está digitado corretamente.",
    });
  }

  return response.status(200).json(userFound);
}
