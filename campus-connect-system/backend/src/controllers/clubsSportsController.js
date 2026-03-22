const ClubsSports = require('../models/ClubsSportsModel');
const Team = require('../models/TeamModel');
const PracticeSchedule = require('../models/PracticeScheduleModel');
const JoinRequest = require('../models/JoinRequestModel');

/* ─────────────────────────────────────────────
   CLUB CRUD
───────────────────────────────────────────── */

/** GET /api/clubs-sports
 *  Public – returns only approved, active clubs.
 *  Supports ?search= and ?category= query params.
 */
const getAll = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const filter = {
      isActive: true,
      status: { $in: ['approved', 'pending_approval'] },
    };

    if (category) {
      const normalizedCategory = String(category).toLowerCase();
      if (['club', 'clubs'].includes(normalizedCategory)) {
        filter.category = { $regex: '^club', $options: 'i' };
      } else if (['sport', 'sports'].includes(normalizedCategory)) {
        filter.category = { $regex: '^sport', $options: 'i' };
      }
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { sportType: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await ClubsSports.find(filter)
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    next(error);
  }
};

/** GET /api/clubs-sports/admin/all
 *  Super-admin – returns ALL clubs regardless of status.
 */
const getAllAdmin = async (req, res, next) => {
  try {
    const items = await ClubsSports.find({ isActive: true })
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

/** GET /api/clubs-sports/my-clubs
 *  Coach/Super-admin – returns all active clubs so any coach can manage any club.
 */
const getMyClubs = async (req, res, next) => {
  try {
    const items = await ClubsSports.find({ isActive: true })
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

/** GET /api/clubs-sports/:id */
const getOne = async (req, res, next) => {
  try {
    const club = await ClubsSports.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate('createdBy', 'fullName email');

    if (!club) return res.status(404).json({ message: 'Club not found.' });
    res.json(club);
  } catch (error) {
    next(error);
  }
};

/** POST /api/clubs-sports
 *  Coach creates a new club – starts as pending_approval.
 */
const create = async (req, res, next) => {
  try {
    const { title, description, category, sportType, coachInfo } = req.body;
    if (!title || !category)
      return res.status(400).json({ message: 'Title and category are required.' });

    const item = await ClubsSports.create({
      title,
      description: description || '',
      category,
      sportType: sportType || '',
      coachInfo: coachInfo || '',
      createdBy: req.user._id,
      status: 'pending_approval',
    });

    const populated = await ClubsSports.findById(item._id).populate('createdBy', 'fullName email');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/clubs-sports/:id
 *  Coach updates their own club; super_admin can update any.
 */
const update = async (req, res, next) => {
  try {
    const club = await ClubsSports.findById(req.params.id);
    if (!club || !club.isActive) return res.status(404).json({ message: 'Club not found.' });

    if (req.user.role === 'coach' && club.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own clubs.' });
    }

    const allowed = ['title', 'description', 'sportType', 'coachInfo', 'category'];
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) club[f] = req.body[f];
    });

    await club.save();
    const populated = await ClubsSports.findById(club._id).populate('createdBy', 'fullName email');
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/clubs-sports/:id  (soft-delete) */
const remove = async (req, res, next) => {
  try {
    const club = await ClubsSports.findById(req.params.id);
    if (!club || !club.isActive) return res.status(404).json({ message: 'Club not found.' });

    if (req.user.role === 'coach' && club.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own clubs.' });
    }

    club.isActive = false;
    await club.save();
    res.json({ message: 'Club removed successfully.' });
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/clubs-sports/:id/status
 *  Super admin only. body: { status: 'approved'|'disabled'|'pending_approval' }
 */
const updateClubStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending_approval', 'approved', 'disabled'].includes(status))
      return res.status(400).json({ message: 'Invalid status.' });

    const club = await ClubsSports.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('createdBy', 'fullName email');

    if (!club) return res.status(404).json({ message: 'Club not found.' });
    res.json(club);
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────
   TEAMS
───────────────────────────────────────────── */

/** GET /api/clubs-sports/:id/teams */
const getTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({ club: req.params.id, isActive: true })
      .populate('members', 'fullName email idNumber')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(teams);
  } catch (error) {
    next(error);
  }
};

/** POST /api/clubs-sports/:id/teams */
const createTeam = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Team name is required.' });

    const club = await ClubsSports.findById(req.params.id);
    if (!club || !club.isActive) return res.status(404).json({ message: 'Club not found.' });

    const team = await Team.create({
      name,
      description: description || '',
      club: req.params.id,
      createdBy: req.user._id,
    });

    res.status(201).json(team);
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/clubs-sports/teams/:teamId */
const updateTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId).populate('club');
    if (!team || !team.isActive) return res.status(404).json({ message: 'Team not found.' });

    ['name', 'description'].forEach((f) => {
      if (req.body[f] !== undefined) team[f] = req.body[f];
    });

    await team.save();
    res.json(team);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/clubs-sports/teams/:teamId */
const deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId).populate('club');
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    team.isActive = false;
    await team.save();
    res.json({ message: 'Team deleted.' });
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/clubs-sports/teams/:teamId/members */
const manageTeamMember = async (req, res, next) => {
  try {
    const { userId, action } = req.body;
    const team = await Team.findById(req.params.teamId).populate('club');
    if (!team || !team.isActive) return res.status(404).json({ message: 'Team not found.' });

    if (action === 'add') {
      if (!team.members.map((m) => m.toString()).includes(userId)) team.members.push(userId);
    } else if (action === 'remove') {
      team.members = team.members.filter((m) => m.toString() !== userId);
    } else {
      return res.status(400).json({ message: "action must be 'add' or 'remove'." });
    }

    await team.save();
    const populated = await Team.findById(team._id).populate('members', 'fullName email idNumber');
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────
   PRACTICE SCHEDULES
───────────────────────────────────────────── */

/** GET /api/clubs-sports/:id/schedules */
const getSchedules = async (req, res, next) => {
  try {
    const schedules = await PracticeSchedule.find({ club: req.params.id })
      .populate('createdBy', 'fullName email')
      .sort({ date: 1 });
    res.json(schedules);
  } catch (error) {
    next(error);
  }
};

/** POST /api/clubs-sports/:id/schedules */
const createSchedule = async (req, res, next) => {
  try {
    const { title, date, time, location, description } = req.body;
    if (!title || !date || !time)
      return res.status(400).json({ message: 'Title, date, and time are required.' });

    const club = await ClubsSports.findById(req.params.id);
    if (!club || !club.isActive) return res.status(404).json({ message: 'Club not found.' });

    const schedule = await PracticeSchedule.create({
      club: req.params.id,
      title,
      date,
      time,
      location: location || '',
      description: description || '',
      createdBy: req.user._id,
    });

    res.status(201).json(schedule);
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/clubs-sports/schedules/:scheduleId */
const updateSchedule = async (req, res, next) => {
  try {
    const schedule = await PracticeSchedule.findById(req.params.scheduleId).populate('club');
    if (!schedule) return res.status(404).json({ message: 'Schedule not found.' });

    ['title', 'date', 'time', 'location', 'description'].forEach((f) => {
      if (req.body[f] !== undefined) schedule[f] = req.body[f];
    });

    await schedule.save();
    res.json(schedule);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/clubs-sports/schedules/:scheduleId */
const deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await PracticeSchedule.findById(req.params.scheduleId).populate('club');
    if (!schedule) return res.status(404).json({ message: 'Schedule not found.' });

    await schedule.deleteOne();
    res.json({ message: 'Schedule deleted.' });
  } catch (error) {
    next(error);
  }
};

/* ─────────────────────────────────────────────
   JOIN REQUESTS
───────────────────────────────────────────── */

/** POST /api/clubs-sports/:id/join */
const sendJoinRequest = async (req, res, next) => {
  try {
    const club = await ClubsSports.findOne({ _id: req.params.id, status: 'approved', isActive: true });
    if (!club) return res.status(404).json({ message: 'Club not found or not approved.' });

    const existing = await JoinRequest.findOne({ user: req.user._id, club: req.params.id });
    if (existing) {
      return res.status(409).json({
        message: `You already have a ${existing.status} request for this club.`,
      });
    }

    const request = await JoinRequest.create({
      user: req.user._id,
      club: req.params.id,
      message: req.body.message || '',
    });

    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
};

/** GET /api/clubs-sports/my-requests */
const getMyRequests = async (req, res, next) => {
  try {
    const requests = await JoinRequest.find({ user: req.user._id })
      .populate('club', 'title category sportType status')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/clubs-sports/:id/leave */
const leaveClub = async (req, res, next) => {
  try {
    const request = await JoinRequest.findOne({
      user: req.user._id,
      club: req.params.id,
      status: 'approved',
    });

    if (!request)
      return res.status(404).json({ message: 'You are not a member of this club.' });

    await Team.updateMany(
      { club: req.params.id },
      { $pull: { members: req.user._id } }
    );

    await request.deleteOne();
    res.json({ message: 'You have left the club.' });
  } catch (error) {
    next(error);
  }
};

/** GET /api/clubs-sports/:id/requests */
const getClubRequests = async (req, res, next) => {
  try {
    const club = await ClubsSports.findById(req.params.id);
    if (!club) return res.status(404).json({ message: 'Club not found.' });

    const requests = await JoinRequest.find({ club: req.params.id })
      .populate('user', 'fullName email idNumber')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/clubs-sports/requests/:requestId/status */
const handleJoinRequest = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: "status must be 'approved' or 'rejected'." });

    const request = await JoinRequest.findById(req.params.requestId).populate('club');
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    request.status = status;
    request.adminNote = adminNote || '';
    await request.save();

    const populated = await JoinRequest.findById(request._id).populate(
      'user',
      'fullName email idNumber'
    );
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // clubs
  getAll,
  getAllAdmin,
  getMyClubs,
  getOne,
  create,
  update,
  remove,
  updateClubStatus,
  // teams
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  manageTeamMember,
  // schedules
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  // join requests
  sendJoinRequest,
  getMyRequests,
  leaveClub,
  getClubRequests,
  handleJoinRequest,
};
