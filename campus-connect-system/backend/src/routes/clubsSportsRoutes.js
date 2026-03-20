const express = require('express');
const {
  getAll,
  getAllAdmin,
  getMyClubs,
  getOne,
  create,
  update,
  remove,
  updateClubStatus,
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  manageTeamMember,
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  sendJoinRequest,
  getMyRequests,
  leaveClub,
  getClubRequests,
  handleJoinRequest,
} = require('../controllers/clubsSportsController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

const router = express.Router();

// ── public ───────────────────────────────────────────────────────────────────
router.get('/', getAll);

// ── all routes below require a valid token ────────────────────────────────────
router.use(protect);

// fixed named routes MUST be declared before any /:param routes to avoid conflicts

// coach / super_admin – fixed paths
router.get('/admin/all', restrictTo('coach', 'super_admin'), getAllAdmin);
router.get('/my-clubs',  restrictTo('coach', 'super_admin'), getMyClubs);

// student – fixed paths
router.get('/my-requests', getMyRequests);

// coach / super_admin – sub-resource fixed paths
router.patch('/teams/:teamId/members',   restrictTo('coach', 'super_admin'), manageTeamMember);
router.patch('/teams/:teamId',           restrictTo('coach', 'super_admin'), updateTeam);
router.delete('/teams/:teamId',          restrictTo('coach', 'super_admin'), deleteTeam);

router.patch('/schedules/:scheduleId',   restrictTo('coach', 'super_admin'), updateSchedule);
router.delete('/schedules/:scheduleId',  restrictTo('coach', 'super_admin'), deleteSchedule);

router.patch('/requests/:requestId/status', restrictTo('coach', 'super_admin'), handleJoinRequest);

// ── parameterised club routes (:id) ──────────────────────────────────────────
router.get('/:id', getOne);

router.post('/', restrictTo('coach', 'super_admin'), create);
router.patch('/:id', restrictTo('coach', 'super_admin'), update);
router.delete('/:id', restrictTo('coach', 'super_admin'), remove);

router.patch('/:id/status', restrictTo('super_admin'), updateClubStatus);

// teams
router.get('/:id/teams',  getTeams);
router.post('/:id/teams', restrictTo('coach', 'super_admin'), createTeam);

// practice schedules
router.get('/:id/schedules',  getSchedules);
router.post('/:id/schedules', restrictTo('coach', 'super_admin'), createSchedule);

// join requests
router.post('/:id/join',     restrictTo('student'), sendJoinRequest);
router.delete('/:id/leave',  restrictTo('student'), leaveClub);
router.get('/:id/requests',  restrictTo('coach', 'super_admin'), getClubRequests);

module.exports = router;
