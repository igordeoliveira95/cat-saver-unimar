// Middlewares de sessão e perfil.

export function exigirLogin(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ erro: "Faça login para continuar." });
  }
  next();
}

export function exigirPerfil(perfil) {
  return (req, res, next) => {
    if (req.session.usuario?.perfil !== perfil) {
      return res.status(403).json({ erro: "Você não tem permissão para esta ação." });
    }
    next();
  };
}
