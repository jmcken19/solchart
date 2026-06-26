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

//get sol balance
async function getSolBalance(walletAddress) {
  const response = await fetch(
    `http://127.0.0.1:5000/api/wallet/${walletAddress}/balance`  // same, no change
  );

  if (!response.ok) throw new Error("Unable to fetch SOL balance.");

  return await response.json(); // now returns { sol, tokens }
}
//create chart
function createSolChart(sol, tokens) {
  const labels = ["SOL", ...tokens.map(t => t.symbol)];
  const balances = [sol, ...tokens.map(t => t.balance)];

  walletChart = new Chart(document.getElementById("walletChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Token Balances", data: balances }]
    },
    options: { responsive: true, maintainAspectRatio: false }
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

  //wallet validation 
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
    createSolChart(data.sol, data.tokens); // add tokens here

    currentWallet = walletAddress;
    chartGenerated = true;

    chartContainer.classList.remove("hidden");

    createSolChart(data.sol);

    buttonText.textContent = "Enter New Address";
  } catch (error) {
    console.error(error);
    alert("Could not get SOL balance. Please try again.");
    buttonText.textContent = "Generate";
  }
}

generateBtn.addEventListener("click", handleGenerate);

walletInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    handleGenerate();
  }
});