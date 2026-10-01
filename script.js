/* script.js */

"use strict";

/* =========================
   DOM ELEMENTS
========================= */

const display = document.getElementById("display");
const previousDisplay = document.getElementById("previousDisplay");
const errorMessage = document.getElementById("errorMessage");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const nightModeBtn = document.getElementById("nightModeBtn");
const nightModeSettingBtn = document.getElementById("nightModeSettingBtn");
const modeStatus = document.getElementById("modeStatus");
const year = document.getElementById("year");

const calcButtons = document.querySelectorAll(".calc-btn");
const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".section");
const themeButtons = document.querySelectorAll(".theme-option");

/* =========================
   STORAGE KEYS
========================= */

const HISTORY_KEY = "novacalc_history";
const THEME_KEY = "novacalc_theme";
const NIGHT_KEY = "novacalc_night";

/* =========================
   INITIAL SETUP
========================= */

year.textContent = new Date().getFullYear();

let expression = "";
let justCalculated = false;

loadSavedSettings();
renderHistory();

/* =========================
   NAVIGATION
========================= */

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.section;

    navButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    sections.forEach((section) => {
      section.classList.remove("active-section");
    });

    const targetSection = document.getElementById(target);

    if (targetSection) {
      targetSection.classList.add("active-section");
    }
  });
});

/* =========================
   CALCULATOR BUTTONS
========================= */

calcButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    const value = button.dataset.value;

    if (action === "clear") {
      clearCalculator();
      return;
    }

    if (action === "delete") {
      deleteLast();
      return;
    }

    if (action === "calculate") {
      calculate();
      return;
    }

    if (value !== undefined) {
      addInput(value);
    }
  });
});

/* =========================
   INPUT HANDLING
========================= */

function addInput(value) {
  clearError();

  if (justCalculated) {
    if (/[0-9.(]/.test(value)) {
      expression = "";
      previousDisplay.textContent = "";
    }
    justCalculated = false;
  }

  if (value === "√") {
    addSquareRoot();
    updateDisplay();
    return;
  }

  if (value === "%") {
    addPercentage();
    updateDisplay();
    return;
  }

  if (value === "^") {
    addOperator("^");
    updateDisplay();
    return;
  }

  if (["+", "-", "*", "/"].includes(value)) {
    addOperator(value);
    updateDisplay();
    return;
  }

  if (value === ".") {
    addDecimal();
    updateDisplay();
    return;
  }

  if (value === "(") {
    addOpenParenthesis();
    updateDisplay();
    return;
  }

  if (value === ")") {
    addCloseParenthesis();
    updateDisplay();
    return;
  }

  if (value === "00") {
    if (expression === "0") {
      return;
    }

    expression += "00";
    updateDisplay();
    return;
  }

  if (/^\d$/.test(value)) {
    if (expression === "0") {
      expression = value;
    } else {
      expression += value;
    }

    updateDisplay();
  }
}

function addOperator(operator) {
  if (!expression) {
    if (operator === "-") {
      expression = "-";
    }
    return;
  }

  const lastChar = expression.slice(-1);

  if (["+", "*", "/"].includes(lastChar)) {
    expression = expression.slice(0, -1) + operator;
    return;
  }

  if (lastChar === "-") {
    const beforeLast = expression.slice(-2, -1);

    if (["+", "*", "/", ""].includes(beforeLast)) {
      return;
    }

    expression = expression.slice(0, -1) + operator;
    return;
  }

  if (lastChar === "(" && operator !== "-") {
    return;
  }

  expression += operator;
}

function addDecimal() {
  const parts = expression.split(/[+\-*/^()]/);
  const currentNumber = parts[parts.length - 1];

  if (currentNumber.includes(".")) {
    return;
  }

  if (!currentNumber) {
    expression += "0.";
  } else {
    expression += ".";
  }
}

function addOpenParenthesis() {
  if (!expression) {
    expression = "(";
    return;
  }

  const lastChar = expression.slice(-1);

  if (/\d|\)/.test(lastChar)) {
    expression += "*(";
  } else {
    expression += "(";
  }
}

function addCloseParenthesis() {
  const openCount = (expression.match(/\(/g) || []).length;
  const closeCount = (expression.match(/\)/g) || []).length;

  if (openCount <= closeCount) {
    return;
  }

  const lastChar = expression.slice(-1);

  if (["+", "-", "*", "/", "^", "("].includes(lastChar)) {
    return;
  }

  expression += ")";
}

