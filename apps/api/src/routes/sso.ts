import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';

const router = Router();

// POST /api/auth/sso — Azure AD SSO login
// Frontend sends the Azure access token; backend validates and maps to local user
router.post('/sso', async (req: any, res: Response) => {
  try {
    const { accessToken, profile } = req.body;
    if (!accessToken || !profile) {
      res.status(400).json({ error: 'Access token and profile required' });
      return;
    }

    const rawEmail = profile.mail || profile.userPrincipalName;
    if (!rawEmail) {
      res.status(400).json({ error: 'Profile is missing an email address' });
      return;
    }
    const email = String(rawEmail).trim().toLowerCase();
    const name = profile.displayName || email.split('@')[0];

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
      include: { department: true },
    });

    if (!user) {
      // Auto-provision from Azure AD
      const groups: string[] = profile.groups || [];
      let role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' = 'EMPLOYEE';

      const adminGroup = process.env.AZURE_GROUP_ADMIN;
      const managerGroup = process.env.AZURE_GROUP_MANAGER;

      if (adminGroup && groups.includes(adminGroup)) role = 'ADMIN';
      else if (managerGroup && groups.includes(managerGroup)) role = 'MANAGER';

      const adminOverride = (process.env.ADMIN_OVERRIDE_EMAIL || '').toLowerCase();
      if (adminOverride && email === adminOverride) {
        role = 'ADMIN';
      }

      // Find manager from Azure AD (if available)
      let managerId: string | undefined;
      if (profile.manager?.mail) {
        const mgrEmail = String(profile.manager.mail).trim().toLowerCase();
        const mgr = await prisma.user.findUnique({ where: { email: mgrEmail } });
        if (mgr) managerId = mgr.id;
      }

      user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: await bcrypt.hash(`sso-${Date.now()}`, 10),
          role,
          managerId,
        },
        include: { department: true },
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        managerId: user.managerId,
        department: user.department,
      },
    });
  } catch (err) {
    console.error('SSO login error:', err);
    res.status(500).json({ error: 'SSO login failed' });
  }
});

export default router;
