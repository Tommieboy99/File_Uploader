import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { prisma } from './prisma.js';
import bcrypt from 'bcryptjs';

passport.use(
  new LocalStrategy({
    usernameField: 'email',
  }, 
  async function verify(email, password, done) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email },
      })
      
      if (!user) {
        return done(null, false);
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return done(null, false);
      }

      return done(null, user);

    } catch(err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
        where: { id: id },
    })

    done(null, user);
  } catch(err) {
    done(err);
  }
});