function addPercentage() {
  if (!expression) {
    return;
  }

  const match = expression.match(/(\d+(\.\d+)?)$/);

  if (!match) {
    return;
  }

  const number = match[0];
  const percentValue = Number(number) / 100;

  expression =
    expression.slice(0, -number.length) +
    formatNumber(percentValue);
}

function addSquareRoot() {
  if (!expression) {
    expression = "√(";
    return;
  }

  const lastChar = expression.slice(-1);

  if (/\d|\)/.test(lastChar)) {
    expression += "*√(";
  } else {
    expression += "√(";
  }
}

/* =========================
   DISPLAY
========================= */

function updateDisplay() {
  display.value = formatExpression(expression);
}

function formatExpression(value) {
  return value
    .replaceAll("*", "×")
    .replaceAll("/", "÷")
    .replaceAll("-", "−")
    .replaceAll("sqrt", "√");
}

/* =========================
   DELETE / CLEAR
========================= */

function deleteLast() {
  clearError();

  if (justCalculated) {
    expression = "";
    previousDisplay.textContent = "";
    justCalculated = false;
  }

  expression = expression.slice(0, -1);
  updateDisplay();
}

function clearCalculator() {
  expression = "";
  justCalculated = false;
  display.value = "";
  previousDisplay.textContent = "";
  clearError();
}

/* =========================
   CALCULATION ENGINE
========================= */

function calculate() {
  clearError();

  if (!expression) {
    showError("Please enter a calculation.");
    return;
  }

  try {
    let normalized = expression;

    if (!isValidExpression(normalized)) {
      throw new Error("Invalid expression");
    }

    const result = evaluateExpression(normalized);

    if (!Number.isFinite(result)) {
      throw new Error("Invalid result");
    }

    const formattedResult = formatNumber(result);

    previousDisplay.textContent = `${formatExpression(expression)} =`;
    display.value = formattedResult;

    saveHistory(
      formatExpression(expression),
      formattedResult
    );

    expression = formattedResult;
    justCalculated = true;

  } catch (error) {
    showError("Invalid calculation. Please check your expression.");
  }
}

/*
  Safe mathematical expression parser.
  It does NOT use eval() or Function().
*/

function evaluateExpression(input) {
  let index = 0;

  function skipSpaces() {
    while (input[index] === " ") {
      index++;
    }
  }

  function parseExpression() {
    let value = parseTerm();

    while (true) {
      skipSpaces();

      if (input[index] === "+") {
        index++;
        value += parseTerm();
      } else if (input[index] === "-") {
        index++;
        value -= parseTerm();
      } else {
        break;
      }
    }

    return value;
  }

  function parseTerm() {
    let value = parsePower();

    while (true) {
      skipSpaces();

      if (input[index] === "*") {
        index++;
        value *= parsePower();
      } else if (input[index] === "/") {
        index++;

        const divisor = parsePower();

        if (divisor === 0) {
          throw new Error("Division by zero");
        }

        value /= divisor;
      } else {
        break;
      }
    }

    return value;
  }

  function parsePower() {
    let value = parseUnary();

    skipSpaces();

    if (input[index] === "^") {
      index++;
      const exponent = parsePower();
      value = Math.pow(value, exponent);
    }

    return value;
  }

  function parseUnary() {
    skipSpaces();

    if (input[index] === "+") {
      index++;
      return parseUnary();
    }

    if (input[index] === "-") {
      index++;
      return -parseUnary();
    }

    if (input.startsWith("√", index)) {
      index++;

      const value = parseUnary();

      if (value < 0) {
        throw new Error("Square root of negative number");
      }

      return Math.sqrt(value);
    }

    return parsePrimary();
  }

  function parsePrimary() {
    skipSpaces();

    if (input[index] === "(") {
      index++;

      const value = parseExpression();

      skipSpaces();

      if (input[index] !== ")") {
        throw new Error("Missing parenthesis");
      }

      index++;
      return value;
    }

    const numberMatch = input
      .slice(index)
      .match(/^(?:\d+(?:\.\d*)?|\.\d+)/);

    if (!numberMatch) {
      throw new Error("Expected number");
    }

    index += numberMatch[0].length;

    return Number(numberMatch[0]);
  }

  const result = parseExpression();

  skipSpaces();

  if (index !== input.length) {
    throw new Error("Unexpected character");
  }

  return result;
}

/* =========================
   VALIDATION
========================= */

function isValidExpression(value) {
  if (!value) {
    return false;
  }

  if (!/^[0-9+\-*/().^√]+$/.test(value)) {
    return false;
  }

  let balance = 0;

  for (const char of value) {
    if (char === "(") {
      balance++;
    }

    if (char === ")") {
      balance--;

      if (balance < 0) {
        return false;
      }
    }
  }

  if (balance !== 0) {
    return false;
  }

  const last = value.slice(-1);

  if (["+", "-", "*", "/", "^", "("].includes(last)) {
    return false;
  }

  return true;
}

