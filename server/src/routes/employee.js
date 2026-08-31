import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

function getConfirmationWindow() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const today = now.toISOString().split('T')[0];

  const isOpenFrom2PM = hour >= 14;
  const isClosedAfter1030AM = hour > 10 || (hour === 10 && minute >= 30);
  const isBefore1030AM = hour < 10 || (hour === 10 && minute < 30);

  let confirmForDate = null;
  let windowStatus = '';

  if (isOpenFrom2PM) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    confirmForDate = tomorrow.toISOString().split('T')[0];
    windowStatus = 'open';
  } else if (isBefore1030AM) {
    confirmForDate = today;
    windowStatus = 'open';
  } else {
    windowStatus = 'closed';
  }

  const nextOpen = new Date(now);
  if (isClosedAfter1030AM) {
    nextOpen.setDate(nextOpen.getDate() + 1);
    nextOpen.setHours(14, 0, 0, 0);
  } else {
    nextOpen.setHours(14, 0, 0, 0);
  }

  const nextClose = new Date(now);
  if (isBefore1030AM) {
    nextClose.setHours(10, 30, 0, 0);
  } else {
    nextClose.setDate(nextClose.getDate() + 1);
    nextClose.setHours(10, 30, 0, 0);
  }

  return {
    isOpen: windowStatus === 'open',
    confirmForDate,
    opensAt: '2:00 PM',
    closesAt: '10:30 AM',
    nextOpen: nextOpen.toISOString(),
    nextClose: nextClose.toISOString(),
  };
}

router.get('/me', authenticate, authorize('employee'), (req, res) => {
  const user = db.find('users', u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const org = db.find('organizations', o => o.id === user.organization_id);

  res.json({
    id: user.id, email: user.email, name: user.name, role: user.role,
    organization_id: user.organization_id, employee_number: user.employee_number,
    department: user.department, organizationName: org?.name || 'Unknown',
  });
});

router.get('/today', authenticate, authorize('employee'), (req, res) => {
  const window = getConfirmationWindow();

  if (!window.isOpen) {
    return res.json({
      date: window.confirmForDate,
      attendance: { status: 'pending', confirmed_at: null },
      window: { isOpen: false, closesAt: window.closesAt, opensAt: window.opensAt },
      stats: { confirmed: 0, declined: 0, total: 0 },
    });
  }

  const attendance = db.find('lunch_attendance', a =>
    a.user_id === req.user.id && a.date === window.confirmForDate
  );

  const allForDate = db.filter('lunch_attendance', a => a.date === window.confirmForDate);
  const stats = {
    confirmed: allForDate.filter(a => a.status === 'confirmed').length,
    declined: allForDate.filter(a => a.status === 'declined').length,
    total: allForDate.length,
  };

  res.json({
    date: window.confirmForDate,
    attendance: attendance
      ? { id: attendance.id, status: attendance.status, confirmed_at: attendance.confirmed_at }
      : { status: 'pending', confirmed_at: null },
    window: { isOpen: true, closesAt: window.closesAt, opensAt: window.opensAt },
    stats,
  });
});

router.post('/respond', authenticate, authorize('employee'), (req, res) => {
  const { status } = req.body;
  if (!['confirmed', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Status must be "confirmed" or "declined"' });
  }

  const window = getConfirmationWindow();
  if (!window.isOpen) {
    return res.status(400).json({ error: 'Confirmation window is closed. Opens at 2:00 PM.' });
  }

  const confirmForDate = window.confirmForDate;
  const existing = db.find('lunch_attendance', a =>
    a.user_id === req.user.id && a.date === confirmForDate
  );
  const confirmedAt = new Date().toISOString();

  if (existing) {
    const oldStatus = existing.status;
    existing.status = status;
    existing.confirmed_at = confirmedAt;
    existing.updated_at = confirmedAt;
    db.auditLog(req.user.id, 'lunch_response_changed', 'lunch_attendance', existing.id, {
      oldStatus, newStatus: status, date: confirmForDate,
    });
  } else {
    const record = db.insert('lunch_attendance', {
      id: uuidv4(), user_id: req.user.id, date: confirmForDate, status,
      confirmed_at: confirmedAt, created_at: confirmedAt, updated_at: confirmedAt,
    });
    db.auditLog(req.user.id, 'lunch_confirmed', 'lunch_attendance', record.id, {
      status, date: confirmForDate,
    });
  }

  res.json({ message: 'Lunch response recorded', status, confirmForDate });
});

router.get('/history', authenticate, authorize('employee'), (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const allRecords = db.filter('lunch_attendance', a => a.user_id === req.user.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const total = allRecords.length;
  const offset = (page - 1) * limit;
  const records = allRecords.slice(offset, offset + Number(limit));

  res.json({
    records: records.map(r => ({ date: r.date, status: r.status, confirmed_at: r.confirmed_at, updated_at: r.updated_at })),
    pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

export default router;
