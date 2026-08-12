import { createRouter } from "next-connect";
import controller from "infra/controller";
import status from "models/status";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const systemStatus = await status.getStatus();
  return response.status(200).json(systemStatus);
}