/* =========================
   NUMBER FORMATTING
========================= */

function formatNumber(number) {
  if (!Number.isFinite(number)) {
    throw new Error("Invalid number");
  }

  if (Math.abs(number) < 1e-12) {
    number = 0;
  }

  const rounded = Number.parseFloat(number.toPrecision(12));

  return String(rounded);
}

/* =========================
   ERROR HANDLING
========================= */

function showError(message) {
  errorMessage.textContent = message;
}

function clearError() {
  errorMessage.textContent = "";
}

/* =========================
   HISTORY
========================= */

function getHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(expressionText, resultText) {
  try {
    let history = getHistory();

    history.unshift({
      expression: expressionText,
      result: resultText,
      time: new Date().toLocaleString()
    });

    history = history.slice(0, 50);

    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history)
    );

    renderHistory();

  } catch {
    // Storage may be unavailable in some browser modes.
  }
}

function renderHistory() {
  const history = getHistory();

  if (!history.length) {
    historyList.innerHTML = `
      <div class="empty-state">
        <span>⌁</span>
        <h3>No calculations yet</h3>
        <p>Your previous calculations will appear here.</p>
      </div>
    `;
    return;
  }

  historyList.innerHTML = "";

  history.forEach((item) => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";

    const left = document.createElement("div");

    const expressionElement = document.createElement("div");
    expressionElement.className = "history-expression";
    expressionElement.textContent = item.expression;

    const timeElement = document.createElement("div");
    timeElement.className = "history-time";
    timeElement.textContent = item.time;

    left.appendChild(expressionElement);
    left.appendChild(timeElement);

    const resultElement = document.createElement("div");
    resultElement.className = "history-result";
    resultElement.textContent = item.result;

    historyItem.appendChild(left);
    historyItem.appendChild(resultElement);

    historyList.appendChild(historyItem);
  });
}

clearHistoryBtn.addEventListener("click", () => {
  const history = getHistory();

  if (!history.length) {
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to delete all calculation history?"
  );

  if (!confirmed) {
    return;
  }

  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

/* =========================
   KEYBOARD SUPPORT
========================= */

document.addEventListener("keydown", (event) => {
  const key = event.key;

  if (
    /^[0-9]$/.test(key) ||
    ["+", "-", "*", "/", ".", "(", ")", "^"].includes(key)
  ) {
    event.preventDefault();
    addInput(key);
    return;
  }

  if (key === "%") {
    event.preventDefault();
    addInput("%");
    return;
  }

  if (key === "Enter" || key === "=") {
    event.preventDefault();
    calculate();
    return;
  }

  if (key === "Backspace") {
    event.preventDefault();
    deleteLast();
    return;
  }

  if (key === "Escape" || key === "Delete") {
    event.preventDefault();
    clearCalculator();
  }
});

/* =========================
   THEME SYSTEM
========================= */

function setTheme(theme) {
  const allowedThemes = [
    "navy",
    "green",
    "yellow",
    "wine",
    "purple"
  ];

  if (!allowedThemes.includes(theme)) {
    theme = "navy";
  }

  if (theme === "navy") {
    document.body.removeAttribute("data-theme");
  } else {
    document.body.dataset.theme = theme;
  }

  localStorage.setItem(THEME_KEY, theme);

  themeButtons.forEach((button) => {
    button.classList.toggle(
      "selected",
      button.dataset.theme === theme
    );
  });
}

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setTheme(button.dataset.theme);
  });
});

/* =========================
   NIGHT MODE
========================= */

function setNightMode(enabled) {
  document.body.classList.toggle("night-mode", enabled);

  modeStatus.textContent = enabled ? "ON" : "OFF";

  nightModeBtn.textContent = enabled ? "☀" : "☾";

  localStorage.setItem(
    NIGHT_KEY,
    enabled ? "true" : "false"
  );
}

function toggleNightMode() {
  const enabled = !document.body.classList.contains("night-mode");
  setNightMode(enabled);
}

nightModeBtn.addEventListener("click", toggleNightMode);
nightModeSettingBtn.addEventListener("click", toggleNightMode);

/* =========================
   LOAD SAVED SETTINGS
========================= */

function loadSavedSettings() {
  const savedTheme =
    localStorage.getItem(THEME_KEY) || "navy";

  const savedNight =
    localStorage.getItem(NIGHT_KEY) === "true";

  setTheme(savedTheme);
  setNightMode(savedNight);
}