const $ = id => document.getElementById(id);
const KEY = "hoopdesk_data";
const clone = value => JSON.parse(JSON.stringify(value));

const defaultData = {
  tournament: "Basketball Tournament",
  venue: "Open Court",
  teams: [
    {id:1,name:"Team White",coach:"Coach White"},
    {id:2,name:"Team ICU",coach:"Coach ICU"},
    {id:3,name:"BM Prints",coach:"Coach BM"},
    {id:4,name:"Team Purple",coach:"Coach Purple"}
  ],
  matches: []
};

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.teams) && Array.isArray(saved.matches)) return saved;
  } catch (error) {
    console.warn("Could not load saved HoopDesk data:", error);
  }
  return clone(defaultData);
}

let data = loadData();
let editingTeam = null;
let editingMatch = null;
let scoringMatch = null;

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    render();
  } catch (error) {
    alert("Could not save data in this browser. Check available storage.");
    console.error(error);
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);
}

// Demo-only login. This is not secure authentication.
$("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  if ($("username").value === "admin" && $("password").value === "admin123") {
    $("loginScreen").classList.add("hidden");
    $("app").classList.remove("hidden");
    $("loginError").textContent = "";
    sessionStorage.setItem("hoopdesk_login", "true");
    render();
  } else {
    $("loginError").textContent = "Incorrect username or password.";
  }
});

function logout() {
  sessionStorage.removeItem("hoopdesk_login");
  $("app").classList.add("hidden");
  $("loginScreen").classList.remove("hidden");
  $("password").value = "";
}
$("logoutBtn").addEventListener("click", logout);

if (sessionStorage.getItem("hoopdesk_login") === "true") {
  $("loginScreen").classList.add("hidden");
  $("app").classList.remove("hidden");
}

// Navigation
document.querySelectorAll(".nav").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    $(button.dataset.page).classList.remove("hidden");
    $("pageTitle").textContent = button.textContent.trim();
    render();
  });
});

// Teams
function openTeam(id = null) {
  editingTeam = id;
  const team = data.teams.find(t => t.id === id);
  $("teamModalTitle").textContent = team ? "Edit Team" : "Add Team";
  $("teamName").value = team?.name || "";
  $("teamCoach").value = team?.coach || "";
  $("teamModal").classList.remove("hidden");
}
function closeTeam() {
  $("teamModal").classList.add("hidden");
  $("teamForm").reset();
  editingTeam = null;
}
$("addTeamBtn").addEventListener("click", () => openTeam());
$("cancelTeam").addEventListener("click", closeTeam);

$("teamForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("teamName").value.trim();
  const coach = $("teamCoach").value.trim();
  if (!name) return;

  if (data.teams.some(t => t.name.toLowerCase() === name.toLowerCase() && t.id !== editingTeam)) {
    alert("Team name already exists.");
    return;
  }

  if (editingTeam !== null) {
    const team = data.teams.find(t => t.id === editingTeam);
    if (team) { team.name = name; team.coach = coach; }
  } else {
    data.teams.push({id:Date.now(), name, coach});
  }
  closeTeam();
  save();
});

function editTeam(id) { openTeam(id); }
function deleteTeam(id) {
  const team = data.teams.find(t => t.id === id);
  if (!team) return;
  if (data.matches.some(m => m.team1 == id || m.team2 == id)) {
    alert("This team is already used in a match. Delete its matches first.");
    return;
  }
  if (confirm("Delete " + team.name + "?")) {
    data.teams = data.teams.filter(t => t.id !== id);
    save();
  }
}

// Matches
function openMatch(id = null) {
  editingMatch = id;
  const match = data.matches.find(m => m.id === id);
  if (data.teams.length < 2 && !match) {
    alert("Add at least two teams first.");
    return;
  }
  $("matchModalTitle").textContent = match ? "Edit Match" : "Schedule Match";
  $("team1").innerHTML = data.teams.map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join("");
  $("team2").innerHTML = data.teams.map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join("");
  $("matchDate").value = match?.date || "";
  $("matchVenue").value = match?.venue || data.venue || "";
  if (match) {
    $("team1").value = match.team1;
    $("team2").value = match.team2;
  } else {
    $("team1").selectedIndex = 0;
    $("team2").selectedIndex = 1;
  }
  $("matchModal").classList.remove("hidden");
}
function closeMatch() {
  $("matchModal").classList.add("hidden");
  $("matchForm
