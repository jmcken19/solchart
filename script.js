console.log("script.js loaded");

const generateBtn = document.getElementById("generateBtn");
const buttonText = generateBtn.querySelector("p");
const chartContainer = document.querySelector(".chart-container");
const walletInput = document.querySelector(".input");
const toggleBtns = document.querySelectorAll(".toggle-btn");
const periodToggle = document.querySelector(".period-toggle");
const periodBtns = document.querySelectorAll(".period-btn");

let walletChart = null;
let chartGenerated = false;
let currentWallet = "";
let currentWalletData = null;
let currentChartView = "holdings";
let currentPeriod = "1W";

function isValidSolanaAddress(address) {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

async function getSolBalance(walletAddress) {
  const response = await fetch(`https://solchart.onrender.com/api/wallet/${walletAddress}/balance`);
  //const response = await fetch(`http://127.0.0.1:10000/api/wallet/${walletAddress}/balance`);
  if (!response.ok) {
    throw new Error("Unable to fetch SOL balance.");
  }

  return await response.json();
}

async function getWalletHistory(walletAddress, period = "1W") {
  const sol = currentWalletData ? currentWalletData.sol : 0;
  const tokenUsd = currentWalletData
    ? (currentWalletData.tokens || []).reduce((sum, t) => sum + (t.usdValue || 0), 0)
    : 0;

  const params = new URLSearchParams({ period, sol, tokenUsd });
  const response = await fetch(`https://solchart.onrender.com/api/wallet/${walletAddress}/history?${params}`);
  //const response = await fetch(`http://127.0.0.1:10000/api/wallet/${walletAddress}/history?${params}`);
  if (!response.ok) {
    return [];
  }

  return await response.json();
}

function formatUsd(value) {
  value = Number(value);

  if (value >= 1) {
    return "$" + value.toFixed(2);
  }

  if (value >= 0.01) {
    return "$" + value.toFixed(4);
  }

  if (value >= 0.0001) {
    return "$" + value.toFixed(6);
  }

  return "$" + value.toFixed(8);
}

const walletTotalEl = document.querySelector(".wallet-total");

function updateWalletTotal(data) {
  const tokenUsd = (data.tokens || []).reduce((sum, t) => sum + (t.usdValue || 0), 0);
  const total = (data.solUsdValue || 0) + tokenUsd;
  walletTotalEl.textContent = formatUsd(total);
}

function destroyChart() {
  if (walletChart !== null) {
    walletChart.destroy();
    walletChart = null;
  }
}

const disclaimerPlugin = {
  id: "disclaimer",
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const { left, top, width } = chartArea;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "rgba(53, 38, 19, 0.38)";
    ctx.font = "9px Arial, Helvetica, sans-serif";
    ctx.fillText("Prices are a snapshot and may not reflect 100% accuracy.", left + width / 2, top - 4);
    ctx.restore();
  }
};

function showHoldingsChart(data) {
  const tokenList = data.tokens || [];
  const minUsdValue = 0.01;

  const pricedTokens = tokenList.filter(token => token.usdValue && token.usdValue >= minUsdValue);

  // Include SOL as first entry
  const labels = ["SOL", ...pricedTokens.map(t => t.symbol || "Unknown")];
  const usdValues = [data.solUsdValue || 0, ...pricedTokens.map(t => t.usdValue)];

  destroyChart();

  const ctx = document.getElementById("walletChart").getContext("2d");

  walletChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Token USD Value",
        data: usdValues,
        backgroundColor: "rgba(104, 196, 110, 0.55)",
        borderColor: "rgba(104, 196, 110, 1)",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatUsd(value);
            }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return formatUsd(context.raw);
            }
          }
        }
      }
    },
    plugins: [disclaimerPlugin]
  });
}

