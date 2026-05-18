import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { department: true },
    });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
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
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req: any, res: Response) => {
  try {
    const { name, email, password, department } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }

    // Try to find or create the department
    let departmentId = undefined;
    if (department) {
      let dept = await prisma.department.findFirst({ where: { name: department } });
      if (!dept) {
        dept = await prisma.department.create({ data: { name: department } });
      }
      departmentId = dept.id;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const adminOverride = (process.env.ADMIN_OVERRIDE_EMAIL || '').toLowerCase();
    const userRole = adminOverride && email.toLowerCase() === adminOverride ? 'ADMIN' : 'EMPLOYEE';
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: userRole,
        departmentId,
      },
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// POST /api/auth/me
router.post('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { department: true, manager: { select: { id: true, name: true } } },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      managerId: user.managerId,
      department: user.department,
      manager: user.manager,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/auth/me (also support GET)
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { department: true, manager: { select: { id: true, name: true } } },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      managerId: user.managerId,
      department: user.department,
      manager: user.manager,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
