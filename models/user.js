const mongoose = require("mongoose");
const { Schema } = mongoose;
const passportLocalMongoose = require("passport-local-mongoose").default;

// const userSchema = new mongoose.Schema({
//     email: {
//         type: String,
//         required: true
//     }
    
// });

// Single day entry in the activity matrix
const ActivityDaySchema = new Schema(
  {
    date:            { type: Date, required: true },
    commits:         { type: Number, default: 0 },
    blogsPublished:  { type: Number, default: 0 },
    devLogsUploaded: { type: Number, default: 0 },
    reviewsGiven:    { type: Number, default: 0 },
    discussionPosts: { type: Number, default: 0 },
    milestonesHit:   { type: Number, default: 0 },
    xpEarned:        { type: Number, default: 0 },
  },
  { _id: false }
);
 
// Individual badge earned
const BadgeSchema = new Schema(
  {
    badgeId:     { type: String, required: true },
    name:        { type: String, required: true },
    description: { type: String },
    icon:        { type: String },
    earnedAt:    { type: Date, default: Date.now },
  },
  { _id: false }
);
 
// Peer review received or given
const ReviewSchema = new Schema(
  {
    projectId:   { type: Schema.Types.ObjectId, ref: "Project" },
    reviewerId:  { type: Schema.Types.ObjectId, ref: "User" },
    rating:      { type: Number, min: 1, max: 5 },
    comment:     { type: String, maxlength: 1000 },
    createdAt:   { type: Date, default: Date.now },
  },
  { _id: false }
);
 
// A single collaboration / team record
const CollaborationSchema = new Schema(
  {
    projectId:   { type: Schema.Types.ObjectId, ref: "Project" },
    projectName: { type: String },
    role:        { type: String },           // e.g. "Frontend Lead"
    joinedAt:    { type: Date },
    leftAt:      { type: Date },
    active:      { type: Boolean, default: true },
  },
  { _id: false }
);
 
// Opportunity the user applied to / bookmarked
const OpportunityRefSchema = new Schema(
  {
    opportunityId: { type: Schema.Types.ObjectId, ref: "Opportunity" },
    status: {
      type: String,
      enum: ["bookmarked", "applied", "shortlisted", "rejected", "accepted"],
      default: "bookmarked",
    },
    appliedAt: { type: Date },
  },
  { _id: false }
);
 
// ─────────────────────────────────────────────
// MAIN USER SCHEMA
// ─────────────────────────────────────────────
 
