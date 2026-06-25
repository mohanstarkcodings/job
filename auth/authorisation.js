const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}

function employer(req, res, next) {
  if (req.user.role !== "Employer") {
    return res.status(403).json({
      message: "Employer access only",
    });
  }

  next();
}

function candidate(req, res, next) {
  if (req.user.role !== "Candidate") {
    return res.status(403).json({
      message: "Candidate access only",
    });
  }

  next();
}

function employerCandidate(req, res, next) {
  if (req.user.role !== "Employer" && req.user.role !== "Candidate") {
    return res.status(403).json({
      message: "Access denied",
    });
  }

  next();
}

function candidateAdmin(req, res, next) {
  if (req.user.role !== "Candidate" && req.user.role !== "Admin") {
    return res.status(403).json({
      message: "Access denied",
    });
  }

  next();
}

function admin(req, res, next) {
  if (req.user.role !== "Admin") {
    return res.status(403).json({
      message: "Admin access only",
    });
  }

  next();
}

function employerAdmin(req, res, next) {
  if (
    req.user.role !== "Employer" &&
    req.user.role !== "Admin"
  ) {
    return res.status(403).json({
      message: "Access denied",
    });
  }

  next();
}

module.exports = {
  authMiddleware,
  employer,
  candidate,
  employerCandidate,
  employerAdmin,
  candidateAdmin,
  admin,
};
