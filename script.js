console.log("script.js loaded");

const generateBtn = document.getElementById("generateBtn");
const buttonText = generateBtn.querySelector("p");
const chartContainer = document.querySelector(".chart-container");
const walletInput = document.querySelector(".input");

let walletChart = null;
let chartGenerated = false;
let currentWallet = "";

function isValidSolanaAddress(address) {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

async function getSolBalance(walletAddress) {
  //const response = await fetch(`https://solchart.onrender.com/api/wallet/${walletAddress}/balance`);
  const response = await fetch(`http://127.0.0.1:10000/api/wallet/${walletAddress}/balance`);
  if (!response.ok) {
    throw new Error("Unable to fetch SOL balance.");
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

function createSolChart(sol, tokens, solUsdValue) {
  const tokenList = tokens || [];

  // Only keep tokens with a real USD value
  const minUsdValue = 0.01;

  const pricedTokens = tokenList.filter(token => {
    return token.usdValue && token.usdValue >= minUsdValue;
  });

  const labels = pricedTokens.map(t => t.symbol || "Unknown");
  const usdValues = pricedTokens.map(t => t.usdValue);

  console.log("Priced tokens:", pricedTokens);
  console.log("Chart labels:", labels);
  console.log("Chart USD values:", usdValues);

  if (walletChart !== null) {
    walletChart.destroy();
  }

  const ctx = document.getElementById("walletChart").getContext("2d");

  walletChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{ 
        label: "Token USD Value", 
        data: usdValues,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
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
        tooltip: {
          callbacks: {
            label: function(context) {
              return formatUsd(context.raw);
            }
          }
        }
      }
    }
  });
}

function resetChart() {
  walletInput.value = "";
  currentWallet = "";
  chartGenerated = false;

  if (walletChart !== null) {
    walletChart.destroy();
    walletChart = null;
  }

  chartContainer.classList.add("hidden");
  buttonText.textContent = "Generate";
  walletInput.focus();
}

async function handleGenerate() {
  if (chartGenerated) {
    resetChart();
    return;
  }

  const walletAddress = walletInput.value.trim();

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

    const data = await getSolBalance(walletAddress);
    console.log("Wallet data:", data);
console.log("Tokens:", data.tokens);
    
    if (data && typeof data.sol !== "undefined") {
      createSolChart(data.sol, data.tokens, data.solUsdValue);

      currentWallet = walletAddress;
      chartGenerated = true;
      chartContainer.classList.remove("hidden");
      buttonText.textContent = "Clear";
    } else {
      throw new Error("Invalid data format received.");
    }
  } catch (error) {
    console.error(error);
    alert("Could not get wallet data. Please try again.");
    buttonText.textContent = "Generate";
  }
}

generateBtn.addEventListener("click", handleGenerate);

walletInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleGenerate();
  }
});

// Reload page when SolChart header is clicked
const headerTitle = document.querySelector(".site-header h1");
if (headerTitle) {
  headerTitle.addEventListener("click", () => {
    window.location.reload();
  });
}

