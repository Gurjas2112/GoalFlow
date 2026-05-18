import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth';
import { notifyAccountCreated } from '../utils/notify';
import { syncAzureADUsers } from '../services/azureSync';

const router = Router();

// GET /api/users — Admin: list all users
router.get('/', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        department: true,
        manager: { select: { id: true, name: true, email: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        departmentId: u.departmentId,
        managerId: u.managerId,
        department: u.department,
        manager: u.manager,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/team — Manager: list direct reports
router.get('/team', requireAuth, requireRole('MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const reports = await prisma.user.findMany({
      where: { managerId: req.user!.id },
      include: { department: true },
      orderBy: { name: 'asc' },
    });
    res.json(reports.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      departmentId: u.departmentId,
      department: u.department,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Generate random temporary password (12 chars: 1 upper, 1 lower, 1 number, 1 special + 8 random)
function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const all = uppercase + lowercase + numbers + special;
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  for (let i = 0; i < 8; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

// POST /api/users — Admin: create user with auto-generated password
router.post('/', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, role, departmentId, managerId } = req.body;
    if (!name || !email || !role) {
      res.status(400).json({ error: 'name, email, role are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, departmentId, managerId },
      include: { department: true },
    });

    // Send welcome email with credentials (non-blocking)
    notifyAccountCreated(name, email, temporaryPassword).catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      managerId: user.managerId,
      department: user.department,
      temporaryPassword,
      message: `Account created! Welcome email sent to ${email} with login credentials.`,
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id — Admin: update user
router.put('/:id', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, role, departmentId, managerId } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(departmentId !== undefined && { departmentId }),
        ...(managerId !== undefined && { managerId }),
      },
      include: { department: true },
    });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      managerId: user.managerId,
      department: user.department,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// GET /api/users/departments — Get all departments
router.get('/departments', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// POST /api/users/sync/azure — Admin: Sync users from Azure AD
router.post('/sync/azure', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await syncAzureADUsers();
    res.json({
      success: true,
      message: `Synced ${result.synced} new users from ${result.total} total Azure AD users`,
      ...result,
    });
  } catch (err) {
    console.error('Azure sync error:', err);
    res.status(500).json({
      error: 'Failed to sync Azure AD users',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

export default router;
