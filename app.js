// helper to create subject row
const subjectsBox = document.getElementById("subjectsBox");
function createSubject(name = "", marks = "") {
  const row = document.createElement("div");
  row.className = "subject-row";
  row.innerHTML = `
        <input class="subName" type="text" placeholder="Subject name" value="${escapeHtml(
          name
        )}" required style="flex:1" />
        <input class="subMarks" type="number" placeholder="Marks" value="${marks}" style="width:110px" min="0" />
        <button class="btn ghost del">Delete</button>
      `;
  subjectsBox.appendChild(row);
  row.querySelector(".del").addEventListener("click", () => row.remove());
}

// escape to avoid html injection in values
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// start with 5 common subjects
["English", "Math", "Science", "Islamiyat", "Urdu"].forEach((s) =>
  createSubject(s, "")
);

document
  .getElementById("addSub")
  .addEventListener("click", () => createSubject());

document.getElementById("reset").addEventListener("click", () => {
  if (!confirm("Clear form?")) return;
  document.getElementById("marksForm").reset();
  subjectsBox.innerHTML = "";
  ["English", "Math", "Science", "Islamiyat", "Urdu"].forEach((s) =>
    createSubject(s, "")
  );
  clearResult();
});

function clearResult() {
  document.getElementById("resName").textContent = "-";
  document.getElementById("resMeta").textContent = "Class - Roll - ";
  document.getElementById("grade").textContent = "-";
  document.getElementById("status").textContent = "";
  document.getElementById("totalObt").textContent = "0";
  document.getElementById("totalMax").textContent = "0";
  document.getElementById("percent").textContent = "0%";
  document.getElementById("progress").style.width = "0%";
  document.getElementById("subTableWrap").innerHTML = "";
}

function computeGrade(p) {
  if (p >= 90) return "A+";
  if (p >= 80) return "A";
  if (p >= 70) return "B+";
  if (p >= 60) return "B";
  if (p >= 50) return "C";
  return "F";
}

function passFail(subjects, maxPer) {
  for (const s of subjects) {
    if (s.obtained < maxPer * 0.33) return false;
  }
  return true;
}

document.getElementById("calc").addEventListener("click", () => {
  const name = document.getElementById("studentName").value.trim() || "-";
  const cls = document.getElementById("studentClass").value.trim() || "-";
  const roll = document.getElementById("roll").value.trim() || "-";
  const maxMarks = Number(document.getElementById("maxMarks").value) || 100;

  const rows = Array.from(document.querySelectorAll(".subject-row"));
  const subjects = [];
  let error = false;
  rows.forEach((r, i) => {
    const sname =
      r.querySelector(".subName").value.trim() || `Subject ${i + 1}`;
    let obt = r.querySelector(".subMarks").value;
    if (obt === "") obt = 0;
    else obt = Number(obt);
    if (Number.isNaN(obt) || obt < 0 || obt > maxMarks) {
      alert("Please enter valid marks (0 - " + maxMarks + ") for " + sname);
      error = true;
      return;
    }
    subjects.push({ name: sname, obtained: obt });
  });
  if (error) return;
  if (subjects.length === 0) {
    alert("Add at least one subject.");
    return;
  }

  const totalObt = subjects.reduce((s, x) => s + x.obtained, 0);
  const totalMax = subjects.length * maxMarks;
  const percent = (totalObt / totalMax) * 100;
  const grade = computeGrade(percent);
  const passed = passFail(subjects, maxMarks);

  // update UI
  document.getElementById("resName").textContent = name;
  document.getElementById("resMeta").textContent = `${cls} — Roll: ${roll}`;
  document.getElementById("grade").textContent = grade;
  document.getElementById("status").textContent = passed
    ? "Status: Passed"
    : "Status: Failed";
  document.getElementById("totalObt").textContent = totalObt;
  document.getElementById("totalMax").textContent = totalMax;
  document.getElementById("percent").textContent = percent.toFixed(2) + "%";
  document.getElementById("progress").style.width =
    Math.min(100, percent).toFixed(2) + "%";

  // build per-subject table
  const wrap = document.getElementById("subTableWrap");
  wrap.innerHTML = "";
  const tbl = document.createElement("table");
  tbl.innerHTML =
    "<thead><tr><th>Subject</th><th>Obtained</th><th>Max</th><th>%</th></tr></thead>";
  const tbody = document.createElement("tbody");
  subjects.forEach((s) => {
    const tr = document.createElement("tr");
    const p = (s.obtained / maxMarks) * 100;
    tr.innerHTML = `<td>${escapeHtml(s.name)}</td><td>${
      s.obtained
    }</td><td>${maxMarks}</td><td>${p.toFixed(2)}%</td>`;
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  wrap.appendChild(tbl);

  // color changes
  document.getElementById("grade").style.color =
    grade === "F" ? "var(--danger)" : "var(--success)";
  document.getElementById("status").style.color = passed
    ? "var(--success)"
    : "var(--danger)";
});

// CSV export
document.getElementById("exportCSV").addEventListener("click", () => {
  const name = document.getElementById("studentName").value.trim() || "-";
  const cls = document.getElementById("studentClass").value.trim() || "-";
  const roll = document.getElementById("roll").value.trim() || "-";
  const maxMarks = Number(document.getElementById("maxMarks").value) || 100;
  const rows = Array.from(document.querySelectorAll(".subject-row"));
  if (rows.length === 0) {
    alert("No subjects to export");
    return;
  }
  const lines = [];
  lines.push(["Student", name].join(","));
  lines.push(["Class", cls].join(","));
  lines.push(["Roll", roll].join(","));
  lines.push([]);
  lines.push(["Subject", "Obtained", "Max", "%"].join(","));
  for (const r of rows) {
    const sname = r.querySelector(".subName").value.trim() || "";
    const obt = r.querySelector(".subMarks").value || 0;
    const pct = (Number(obt) / maxMarks) * 100;
    lines.push(
      [
        `"${sname.replace(/\"/g, '"')}"`,
        obt,
        maxMarks,
        pct.toFixed(2) + "%",
      ].join(",")
    );
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (name || "marksheet") + ".csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// keyboard: Enter on last input adds subject
subjectsBox.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const t = e.target;
    if (t.classList.contains("subMarks")) {
      e.preventDefault();
      createSubject();
      subjectsBox.lastChild.querySelector(".subName").focus();
    }
  }
});
