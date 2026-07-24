// ============================
// Load User Data
// ============================

let xp = Number(localStorage.getItem("xp")) || 850;

let coins = Number(localStorage.getItem("coins")) || 1250;

let level = Number(localStorage.getItem("level")) || 5;

let streak = Number(localStorage.getItem("streak")) || 12;

document.getElementById("xp").textContent = xp;

document.getElementById("coins").textContent = coins;

document.getElementById("level").textContent = level;

document.getElementById("streak").textContent = streak + " Days";