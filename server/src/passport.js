import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import db from './db.js';

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'azul.rw';

function configurePassport() {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
      scope: ['profile', 'email'],
    },
    (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(null, false, { message: 'No email found in Google profile' });
        }

        const emailDomain = email.split('@')[1];
        if (emailDomain !== ALLOWED_DOMAIN) {
          return done(null, false, {
            message: `Only @${ALLOWED_DOMAIN} email addresses are authorized. Your email: ${email}`,
          });
        }

        let user = db.find('users', u => u.email === email);

        if (!user) {
          const name = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim();

          const org = db.find('organizations', o => o.name.includes('Azul') || o.name.includes('azul'));
          const orgId = org?.id || db.find('organizations', () => true)?.id;

          user = {
            id: profile.id,
            email,
            name: name || email.split('@')[0],
            role: 'employee',
            organization_id: orgId || null,
            restaurant_id: null,
            employee_number: null,
            department: null,
            google_id: profile.id,
            avatar: profile.photos?.[0]?.value || null,
            created_at: new Date().toISOString(),
          };
          db.insert('users', user);
          db.auditLog(user.id, 'user_created_via_sso', 'user', user.id, { email, provider: 'google' });
        } else {
          if (profile.photos?.[0]?.value) {
            user.avatar = profile.photos[0].value;
          }
          user.google_id = profile.id;
        }

        db.auditLog(user.id, 'login', 'user', user.id, { method: 'google_sso', provider: 'google' });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    const user = db.find('users', u => u.id === id);
    if (user) {
      done(null, user);
    } else {
      done(new Error('User not found'), null);
    }
  });
}

export { configurePassport };
export default passport;
