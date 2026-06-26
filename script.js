console.log("script.js loaded");
const generateBtn = document.getElementById("generateBtn");
const buttonText = generateBtn.querySelector("p");
const chartContainer = document.querySelector(".chart-container");
const walletInput = document.querySelector(".input");

let walletChart = null;
let chartGenerated = false;
let currentWallet = "";

// Validate Solana wallet address using regex
function isValidSolanaAddress(address) {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

// Get sol balance and tokens
async function getSolBalance(walletAddress) {
  const response = await fetch(`https://solechart-api.onrender.com/api/wallet/${walletAddress}/balance`);

  if (!response.ok) throw new Error("Unable to fetch SOL balance.");

  return await response.json(); // returns { sol, tokens }
}

// Create chart
function createSolChart(sol, tokens) {
  const tokenList = tokens || [];
  const labels = ["SOL", ...tokenList.map(t => t.symbol || "Unknown")];
  const balances = [sol, ...tokenList.map(t => t.balance || 0)];

  // If chart already exists, destroy it before creating a new one
  if (walletChart !== null) {
    walletChart.destroy();
  }

  const ctx = document.getElementById("walletChart").getContext("2d");
  walletChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{ 
        label: "Token Balances", 
        data: balances,
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
          beginAtZero: true
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

  // Wallet validation 
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
    
    // Check if data is valid
    if (data && typeof data.sol !== 'undefined') {
      createSolChart(data.sol, data.tokens);
      currentWallet = walletAddress;
      chartGenerated = true;
      chartContainer.classList.remove("hidden");
      buttonText.textContent = "Enter New Address";
    } else {
      throw new Error("Invalid data format received.");
    }
  } catch (error) {
    console.error(error);
    alert("Could not get SOL balance. Please try again.");
    buttonText.textContent = "Generate";
  }
}

// Event Listeners
generateBtn.addEventListener("click", handleGenerate);

walletInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleGenerate();
  }
});