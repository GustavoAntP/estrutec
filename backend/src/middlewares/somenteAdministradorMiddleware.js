function somenteAdministrador(
  req,
  res,
  next
) {
  if (
    !req.usuario ||
    req.usuario.perfil !==
      "ADMINISTRADOR"
  ) {
    return res.status(403).json({
      erro:
        "Acesso permitido somente para administradores.",
    });
  }

  next();
}

module.exports =
  somenteAdministrador;