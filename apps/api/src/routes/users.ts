import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth';

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

// POST /api/users — Admin: create user
router.post('/', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, departmentId, managerId } = req.body;
    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'name, email, password, role are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, departmentId, managerId },
      include: { department: true },
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      managerId: user.managerId,
      department: user.department,
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

export default router;
