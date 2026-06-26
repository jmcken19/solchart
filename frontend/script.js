const generateBtn = document.getElementById("generateBtn");
const buttonText = generateBtn.querySelector("p");
const chartContainer = document.querySelector(".chart-container");
const walletInput = document.querySelector(".input");

let walletChart = null;
let chartGenerated = false;
let currentWallet = "";

const chartData = [
  { token: "SOL", value: 120 },
  { token: "USDC", value: 75 },
  { token: "BONK", value: 35 },
  { token: "JUP", value: 50 }
];

generateBtn.addEventListener("click", function () {
  const walletAddress = walletInput.value.trim();

  if (chartGenerated) {
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

    return;
  }

  if (walletAddress === "") {
    alert("Please enter a Solana wallet address.");
    walletInput.focus();
    return;
  }

  currentWallet = walletAddress;
  chartGenerated = true;

  chartContainer.classList.remove("hidden");

  const ctx = document.getElementById("walletChart");

  walletChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartData.map(row => row.token),
      datasets: [
        {
          label: "Token Value",
          data: chartData.map(row => row.value)
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  buttonText.textContent = "Enter New Address";
});