import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { config } from '../config';
import { prisma } from '../services/database';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Configure Google OAuth
if (config.googleClientId && config.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.googleClientId,
        clientSecret: config.googleClientSecret,
        callbackURL: config.googleCallbackUrl,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName;
          const avatarUrl = profile.photos?.[0]?.value;

          const user = await findOrCreateUser({
            provider: 'google',
            providerAccountId: profile.id,
            email,
            name,
            avatarUrl,
            accessToken,
            refreshToken,
          });

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

// Configure GitHub OAuth
if (config.githubClientId && config.githubClientSecret) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: config.githubClientId,
        clientSecret: config.githubClientSecret,
        callbackURL: config.githubCallbackUrl,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || profile.username;
          const avatarUrl = profile.photos?.[0]?.value;

          const user = await findOrCreateUser({
            provider: 'github',
            providerAccountId: profile.id,
            email,
            name,
            avatarUrl,
            accessToken,
          });

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

// Configure Discord OAuth
if (config.discordClientId && config.discordClientSecret) {
  passport.use(
    new DiscordStrategy(
      {
        clientID: config.discordClientId,
        clientSecret: config.discordClientSecret,
        callbackURL: config.discordCallbackUrl,
        scope: ['identify', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.email;
          const name = profile.username;
          const avatarUrl = profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : null;

          const user = await findOrCreateUser({
            provider: 'discord',
            providerAccountId: profile.id,
            email,
            name,
            avatarUrl,
            accessToken,
            refreshToken,
          });

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

// Helper function to find or create user
async function findOrCreateUser({
  provider,
  providerAccountId,
  email,
  name,
  avatarUrl,
  accessToken,
  refreshToken,
}: {
  provider: string;
  providerAccountId: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  accessToken?: string;
  refreshToken?: string;
}) {
  // Try to find existing account
  let account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    include: { user: true },
  });

  if (account) {
    // Update tokens if needed
    if (accessToken && accessToken !== account.accessToken) {
      await prisma.account.update({
        where: { id: account.id },
        data: { accessToken, refreshToken },
      });
    }
    return account.user;
  }

  // Try to find user by email
  if (email) {
    let user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (user) {
      // Link new account to existing user (auto-merge)
      logger.info({ userId: user.id, provider, email }, 'Linked OAuth account to existing user');
      await prisma.account.create({
        data: {
          userId: user.id,
          provider,
          providerAccountId,
          accessToken,
          refreshToken,
        },
      });
      return user;
    }
  }

  // Create new user
  const user = await prisma.user.create({
    data: {
      email,
      name,
      avatarUrl,
      emailVerified: email ? new Date() : null,
      accounts: {
        create: {
          provider,
          providerAccountId,
          accessToken,
          refreshToken,
        },
      },
    },
    include: { accounts: true },
  });

  logger.info({ userId: user.id, provider, email }, 'Created new user via OAuth');

  // Assign default "user" role if exists
  const defaultRole = await prisma.role.findUnique({ where: { name: 'user' } });
  if (defaultRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: defaultRole.id,
      },
    });
  }

  return user;
}

// OAuth routes
router.get('/google', authRateLimiter, passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${config.frontendUrl}/login?error=oauth_failed` }),
  handleOAuthSuccess
);

router.get('/github', authRateLimiter, passport.authenticate('github', { scope: ['user:email'] }));

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${config.frontendUrl}/login?error=oauth_failed` }),
  handleOAuthSuccess
);

router.get('/discord', authRateLimiter, passport.authenticate('discord'));

router.get(
  '/discord/callback',
  passport.authenticate('discord', { session: false, failureRedirect: `${config.frontendUrl}/login?error=oauth_failed` }),
  handleOAuthSuccess
);

function handleOAuthSuccess(req: any, res: any) {
  try {
    const user = req.user;

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email || undefined);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in database
    prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    }).catch(err => logger.error({ err }, 'Failed to store session'));

    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend
    res.redirect(`${config.frontendUrl}/dashboard?success=true`);
  } catch (error) {
    logger.error({ error }, 'OAuth success handler error');
    res.redirect(`${config.frontendUrl}/login?error=server_error`);
  }
}

export default router;
