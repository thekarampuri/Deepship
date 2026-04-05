const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

// Icons
const {
  FaShieldAlt, FaUsers, FaProjectDiagram, FaCogs, FaDatabase,
  FaChartBar, FaBug, FaKey, FaUserShield, FaUserTie, FaUserCog,
  FaEye, FaCheck, FaTimes, FaArrowRight, FaServer, FaCode,
  FaStream, FaClipboardList, FaLock, FaRocket
} = require("react-icons/fa");

function renderIconSvg(IconComponent, color, size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// ── Color palette: Midnight Executive ──
const C = {
  bg:       "0F1629",   // deep navy background
  bgCard:   "1A2340",   // card backgrounds
  bgLight:  "243056",   // lighter card/section bg
  accent:   "3B82F6",   // blue accent
  accent2:  "8B5CF6",   // purple accent
  accent3:  "10B981",   // green accent
  accent4:  "F59E0B",   // amber accent
  accent5:  "EF4444",   // red accent
  text:     "F1F5F9",   // primary text
  textMute: "94A3B8",   // muted text
  textDim:  "64748B",   // dim text
  white:    "FFFFFF",
  border:   "334155",
};

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "TraceHub";
  pres.title = "TraceHub — Access Control & Dashboard Architecture";

  // Pre-render all icons
  const icons = {
    shield:   await iconToBase64Png(FaShieldAlt, "#3B82F6"),
    users:    await iconToBase64Png(FaUsers, "#8B5CF6"),
    project:  await iconToBase64Png(FaProjectDiagram, "#10B981"),
    cogs:     await iconToBase64Png(FaCogs, "#F59E0B"),
    db:       await iconToBase64Png(FaDatabase, "#3B82F6"),
    chart:    await iconToBase64Png(FaChartBar, "#10B981"),
    bug:      await iconToBase64Png(FaBug, "#EF4444"),
    key:      await iconToBase64Png(FaKey, "#F59E0B"),
    admin:    await iconToBase64Png(FaUserShield, "#3B82F6"),
    manager:  await iconToBase64Png(FaUserTie, "#8B5CF6"),
    dev:      await iconToBase64Png(FaUserCog, "#10B981"),
    viewer:   await iconToBase64Png(FaEye, "#64748B"),
    check:    await iconToBase64Png(FaCheck, "#10B981"),
    cross:    await iconToBase64Png(FaTimes, "#EF4444"),
    arrow:    await iconToBase64Png(FaArrowRight, "#3B82F6"),
    server:   await iconToBase64Png(FaServer, "#8B5CF6"),
    code:     await iconToBase64Png(FaCode, "#10B981"),
    stream:   await iconToBase64Png(FaStream, "#3B82F6"),
    clip:     await iconToBase64Png(FaClipboardList, "#F59E0B"),
    lock:     await iconToBase64Png(FaLock, "#EF4444"),
    rocket:   await iconToBase64Png(FaRocket, "#3B82F6"),
  };

  // Helper: factory for shadow objects (avoid mutation bug)
  const mkShadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.3 });

  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 1: Title
  // ═══════════════════════════════════════════════════════════════════
  let s1 = pres.addSlide();
  s1.background = { color: C.bg };

  // Top accent bar
  s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  // Logo icon
  s1.addImage({ data: icons.shield, x: 4.35, y: 1.0, w: 1.3, h: 1.3 });

  s1.addText("TraceHub", {
    x: 0, y: 2.4, w: 10, h: 0.9,
    fontSize: 48, fontFace: "Arial Black", color: C.white, align: "center", margin: 0,
  });

  s1.addText("Access Control & Dashboard Architecture", {
    x: 0, y: 3.2, w: 10, h: 0.5,
    fontSize: 18, fontFace: "Calibri", color: C.textMute, align: "center", margin: 0,
  });

  // Subtle tagline
  s1.addShape(pres.shapes.RECTANGLE, { x: 3.5, y: 4.0, w: 3, h: 0.003, fill: { color: C.accent, transparency: 50 } });
  s1.addText("Self-Hosted Log Ingestion & Error Tracking Platform", {
    x: 0, y: 4.15, w: 10, h: 0.4,
    fontSize: 12, fontFace: "Calibri", color: C.textDim, align: "center", margin: 0,
  });

  // Bottom bar
  s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: C.accent } });

  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 2: Entity Hierarchy
  // ═══════════════════════════════════════════════════════════════════
  let s2 = pres.addSlide();
  s2.background = { color: C.bg };
  s2.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s2.addText("Entity Hierarchy", {
    x: 0.6, y: 0.25, w: 9, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.white, margin: 0,
  });
  s2.addText("How organizations, teams, projects, and users relate to each other", {
    x: 0.6, y: 0.8, w: 9, h: 0.35, fontSize: 13, fontFace: "Calibri", color: C.textMute, margin: 0,
  });

  // Organization box (top level)
  s2.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.35, w: 9.0, h: 4.0, fill: { color: C.bgCard }, line: { color: C.accent, width: 1.5 }, shadow: mkShadow() });
  s2.addImage({ data: icons.shield, x: 0.7, y: 1.45, w: 0.35, h: 0.35 });
  s2.addText("Organization", { x: 1.1, y: 1.45, w: 3, h: 0.4, fontSize: 16, fontFace: "Calibri", bold: true, color: C.accent, margin: 0 });

  // Users box (top-right inside org)
  s2.addShape(pres.shapes.RECTANGLE, { x: 5.8, y: 1.5, w: 3.5, h: 1.6, fill: { color: C.bgLight }, line: { color: C.accent2, width: 1 } });
  s2.addImage({ data: icons.users, x: 6.0, y: 1.6, w: 0.3, h: 0.3 });
  s2.addText("Users (RBAC Roles)", { x: 6.35, y: 1.6, w: 2.8, h: 0.3, fontSize: 12, fontFace: "Calibri", bold: true, color: C.accent2, margin: 0 });
  s2.addImage({ data: icons.admin, x: 6.15, y: 2.05, w: 0.22, h: 0.22 });
  s2.addText("ADMIN", { x: 6.4, y: 2.05, w: 1.2, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.accent, margin: 0 });
  s2.addImage({ data: icons.manager, x: 6.15, y: 2.35, w: 0.22, h: 0.22 });
  s2.addText("MANAGER", { x: 6.4, y: 2.35, w: 1.2, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.accent2, margin: 0 });
  s2.addImage({ data: icons.dev, x: 7.7, y: 2.05, w: 0.22, h: 0.22 });
  s2.addText("DEVELOPER", { x: 7.95, y: 2.05, w: 1.2, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.accent3, margin: 0 });
  s2.addImage({ data: icons.viewer, x: 7.7, y: 2.35, w: 0.22, h: 0.22 });
  s2.addText("VIEWER", { x: 7.95, y: 2.35, w: 1.2, h: 0.25, fontSize: 11, fontFace: "Calibri", color: C.textDim, margin: 0 });

  // Teams box
  s2.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 2.1, w: 4.6, h: 0.7, fill: { color: C.bgLight }, line: { color: C.accent4, width: 1 } });
  s2.addImage({ data: icons.users, x: 1.0, y: 2.2, w: 0.28, h: 0.28 });
  s2.addText("Teams", { x: 1.35, y: 2.15, w: 1.5, h: 0.35, fontSize: 14, fontFace: "Calibri", bold: true, color: C.accent4, margin: 0 });
  s2.addText("Groups of users within the org", { x: 1.35, y: 2.45, w: 3, h: 0.25, fontSize: 10, fontFace: "Calibri", color: C.textDim, margin: 0 });

  // Project box (inside teams area)
  s2.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.1, w: 4.6, h: 2.05, fill: { color: C.bgLight }, line: { color: C.accent3, width: 1 } });
  s2.addImage({ data: icons.project, x: 1.0, y: 3.2, w: 0.28, h: 0.28 });
  s2.addText("Projects", { x: 1.35, y: 3.18, w: 2, h: 0.35, fontSize: 14, fontFace: "Calibri", bold: true, color: C.accent3, margin: 0 });

  // Sub-entities inside project
  const subItems = [
    { icon: icons.cogs, label: "Modules", desc: "auth, payments, cart...", x: 1.0, color: C.accent4 },
    { icon: icons.key, label: "API Keys", desc: "th_xxx SDK tokens", x: 3.15, color: C.accent4 },
  ];
  subItems.forEach((item, i) => {
    s2.addShape(pres.shapes.RECTANGLE, { x: item.x, y: 3.65, w: 1.9, h: 0.7, fill: { color: "1E2B4A" }, line: { color: C.border, width: 0.5 } });
    s2.addImage({ data: item.icon, x: item.x + 0.1, y: 3.72, w: 0.22, h: 0.22 });
    s2.addText(item.label, { x: item.x + 0.35, y: 3.7, w: 1.4, h: 0.25, fontSize: 11, fontFace: "Calibri", bold: true, color: item.color, margin: 0 });
    s2.addText(item.desc, { x: item.x + 0.1, y: 3.98, w: 1.7, h: 0.25, fontSize: 9, fontFace: "Calibri", color: C.textDim, margin: 0 });
  });

  // Logs & Issues
  s2.addShape(pres.shapes.RECTANGLE, { x: 1.0, y: 4.55, w: 1.9, h: 0.5, fill: { color: "1E2B4A" }, line: { color: C.border, width: 0.5 } });
  s2.addImage({ data: icons.stream, x: 1.1, y: 4.62, w: 0.22, h: 0.22 });
  s2.addText("Logs", { x: 1.35, y: 4.6, w: 1.4, h: 0.3, fontSize: 11, fontFace: "Calibri", bold: true, color: C.accent, margin: 0 });

  s2.addShape(pres.shapes.RECTANGLE, { x: 3.15, y: 4.55, w: 1.9, h: 0.5, fill: { color: "1E2B4A" }, line: { color: C.border, width: 0.5 } });
  s2.addImage({ data: icons.bug, x: 3.25, y: 4.62, w: 0.22, h: 0.22 });
  s2.addText("Issues", { x: 3.5, y: 4.6, w: 1.4, h: 0.3, fontSize: 11, fontFace: "Calibri", bold: true, color: C.accent5, margin: 0 });

  // Join Requests box
  s2.addShape(pres.shapes.RECTANGLE, { x: 5.8, y: 3.4, w: 3.5, h: 1.7, fill: { color: C.bgLight }, line: { color: C.accent3, width: 1 } });
  s2.addImage({ data: icons.clip, x: 6.0, y: 3.5, w: 0.28, h: 0.28 });
  s2.addText("Join Requests", { x: 6.35, y: 3.48, w: 2.5, h: 0.35, fontSize: 12, fontFace: "Calibri", bold: true, color: C.accent3, margin: 0 });

  s2.addText([
    { text: "ORG Request", options: { fontSize: 10, color: C.accent, bold: true, breakLine: true } },
    { text: "Manager joins organization", options: { fontSize: 9, color: C.textDim, breakLine: true } },
    { text: "", options: { fontSize: 6, breakLine: true } },
    { text: "PROJECT Invite", options: { fontSize: 10, color: C.accent2, bold: true, breakLine: true } },
    { text: "Manager invites developer", options: { fontSize: 9, color: C.textDim } },
  ], { x: 6.15, y: 3.9, w: 3.0, h: 1.1, fontFace: "Calibri", margin: 0 });


  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 3: RBAC Permission Matrix
  // ═══════════════════════════════════════════════════════════════════
  let s3 = pres.addSlide();
  s3.background = { color: C.bg };
  s3.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent2 } });

  s3.addText("RBAC Permission Matrix", {
    x: 0.6, y: 0.25, w: 9, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.white, margin: 0,
  });
  s3.addText("Who can do what across the platform", {
    x: 0.6, y: 0.8, w: 9, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.textMute, margin: 0,
  });

  // Table
  const hdrOpts = { fill: { color: C.accent }, color: C.white, bold: true, fontSize: 10, fontFace: "Calibri", align: "center", valign: "middle" };
  const cellA = { fill: { color: C.bgCard }, color: C.text, fontSize: 9, fontFace: "Calibri", valign: "middle" };
  const cellY = { fill: { color: "0D2818" }, color: "10B981", fontSize: 10, fontFace: "Calibri", bold: true, align: "center", valign: "middle" };
  const cellN = { fill: { color: "2A1215" }, color: "EF4444", fontSize: 10, fontFace: "Calibri", bold: true, align: "center", valign: "middle" };
  const cellP = { fill: { color: "2A2005" }, color: "F59E0B", fontSize: 9, fontFace: "Calibri", bold: true, align: "center", valign: "middle" };

  const tableData = [
    [
      { text: "Action", options: hdrOpts },
      { text: "ADMIN", options: hdrOpts },
      { text: "MANAGER", options: hdrOpts },
      { text: "DEVELOPER", options: hdrOpts },
    ],
    [{ text: "  Manage Org Members", options: cellA }, { text: "\u2713", options: cellY }, { text: "\u2717", options: cellN }, { text: "\u2717", options: cellN }],
    [{ text: "  Create / Approve Projects", options: cellA }, { text: "\u2713", options: cellY }, { text: "Pending", options: cellP }, { text: "\u2717", options: cellN }],
    [{ text: "  View Projects", options: cellA }, { text: "All in Org", options: cellY }, { text: "All in Org", options: cellY }, { text: "Assigned", options: cellP }],
    [{ text: "  Assign Developers", options: cellA }, { text: "\u2713", options: cellY }, { text: "\u2713", options: cellY }, { text: "\u2717", options: cellN }],
    [{ text: "  Create API Keys", options: cellA }, { text: "\u2713", options: cellY }, { text: "\u2713", options: cellY }, { text: "\u2717", options: cellN }],
    [{ text: "  View API Keys", options: cellA }, { text: "All", options: cellY }, { text: "All", options: cellY }, { text: "Own", options: cellP }],
    [{ text: "  View Logs & Issues", options: cellA }, { text: "\u2713", options: cellY }, { text: "\u2713", options: cellY }, { text: "\u2713", options: cellY }],
    [{ text: "  Assign Issues to Devs", options: cellA }, { text: "\u2713", options: cellY }, { text: "\u2713", options: cellY }, { text: "\u2717", options: cellN }],
    [{ text: "  Approve ORG Join Req", options: cellA }, { text: "\u2713", options: cellY }, { text: "\u2717", options: cellN }, { text: "\u2717", options: cellN }],
    [{ text: "  Accept Project Invites", options: cellA }, { text: "\u2717", options: cellN }, { text: "\u2717", options: cellN }, { text: "\u2713", options: cellY }],
    [{ text: "  Search & Invite Devs", options: cellA }, { text: "\u2713", options: cellY }, { text: "\u2713", options: cellY }, { text: "\u2717", options: cellN }],
  ];

  s3.addTable(tableData, {
    x: 0.5, y: 1.25, w: 9.0,
    colW: [3.5, 1.83, 1.83, 1.83],
    rowH: [0.35, 0.33, 0.33, 0.33, 0.33, 0.33, 0.33, 0.33, 0.33, 0.33, 0.33, 0.33],
    border: { pt: 0.5, color: C.border },
  });

  // Legend
  s3.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 5.22, w: 1.0, h: 0.25, fill: { color: "0D2818" }, line: { color: C.border, width: 0.5 } });
  s3.addText("\u2713 Full Access", { x: 0.5, y: 5.22, w: 1.0, h: 0.25, fontSize: 8, fontFace: "Calibri", color: "10B981", align: "center", valign: "middle", margin: 0 });
  s3.addShape(pres.shapes.RECTANGLE, { x: 1.65, y: 5.22, w: 1.0, h: 0.25, fill: { color: "2A2005" }, line: { color: C.border, width: 0.5 } });
  s3.addText("Limited", { x: 1.65, y: 5.22, w: 1.0, h: 0.25, fontSize: 8, fontFace: "Calibri", color: "F59E0B", align: "center", valign: "middle", margin: 0 });
  s3.addShape(pres.shapes.RECTANGLE, { x: 2.8, y: 5.22, w: 1.0, h: 0.25, fill: { color: "2A1215" }, line: { color: C.border, width: 0.5 } });
  s3.addText("\u2717 No Access", { x: 2.8, y: 5.22, w: 1.0, h: 0.25, fontSize: 8, fontFace: "Calibri", color: "EF4444", align: "center", valign: "middle", margin: 0 });


  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 4: Dashboard Views per Role
  // ═══════════════════════════════════════════════════════════════════
  let s4 = pres.addSlide();
  s4.background = { color: C.bg };
  s4.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent3 } });

  s4.addText("Dashboard Views by Role", {
    x: 0.6, y: 0.25, w: 9, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.white, margin: 0,
  });
  s4.addText("Each role sees a tailored dashboard with role-specific navigation and data", {
    x: 0.6, y: 0.8, w: 9, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.textMute, margin: 0,
  });

  // Three role columns
  const roles = [
    {
      icon: icons.admin, title: "Admin Dashboard", color: C.accent, x: 0.4,
      pages: ["/admin/dashboard", "/admin/manage-org", "/admin/projects", "/admin/settings"],
      desc: ["Overview stats", "Manage org members", "Approve pending projects", "Platform settings"],
    },
    {
      icon: icons.manager, title: "Manager Dashboard", color: C.accent2, x: 3.55,
      pages: ["/manager/dashboard", "/manager/projects", "/manager/projects/:id", "/manager/requests"],
      desc: ["Team & project stats", "Project management", "Assign devs, API keys", "Handle join requests"],
    },
    {
      icon: icons.dev, title: "Developer Dashboard", color: C.accent3, x: 6.7,
      pages: ["/developer/dashboard", "/developer/projects", "/developer/logs", "/developer/invitations"],
      desc: ["Assigned projects", "View project details", "Browse & search logs", "Accept/reject invites"],
    },
  ];

  roles.forEach((role) => {
    // Card background
    s4.addShape(pres.shapes.RECTANGLE, { x: role.x, y: 1.3, w: 2.95, h: 4.05, fill: { color: C.bgCard }, line: { color: role.color, width: 1 }, shadow: mkShadow() });
    // Accent top bar
    s4.addShape(pres.shapes.RECTANGLE, { x: role.x, y: 1.3, w: 2.95, h: 0.06, fill: { color: role.color } });

    // Icon + Title
    s4.addImage({ data: role.icon, x: role.x + 0.15, y: 1.5, w: 0.35, h: 0.35 });
    s4.addText(role.title, { x: role.x + 0.55, y: 1.5, w: 2.2, h: 0.4, fontSize: 13, fontFace: "Calibri", bold: true, color: role.color, margin: 0 });

    // Routes
    role.pages.forEach((page, i) => {
      const rowY = 2.1 + i * 0.75;
      s4.addShape(pres.shapes.RECTANGLE, { x: role.x + 0.12, y: rowY, w: 2.7, h: 0.6, fill: { color: C.bgLight }, line: { color: C.border, width: 0.5 } });
      s4.addText(page, { x: role.x + 0.2, y: rowY + 0.02, w: 2.55, h: 0.25, fontSize: 9, fontFace: "Consolas", color: role.color, margin: 0 });
      s4.addText(role.desc[i], { x: role.x + 0.2, y: rowY + 0.28, w: 2.55, h: 0.25, fontSize: 9, fontFace: "Calibri", color: C.textDim, margin: 0 });
    });
  });


  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 5: Data Flow Pipeline
  // ═══════════════════════════════════════════════════════════════════
  let s5 = pres.addSlide();
  s5.background = { color: C.bg };
  s5.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent4 } });

  s5.addText("End-to-End Data Flow", {
    x: 0.6, y: 0.25, w: 9, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.white, margin: 0,
  });
  s5.addText("From SDK log call to dashboard display — the complete pipeline", {
    x: 0.6, y: 0.8, w: 9, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.textMute, margin: 0,
  });

  // Pipeline stages
  const stages = [
    { icon: icons.code,   label: "Your App",      sub: "pip install\ntracehub-logger", x: 0.25, color: C.accent3 },
    { icon: icons.rocket,  label: "TraceHub SDK",  sub: "Batch + Gzip\nBackground thread", x: 2.15, color: C.accent },
    { icon: icons.server,  label: "FastAPI",       sub: "POST /api/v1/ingest\nX-API-Key auth", x: 4.05, color: C.accent2 },
    { icon: icons.stream,  label: "RabbitMQ",      sub: "Durable queue\nAsync processing", x: 5.95, color: C.accent4 },
    { icon: icons.db,      label: "PostgreSQL",    sub: "Partitioned logs\nFTS indexes", x: 7.85, color: C.accent },
  ];

  stages.forEach((st, i) => {
    // Card
    s5.addShape(pres.shapes.RECTANGLE, { x: st.x, y: 1.5, w: 1.7, h: 1.9, fill: { color: C.bgCard }, line: { color: st.color, width: 1 }, shadow: mkShadow() });
    s5.addShape(pres.shapes.RECTANGLE, { x: st.x, y: 1.5, w: 1.7, h: 0.05, fill: { color: st.color } });

    s5.addImage({ data: st.icon, x: st.x + 0.6, y: 1.7, w: 0.5, h: 0.5 });
    s5.addText(st.label, { x: st.x, y: 2.25, w: 1.7, h: 0.3, fontSize: 12, fontFace: "Calibri", bold: true, color: st.color, align: "center", margin: 0 });
    s5.addText(st.sub, { x: st.x + 0.05, y: 2.55, w: 1.6, h: 0.7, fontSize: 9, fontFace: "Calibri", color: C.textDim, align: "center", margin: 0 });

    // Arrow between stages
    if (i < stages.length - 1) {
      s5.addImage({ data: icons.arrow, x: st.x + 1.75, y: 2.15, w: 0.3, h: 0.3 });
    }
  });

  // Bottom section: Worker + Dashboard
  s5.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.8, w: 4.2, h: 1.5, fill: { color: C.bgCard }, line: { color: C.accent5, width: 1 }, shadow: mkShadow() });
  s5.addImage({ data: icons.bug, x: 0.7, y: 3.95, w: 0.35, h: 0.35 });
  s5.addText("Worker Process", { x: 1.1, y: 3.95, w: 3, h: 0.35, fontSize: 14, fontFace: "Calibri", bold: true, color: C.accent5, margin: 0 });
  s5.addText([
    { text: "Consumes RabbitMQ messages", options: { fontSize: 10, color: C.textMute, breakLine: true } },
    { text: "Inserts logs into partitioned tables", options: { fontSize: 10, color: C.textMute, breakLine: true } },
    { text: "ERROR/FATAL  \u2192  SHA-256 fingerprint  \u2192  Issue", options: { fontSize: 10, color: C.accent5, bold: true } },
  ], { x: 0.75, y: 4.4, w: 3.8, h: 0.8, fontFace: "Calibri", margin: 0 });

  s5.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: 3.8, w: 4.2, h: 1.5, fill: { color: C.bgCard }, line: { color: C.accent3, width: 1 }, shadow: mkShadow() });
  s5.addImage({ data: icons.chart, x: 5.5, y: 3.95, w: 0.35, h: 0.35 });
  s5.addText("Dashboard (React)", { x: 5.9, y: 3.95, w: 3, h: 0.35, fontSize: 14, fontFace: "Calibri", bold: true, color: C.accent3, margin: 0 });
  s5.addText([
    { text: "Role-based views (Admin/Manager/Dev)", options: { fontSize: 10, color: C.textMute, breakLine: true } },
    { text: "Real-time log search with full-text search", options: { fontSize: 10, color: C.textMute, breakLine: true } },
    { text: "Issue tracking with assignment workflow", options: { fontSize: 10, color: C.textMute } },
  ], { x: 5.55, y: 4.4, w: 3.8, h: 0.8, fontFace: "Calibri", margin: 0 });


  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 6: Access Control Workflows
  // ═══════════════════════════════════════════════════════════════════
  let s6 = pres.addSlide();
  s6.background = { color: C.bg };
  s6.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent5 } });

  s6.addText("Access Control Workflows", {
    x: 0.6, y: 0.25, w: 9, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.white, margin: 0,
  });
  s6.addText("Three key approval flows that govern access across the platform", {
    x: 0.6, y: 0.8, w: 9, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.textMute, margin: 0,
  });

  // Workflow 1: Org Join
  s6.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.3, w: 9.2, h: 1.2, fill: { color: C.bgCard }, line: { color: C.accent, width: 1 }, shadow: mkShadow() });
  s6.addText("1", { x: 0.5, y: 1.35, w: 0.4, h: 0.4, fontSize: 18, fontFace: "Arial Black", color: C.accent, margin: 0 });
  s6.addText("Manager Joins Organization", { x: 0.95, y: 1.35, w: 4, h: 0.35, fontSize: 14, fontFace: "Calibri", bold: true, color: C.accent, margin: 0 });

  const flow1Steps = ["Manager signs up", "ORG request created", "Admin reviews", "Approved \u2192 org_id set"];
  flow1Steps.forEach((step, i) => {
    const sx = 0.7 + i * 2.2;
    s6.addShape(pres.shapes.RECTANGLE, { x: sx, y: 1.85, w: 1.8, h: 0.45, fill: { color: C.bgLight }, line: { color: C.border, width: 0.5 } });
    s6.addText(step, { x: sx, y: 1.85, w: 1.8, h: 0.45, fontSize: 9, fontFace: "Calibri", color: C.text, align: "center", valign: "middle", margin: 0 });
    if (i < flow1Steps.length - 1) {
      s6.addText("\u25B6", { x: sx + 1.82, y: 1.88, w: 0.35, h: 0.4, fontSize: 10, color: C.accent, align: "center", valign: "middle", margin: 0 });
    }
  });

  // Workflow 2: Project Creation
  s6.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 2.75, w: 9.2, h: 1.2, fill: { color: C.bgCard }, line: { color: C.accent2, width: 1 }, shadow: mkShadow() });
  s6.addText("2", { x: 0.5, y: 2.8, w: 0.4, h: 0.4, fontSize: 18, fontFace: "Arial Black", color: C.accent2, margin: 0 });
  s6.addText("Project Creation & Approval", { x: 0.95, y: 2.8, w: 4, h: 0.35, fontSize: 14, fontFace: "Calibri", bold: true, color: C.accent2, margin: 0 });

  const flow2Steps = ["Manager creates project", "Status: PENDING", "Admin approves", "Status: APPROVED"];
  flow2Steps.forEach((step, i) => {
    const sx = 0.7 + i * 2.2;
    s6.addShape(pres.shapes.RECTANGLE, { x: sx, y: 3.3, w: 1.8, h: 0.45, fill: { color: C.bgLight }, line: { color: C.border, width: 0.5 } });
    s6.addText(step, { x: sx, y: 3.3, w: 1.8, h: 0.45, fontSize: 9, fontFace: "Calibri", color: C.text, align: "center", valign: "middle", margin: 0 });
    if (i < flow2Steps.length - 1) {
      s6.addText("\u25B6", { x: sx + 1.82, y: 3.33, w: 0.35, h: 0.4, fontSize: 10, color: C.accent2, align: "center", valign: "middle", margin: 0 });
    }
  });

  // Workflow 3: Developer Invite
  s6.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 4.2, w: 9.2, h: 1.2, fill: { color: C.bgCard }, line: { color: C.accent3, width: 1 }, shadow: mkShadow() });
  s6.addText("3", { x: 0.5, y: 4.25, w: 0.4, h: 0.4, fontSize: 18, fontFace: "Arial Black", color: C.accent3, margin: 0 });
  s6.addText("Developer Invitation Flow", { x: 0.95, y: 4.25, w: 4, h: 0.35, fontSize: 14, fontFace: "Calibri", bold: true, color: C.accent3, margin: 0 });

  const flow3Steps = ["Manager searches devs", "Sends PROJECT invite", "Dev sees invitation", "Accepts \u2192 project access"];
  flow3Steps.forEach((step, i) => {
    const sx = 0.7 + i * 2.2;
    s6.addShape(pres.shapes.RECTANGLE, { x: sx, y: 4.75, w: 1.8, h: 0.45, fill: { color: C.bgLight }, line: { color: C.border, width: 0.5 } });
    s6.addText(step, { x: sx, y: 4.75, w: 1.8, h: 0.45, fontSize: 9, fontFace: "Calibri", color: C.text, align: "center", valign: "middle", margin: 0 });
    if (i < flow3Steps.length - 1) {
      s6.addText("\u25B6", { x: sx + 1.82, y: 4.78, w: 0.35, h: 0.4, fontSize: 10, color: C.accent3, align: "center", valign: "middle", margin: 0 });
    }
  });


  // ═══════════════════════════════════════════════════════════════════
  // SLIDE 7: Security & Authentication
  // ═══════════════════════════════════════════════════════════════════
  let s7 = pres.addSlide();
  s7.background = { color: C.bg };
  s7.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  s7.addText("Security & Authentication", {
    x: 0.6, y: 0.25, w: 9, h: 0.6, fontSize: 28, fontFace: "Arial Black", color: C.white, margin: 0,
  });
  s7.addText("Two authentication paths — JWT for dashboard users, API keys for SDK ingestion", {
    x: 0.6, y: 0.8, w: 9, h: 0.3, fontSize: 13, fontFace: "Calibri", color: C.textMute, margin: 0,
  });

  // Left: JWT Auth
  s7.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.35, w: 4.4, h: 3.9, fill: { color: C.bgCard }, line: { color: C.accent, width: 1 }, shadow: mkShadow() });
  s7.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.35, w: 4.4, h: 0.05, fill: { color: C.accent } });
  s7.addImage({ data: icons.lock, x: 0.65, y: 1.55, w: 0.35, h: 0.35 });
  s7.addText("Dashboard Authentication (JWT)", { x: 1.05, y: 1.55, w: 3.5, h: 0.4, fontSize: 14, fontFace: "Calibri", bold: true, color: C.accent, margin: 0 });

  const jwtItems = [
    "HS256 signed tokens",
    "Access token: 60 min expiry",
    "Refresh token: 7 day expiry",
    "Payload: { sub, role, exp, type }",
    "bcrypt password hashing",
    "Role injected into UserContext",
    "RBAC enforced at every endpoint",
  ];
  s7.addText(jwtItems.map((t, i) => ({
    text: t,
    options: { bullet: true, fontSize: 11, color: i < 5 ? C.text : C.accent3, breakLine: i < jwtItems.length - 1 },
  })), { x: 0.7, y: 2.1, w: 3.9, h: 2.8, fontFace: "Calibri", paraSpaceAfter: 6, margin: 0 });

  // Right: API Key Auth
  s7.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.35, w: 4.4, h: 3.9, fill: { color: C.bgCard }, line: { color: C.accent4, width: 1 }, shadow: mkShadow() });
  s7.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.35, w: 4.4, h: 0.05, fill: { color: C.accent4 } });
  s7.addImage({ data: icons.key, x: 5.45, y: 1.55, w: 0.35, h: 0.35 });
  s7.addText("SDK Authentication (API Key)", { x: 5.85, y: 1.55, w: 3.5, h: 0.4, fontSize: 14, fontFace: "Calibri", bold: true, color: C.accent4, margin: 0 });

  const apiItems = [
    "Header: X-API-Key: th_xxx",
    "SHA-256 hash stored in DB",
    "Plain key shown once on creation",
    "Scoped to single project_id",
    "Created by Admin / Manager",
    "Can be assigned to a developer",
    "Revocable by Admin instantly",
  ];
  s7.addText(apiItems.map((t, i) => ({
    text: t,
    options: { bullet: true, fontSize: 11, color: i < 5 ? C.text : C.accent3, breakLine: i < apiItems.length - 1 },
  })), { x: 5.5, y: 2.1, w: 3.9, h: 2.8, fontFace: "Calibri", paraSpaceAfter: 6, margin: 0 });


  // ═══════════════════════════════════════════════════════════════════
  // WRITE FILE
  // ═══════════════════════════════════════════════════════════════════
  await pres.writeFile({ fileName: "C:/Projects/Orchid/TraceHub_Architecture.pptx" });
  console.log("Presentation saved to C:/Projects/Orchid/TraceHub_Architecture.pptx");
}

main().catch(console.error);