function showHistoryChart(snapshots) {
  destroyChart();

  const ctx = document.getElementById("walletChart").getContext("2d");

  if (!snapshots || snapshots.length === 0) {
    // Draw an empty state message via a plugin
    walletChart = new Chart(ctx, {
      type: "line",
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      },
      plugins: [disclaimerPlugin, {
        id: "emptyState",
        afterDraw(chart) {
          const { ctx: c, chartArea: { left, top, width, height } } = chart;
          c.save();
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.fillStyle = "rgba(53, 38, 19, 0.45)";
          c.font = "14px Arial, Helvetica, sans-serif";
          c.fillText("No history yet. Check back after future visits.", left + width / 2, top + height / 2);
          c.restore();
        }
      }]
    });
    return;
  }

  const labels = snapshots.map(s => {
    const d = new Date(s.timestamp);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  });
  const values = snapshots.map(s => s.totalUsd);

  walletChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Portfolio Value (USD)",
        data: values,
        borderColor: "rgba(104, 196, 110, 1)",
        backgroundColor: "rgba(104, 196, 110, 0.15)",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: "rgba(104, 196, 110, 1)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return formatUsd(value);
            }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return "Total: " + formatUsd(context.raw);
            }
          }
        }
      }
    },
    plugins: [disclaimerPlugin]
  });
}

function setActiveToggle(view) {
  toggleBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.chart === view);
  });
  periodToggle.classList.toggle("hidden", view !== "history");
}

function setActivePeriod(period) {
  periodBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.period === period);
  });
}

async function switchChartView(view) {
  if (!chartGenerated || !currentWalletData) return;

  currentChartView = view;
  setActiveToggle(view);

  if (view === "holdings") {
    showHoldingsChart(currentWalletData);
  } else {
    const snapshots = await getWalletHistory(currentWallet, currentPeriod);
    showHistoryChart(snapshots);
  }
}

async function switchPeriod(period) {
  if (currentChartView !== "history") return;
  currentPeriod = period;
  setActivePeriod(period);
  const snapshots = await getWalletHistory(currentWallet, period);
  showHistoryChart(snapshots);
}

function resetChart() {
  walletInput.value = "";
  currentWallet = "";
  currentWalletData = null;
  chartGenerated = false;
  currentChartView = "holdings";
  currentPeriod = "1W";

  destroyChart();

  chartContainer.classList.add("hidden");
  walletTotalEl.textContent = "";
  buttonText.textContent = "Generate";
  setActiveToggle("holdings");
  setActivePeriod("1W");
  walletInput.focus();
}

async function handleGenerate() {
  const walletAddress = walletInput.value.trim();

  // "Clear" mode: chart is showing and input is empty
  if (chartGenerated && walletAddress === "") {
    resetChart();
    return;
  }

  if (walletAddress === "") {
    alert("Please enter a Solana wallet address.");
    walletInput.focus();
    return;
  }

  if (!isValidSolanaAddress(walletAddress)) {
    alert("Please enter a valid Solana wallet address.");
    walletInput.focus();
    return;
  }

  try {
    buttonText.textContent = "Loading...";

    const wakeTimer = setTimeout(() => {
      buttonText.textContent = "Starting up...";
    }, 6000);

    const data = await getSolBalance(walletAddress);
    clearTimeout(wakeTimer);
    console.log("Wallet data:", data);

    if (data && typeof data.sol !== "undefined") {
      currentWalletData = data;
      currentWallet = walletAddress;
      currentChartView = "holdings";
      currentPeriod = "1W";
      setActiveToggle("holdings");
      setActivePeriod("1W");

      showHoldingsChart(data);
      updateWalletTotal(data);

      chartGenerated = true;
      chartContainer.classList.remove("hidden");
      buttonText.textContent = "Clear";
    } else {
      throw new Error("Invalid data format received.");
    }
  } catch (error) {
    console.error(error);
    alert("Could not get wallet data. Please try again.");
    buttonText.textContent = chartGenerated ? "Clear" : "Generate";
  }
}

// Chart view toggle buttons
toggleBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.chart !== currentChartView) {
      switchChartView(btn.dataset.chart);
    }
  });
});

// Period buttons
periodBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.period !== currentPeriod) {
      switchPeriod(btn.dataset.period);
    }
  });
});

generateBtn.addEventListener("click", handleGenerate);

walletInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleGenerate();
  }
});

walletInput.addEventListener("input", () => {
  if (chartGenerated) {
    buttonText.textContent = walletInput.value.trim() ? "Generate" : "Clear";
  }
});

// Reload page when SolChart header is clicked
const headerTitle = document.querySelector(".site-header h1");
if (headerTitle) {
  headerTitle.addEventListener("click", () => {
    window.location.reload();
  });
}
