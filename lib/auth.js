import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const JWT_SECRET = 'your_jwt_secret';

export function authenticateToken(req, res, next) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = user;
    next();
  });
}