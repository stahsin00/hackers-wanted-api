import 'dotenv/config.js';
import express from 'express';
import passport from 'passport';
import GoogleStrategy from 'passport-google-oidc';
import { db } from '../services/mysql.js';
import { isAuthenticated } from '../middleware/isAuthenticated.js';

const router = express.Router();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    function verify(issuer, profile, cb) {
      const run = async () => {
        try {
          const user_credentials = await db.query(
            'SELECT * FROM federated_credentials WHERE provider = ? AND provider_id = ?',
            [issuer, profile.id]
          );

          if (!user_credentials || user_credentials.length <= 0) {
            const profilePicture =
              profile.photos && profile.photos.length > 0
                ? profile.photos[0].value
                : null;
            const user = await db.query(
              'INSERT INTO users (name, email, profile_picture) VALUES (?, ?, ?)',
              [profile.displayName, profile.emails[0].value, profilePicture]
            );

            await db.query(
              'INSERT INTO federated_credentials (user_id, provider, provider_id) VALUES (?, ?, ?)',
              [user.insertId, issuer, profile.id]
            );

            return cb(null, {
              id: user.insertId,
              name: profile.displayName,
              email: profile.emails[0].value,
              profile_picture: profilePicture,
            });
          } else {
            const user = await db.query('SELECT * FROM users WHERE id = ?', [
              user_credentials[0].user_id,
            ]);

            if (!user || user.length === 0) {
              return cb(new Error('User not found'), null);
            }

            return cb(null, user[0]);
          }
        } catch (err) {
          console.error(err);
          return cb(err);
        }
      };

      run();
    }
  )
);

passport.serializeUser((user, next) => {
  next(null, user.id);
});

passport.deserializeUser(async (id, next) => {
  try {
    const [user] = await db.query('SELECT * FROM users WHERE id = ?', [id]);

    if (!user) {
      next(new Error('User not found'));
    } else {
      next(null, user);
    }
  } catch (err) {
    next(err);
  }
});

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/', // TODO
    successReturnToOrRedirect: `${process.env.FRONTEND_URI}`,
  })
);

router.get('/logout', isAuthenticated, (req, res) => {
  // TODO
  res.status(200).send('Signed out.');
});

router.get('/user', isAuthenticated, async (req, res) => {
  try {
    const [user] = await db.query(`SELECT * FROM users WHERE id = ?`, [
      req.user.id,
    ]);

    if (!user) {
      return res.status(404).send('User not found.');
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
