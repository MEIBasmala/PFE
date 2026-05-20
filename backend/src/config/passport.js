const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('./db');
const jwt = require('jsonwebtoken');

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL,
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const googleId = profile.id;
    const fullName = profile.displayName;
    const avatar = profile.photos[0]?.value;

    let user = await prisma.user.findUnique({
      where: { googleId }
    });

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email }
      });

      if (user) {
        user = await prisma.user.update({
          where: { email },
          data: { googleId, avatar }
        });
      } else {
        user = await prisma.user.create({
          data: {
            fullName,
            email,
            password: '',        
            role: 'PATIENT',
            googleId,
            avatar,
            isActive: true,
          }
        });

        await prisma.patient.create({
          data: { userId: user.id }
        });
      }
    }

    return done(null, user);

  } catch (error) {
    return done(error, null);
  }
}));

module.exports = passport;