const UserSchema = new Schema(
  {
    // ── AUTH ──────────────────────────────────
    email: {
      type:     String,
      required: true,
      unique:   true,
      lowercase: true,
      trim:     true,
      match:    [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    // Passport-local-mongoose automatically adds: username, hash, salt
 
    // ── BASIC IDENTITY ────────────────────────
    displayName: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 60,
    },
    username: {
      type:      String,
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^[a-z0-9_-]{3,30}$/, "Username must be 3–30 chars, letters/numbers/_ only"],
    },
    avatarUrl:  { type: String, default: "" },
    bio:        { type: String, maxlength: 300, default: "" },
 
    // ── INSTITUTIONAL INFO ────────────────────
    institution: {
      name:       { type: String, trim: true, maxlength: 120 },
      type: {
        type:    String,
        enum:    ["college", "university", "company", "bootcamp", "self-taught", "other"],
        default: "college",
      },
    },
    academicYear: {
      type: String,
      enum: [
        "1st Year", "2nd Year", "3rd Year", "4th Year",
        "Final Year", "Alumni", "Working Professional", "Other",
      ],
    },
 
    // ── TECHNICAL PROFILE ─────────────────────
    domains: {
      type: [String],
      enum: [
        "Full Stack", "Frontend", "Backend", "Mobile",
        "AI / ML", "Cybersecurity", "DevOps / Cloud",
        "Blockchain", "Data Science", "UI / UX",
        "Open Source", "Embedded / IoT",
      ],
      default: [],
    },
    experienceRange: {
      type: String,
      enum: ["< 6 months", "6–12 months", "1–2 years", "2–4 years", "4+ years", "Battle-hardened"],
    },
    githubHandle:   { type: String, trim: true, default: "" },
    linkedinUrl:    { type: String, trim: true, default: "" },
    portfolioUrl:   { type: String, trim: true, default: "" },
    techStack:      { type: [String], default: [] },  // freeform tags added later
 
    // ── RANK SYSTEM ───────────────────────────
    selfDeclaredRank: {
      type:    String,
      enum:    ["Psilos", "Hoplite", "Hippeis", "Ouragos", "Lochagos", "Taxiarch", "Hipparch", "Strategos"],
      default: "Psilos",
    },
    computedRank: {
      type:    String,
      enum:    ["Psilos", "Hoplite", "Hippeis", "Ouragos", "Lochagos", "Taxiarch", "Hipparch", "Strategos"],
      default: "Psilos",
    },
    xp:            { type: Number, default: 0, min: 0 },
    xpToNextRank:  { type: Number, default: 100 },
    rankUpdatedAt: { type: Date },
 
    // ── INTENT & DISCOVERY ────────────────────
    primaryGoals: {
      type: [String],
      enum: [
        "Build a real portfolio", "Find serious teammates",
        "Prove my technical skills", "Get internship / job",
        "Build in public", "Join builder community",
        "Win hackathons", "All of the above",
      ],
      default: [],
    },
    discoveredVia: {
      type: String,
      enum: [
        "Friend / Classmate", "LinkedIn", "Twitter / X", "Instagram",
        "Discord / Reddit", "College Club", "Faculty / Professor",
        "Hackathon", "Just exploring", "Other",
      ],
    },
 
    // ── BUILDER COMMITMENT ────────────────────
    consistencyPledge: {
      type: String,
      enum: [
        "Daily builder", "3–4x per week", "Weekends only",
        "Project-driven", "Whenever inspired", "ALL IN — no mercy",
      ],
    },
 
    // ── FIRST CODEX ENTRY (onboarding) ────────
    firstBuildStory: { type: String, maxlength: 500, default: "" },
 
    // ── ACTIVITY MATRIX ───────────────────────
    activityMatrix:       { type: [ActivityDaySchema], default: [] },
    currentStreak:        { type: Number, default: 0 },   // consecutive active days
    longestStreak:        { type: Number, default: 0 },
    totalActiveDays:      { type: Number, default: 0 },
    lastActiveDate:       { type: Date },
 
    // ── CONTENT COUNTS (denormalised for speed) ─
    stats: {
      projectsSubmitted:  { type: Number, default: 0 },
      blogsPublished:     { type: Number, default: 0 },
      devLogsPosted:      { type: Number, default: 0 },
      reviewsGiven:       { type: Number, default: 0 },
      reviewsReceived:    { type: Number, default: 0 },
      commentsPosted:     { type: Number, default: 0 },
      upvotesReceived:    { type: Number, default: 0 },
      collaborations:     { type: Number, default: 0 },
    },
 
    // ── REFERENCES ────────────────────────────
    projects:       { type: [{ type: Schema.Types.ObjectId, ref: "Project" }],    default: [] },
    codexEntries:   { type: [{ type: Schema.Types.ObjectId, ref: "CodexEntry" }], default: [] },
    reviewsGivenArr:    { type: [ReviewSchema], default: [] },
    reviewsReceivedArr: { type: [ReviewSchema], default: [] },
    collaborationHistory: { type: [CollaborationSchema], default: [] },
    badges:         { type: [BadgeSchema], default: [] },
    opportunities:  { type: [OpportunityRefSchema], default: [] },
    following:      { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    followers:      { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
 
    // ── ACCOUNT META ─────────────────────────
    accountStatus: {
      type:    String,
      enum:    ["active", "suspended", "deactivated", "banned"],
      default: "active",
    },
    onboardingComplete: { type: Boolean, default: false },
    profileVisibility: {
      type:    String,
      enum:    ["public", "builders-only", "private"],
      default: "public",
    },
    lastLoginAt: { type: Date },
  },
 
  {
    timestamps: true,   // createdAt + updatedAt auto-managed
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);
 
// ─────────────────────────────────────────────
// VIRTUALS
// ─────────────────────────────────────────────
 
// Full GitHub URL
UserSchema.virtual("githubUrl").get(function () {
  return this.githubHandle ? `https://github.com/${this.githubHandle}` : "";
});
 
// Follower / following counts
UserSchema.virtual("followerCount").get(function () {
  return this.followers?.length ?? 0;
});
UserSchema.virtual("followingCount").get(function () {
  return this.following?.length ?? 0;
});
 
// ─────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────
 
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ computedRank: 1 });
UserSchema.index({ xp: -1 });                        // leaderboard sort
UserSchema.index({ "institution.name": 1 });
UserSchema.index({ domains: 1 });                    // filter by tech domain
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastActiveDate: -1 });
UserSchema.index({ accountStatus: 1, computedRank: 1 });  // compound for Arena queries

// ─────────────────────────────────────────────
// PASSPORT-LOCAL-MONGOOSE PLUGIN
// ─────────────────────────────────────────────
// Automatically adds: username, password, salt, hash fields
// Adds methods: setPassword, authenticate, serializeUser, deserializeUser

UserSchema.plugin(passportLocalMongoose, {
  usernameField: "username",
  lastLoginField: "lastLoginAt",
});

module.exports = mongoose.model("User", UserSchema);