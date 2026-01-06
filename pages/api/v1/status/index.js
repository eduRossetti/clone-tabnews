function status(request, response) {
  response.status(200).json({ chave: "alunos curso.dev são acima da media" });
}

export default status;
