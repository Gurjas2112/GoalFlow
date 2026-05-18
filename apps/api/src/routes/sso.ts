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
    // Azure AD object id (immutable per Azure identity) — proves the same
    // Azure credential is being used across logins/registrations.
    const azureOid: string | null = profile.oid || profile.id || null;

    // ── Resolve role from Azure AD groups OR email allowlists ────────────
    // Two ways to map an SSO user to MANAGER / ADMIN:
    //  1. Azure AD security groups (recommended for production):
    //       AZURE_GROUP_ADMIN=<group-object-id>
    //       AZURE_GROUP_MANAGER=<group-object-id>
    //  2. Comma-separated email allowlists (works with personal MS accounts):
    //       AZURE_ADMIN_EMAILS=alice@corp.com,bob@corp.com
    //       AZURE_MANAGER_EMAILS=carol@corp.com,dave@corp.com
    //  Anything not matched defaults to EMPLOYEE.
    const groups: string[] = profile.groups || [];
    const adminGroup = process.env.AZURE_GROUP_ADMIN;
    const managerGroup = process.env.AZURE_GROUP_MANAGER;
    const adminEmails = (process.env.AZURE_ADMIN_EMAILS || '')
      .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const managerEmails = (process.env.AZURE_MANAGER_EMAILS || '')
      .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const adminOverride = (process.env.ADMIN_OVERRIDE_EMAIL || '').toLowerCase();

    const resolveRole = (): 'ADMIN' | 'MANAGER' | 'EMPLOYEE' => {
      if (adminOverride && email === adminOverride) return 'ADMIN';
      if (adminGroup && groups.includes(adminGroup)) return 'ADMIN';
      if (adminEmails.includes(email)) return 'ADMIN';
      if (managerGroup && groups.includes(managerGroup)) return 'MANAGER';
      if (managerEmails.includes(email)) return 'MANAGER';
      return 'EMPLOYEE';
    };

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
      include: { department: true },
    });

    if (!user) {
      // Auto-provision from Azure AD
      const role = resolveRole();

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
          authProvider: 'AZURE_AD',
          azureOid: azureOid || undefined,
          lastSsoLoginAt: new Date(),
        },
        include: { department: true },
      });
    } else {
      // Re-sync role for existing SSO users so newly-added group/allowlist
      // entries take effect on the next login (admins can promote in Azure
      // without manually editing the local DB).
      const desiredRole = resolveRole();
      // If a previously-Azure-linked account is being accessed by a *different*
      // Azure identity (different oid) for the same email, refuse — this
      // prevents impersonation through an Azure tenant the admin didn't expect.
      if (user.azureOid && azureOid && user.azureOid !== azureOid) {
        res.status(409).json({
          error: 'Azure identity mismatch',
          message: 'This email is linked to a different Azure AD account. Contact an administrator.',
        });
        return;
      }
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(desiredRole !== user.role ? { role: desiredRole } : {}),
          authProvider: 'AZURE_AD',
          ...(azureOid && !user.azureOid ? { azureOid } : {}),
          lastSsoLoginAt: new Date(),
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
