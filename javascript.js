 const fkdsTokenABI = [
    {
        "constant": true,
        "inputs": [{"name": "owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [{"name": "recipient", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    }
];

   const gameRewardABI = [
    {
        "constant": false,
        "inputs": [{"name": "player", "type": "address"}],
        "name": "distributeReward",
        "outputs": [],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{"name": "player", "type": "address"}],
        "name": "rewards",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    }
];


    const nftContractABI = [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "string",
                    "name": "metadataURI",
                    "type": "string"
                }
            ],
            "name": "mintReceiptNFT",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "transferFrom",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "tokenURI",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ];




   const tokenAddress = "0xA0aC1A4cA81c141527805500e29d0DaD9e3D4aaC";
const gameRewardAddress = "0xF7b0A6e9f505bE1715566F5e67B5D983F6C3340b";
const nftContractAddress = "0x9312CA083A07973762390e02A2Ee6C435aE09bc9"; 
const referralRewards = 1; 

let lastMiningTime = {};
let miningInterval;
let miningActive = false;
let imagesMined = 0;
let miningReward = 0;
let miningSpeed = 250;
const claimThreshold = 400; // Claim every 400 images mined

const canvas = document.getElementById('minedCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 200;

let web3;
let fkdsContract;
let gameRewardContract;
let userAddress = null;

const displayStatusMessage = (message, isError = true) => {
    const statusMessageElement = document.getElementById('statusMessage');
    statusMessageElement.innerText = message;
    statusMessageElement.style.color = isError ? '#FF0000' : '#00FF00';
};

const updateMiningStats = () => {
    document.getElementById('hashRate').innerText = `HΔSH RΔTΞ: ${Math.random().toFixed(2)} H/s & FΔΔK RΔTΞ: ${Math.random().toFixed(2)} H/s`;
    document.getElementById('minedImages').innerText = `!MΔGΞS M!NΞD: ${imagesMined}`;
    document.getElementById('miningReward').innerText = `M!N!NG T!MΞ: ${miningReward.toFixed(2)} `;
};

const startMining = () => {
    if (!miningActive) {
        miningActive = true;

        document.getElementById('startButton').style.display = 'none';
        document.getElementById('stopButton').style.display = 'inline';

        miningInterval = setInterval(() => {
            imagesMined++;
            miningReward += 0.00238;

            // Display image on canvas
            const img = new Image();
            img.src = 'https://coral-rapid-heron-712.mypinata.cloud/ipfs/QmermAvB3Lzj4ARn8tMW3c3kbXo3yfxBwwZKeeTQyS8Zvu';
            img.onload = () => {
                ctx.drawImage(img, Math.random() * (canvas.width - 15), Math.random() * (canvas.height - 15), 15, 15);
                document.getElementById('levelFill').style.width = `${(imagesMined % 100)}%`;
            };

            // Update displayed stats
            updateMiningStats();

            // Automatically claim rewards at every multiple of 400 images mined
            if (imagesMined % claimThreshold === 0) {
                claimTokens(); // Auto-claim
            }
        }, miningSpeed);
    }
};

const stopMining = () => {
    miningActive = false;
    clearInterval(miningInterval);
    document.getElementById('stopButton').style.display = 'none';
    document.getElementById('startButton').style.display = 'inline';
    document.getElementById('downloadBtn').style.display = 'inline';
};

const claimTokens = async () => {
    if (web3 && gameRewardContract && userAddress) {
        try {
            await gameRewardContract.methods.distributeReward(userAddress).send({ from: userAddress });
            alert('Rewards claimed successfully!');
            displayStatusMessage('Rewards claimed successfully!', false);
            displayTokenBalance();
        } catch (error) {
            console.error("Error claiming rewards:", error);
            displayStatusMessage('Error claiming rewards: ' + error.message, true);
        }
    } else {
        displayStatusMessage('Unable to claim rewards. Contract not initialized.', true);
    }
};

const connectWallet = async () => {
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            web3 = new Web3(window.ethereum);
            const accounts = await web3.eth.getAccounts();
            userAddress = accounts[0];
            document.getElementById('walletAddress').innerText = ` ${userAddress}`;
            displayStatusMessage('Wallet connected successfully!', false);

            // Hide the connect button after wallet is connected
            document.getElementById('connectButton').style.display = 'none';

            // Initialize contracts
            fkdsContract = new web3.eth.Contract(fkdsTokenABI, tokenAddress);
            gameRewardContract = new web3.eth.Contract(gameRewardABI, gameRewardAddress);

            displayTokenBalance();
            // Display the referral link
            displayReferralLink();

            // Check for referral
            checkForReferral();
            
        } catch (error) {
            console.error("Error connecting wallet:", error);
            displayStatusMessage('Error connecting wallet: ' + error.message);
        }
    } else {
        displayStatusMessage('Please install MetaMask!', true);
    }
};

     const displayReferralLink = () => {
            const referralLink = `${window.location.origin}?ref=${userAddress}`;
            const referralLinkElement = document.getElementById('referralLink');
            const referralContainer = document.getElementById('referralLinkContainer');
            
            referralLinkElement.innerText = referralLink;
            referralContainer.style.display = 'block';
        };

        const checkForReferral = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const referrerAddress = urlParams.get('ref');
            if (referrerAddress && referrerAddress !== userAddress) {
                await trackReferral(referrerAddress);
            }
        };

        const trackReferral = async (referrerAddress) => {
            try {
                let referralCount = parseInt(localStorage.getItem(`${referrerAddress}_referrals`) || "0", 10);
                referralCount += 1;
                localStorage.setItem(`${referrerAddress}_referrals`, referralCount);

                const rewardAmount = web3.utils.toWei(referralRewards.toString(), 'ether');
                // Distribute reward via game reward contract
                await gameRewardContract.methods.distributeReward(referrerAddress).send({ from: userAddress });

                displayStatusMessage(`Referral recorded! Sent ${referralRewards} $FKDST to ${gameRewardAddress}`, false);
            } catch (error) {
                console.error("Error rewarding referrer:", error);
                displayStatusMessage("Referral tracking failed.");
            }
        };

        const updateReferralStats = () => {
            const referralCount = parseInt(localStorage.getItem(`${userAddress}_referrals`) || "0", 10);
            const earnedTokens = referralCount * referralRewards;
            document.getElementById('totalReferrals').innerText = referralCount;
            document.getElementById('referralRewards').innerText = earnedTokens;
        };
        
     const updateDateTime = () => {
        const dateTimeElement = document.getElementById('dateTime');
        const now = new Date();

        // Format date and time as "YYYY-MM-DD HH:MM:SS"
        const formattedDateTime = now.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false  // 24-hour format
        });
        // Set the formatted date and time in the element
        dateTimeElement.innerText = `DATΞ & TIMΞ: ${formattedDateTime}`;
    };
    // Start real-time clock updates
    setInterval(updateDateTime, 1000);
    
    const displayTokenBalance = async () => {
    if (fkdsContract && userAddress) {
        try {
            const balance = await fkdsContract.methods.balanceOf(userAddress).call();
            const formattedBalance = web3.utils.fromWei(balance, 'ether');
            document.getElementById('tokenBalance').innerText = `TOKΞN BΔLΔNCΞ: ${formattedBalance} $FKDST`;
            displayStatusMessage('Token balance updated!', false);
            
            // Update star rating based on token balance
            updateStarRating(parseFloat(formattedBalance));
        } catch (error) {
            console.error("Error fetching token balance:", error);
            displayStatusMessage('Error fetching token balance: ' + error.message);
        }
    } else {
        displayStatusMessage('Unable to fetch balance. Contract not initialized.', true);
    }
};
const updateStarRating = (balance) => {
    const starRatingElement = document.getElementById('starRating');
    let stars = 0;

    if (balance >= 50000) stars = 5;
    else if (balance > 1000) stars = 4;
    else if (balance >= 500) stars = 3;
    else if (balance >= 50) stars = 2;
    else if (balance > 5) stars = 1;
    else if (balance > 0) stars = 0;
    
    starRatingElement.innerHTML = '★'.repeat(stars) + '☆'.repeat(5 - stars);

        
        document.getElementById('startButton').style.display = 'inline';
    };

    window.addEventListener('load', () => {
        if (window.ethereum) {
            web3 = new Web3(window.ethereum);
        } else {
            console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
            displayStatusMessage('Non-Ethereum browser detected. Please try MetaMask.');
        }
        
        });  
        
        const rateChartContext = document.getElementById('rateChart').getContext('2d');
let hashData = [];
let faakData = [];
let labels = [];

const rateChart = new Chart(rateChartContext, {
    type: 'line',
    data: {
        labels: labels,
        datasets: [
            {
                label: 'Hash Rate',
                borderColor: '#ff5e00',
                data: hashData,
                fill: false,
            },
            {
                label: 'FAAK Rate',
                borderColor: '#00ffd5',
                data: faakData,
                fill: false,
            },
        ]
    },
    options: {
        scales: {
            x: {
                display: true,
                title: { display: true, text: 'Time' }
            },
            y: {
                display: true,
                title: { display: true, text: 'Rate (H/s)' }
            }
        }
    }
});

function updateRateChart() {
    const hashRate = Math.random().toFixed(2);
    const faakRate = Math.random().toFixed(2);
    
    // Limit data points for visual clarity
    if (hashData.length > 20) {
        hashData.shift();
        faakData.shift();
        labels.shift();
    }
    
    hashData.push(hashRate);
    faakData.push(faakRate);
    labels.push(new Date().toLocaleTimeString());
    
    rateChart.update();

    document.getElementById('hashRate').innerText = `HΔSH RΔTΞ: ${hashRate} H/s & FΔΔK RΔTΞ: ${faakRate} H/s`;
}

// Call updateRateChart every second to simulate real-time updates
setInterval(updateRateChart, 1000);

let boostActive = false; // Track if boost is active
let boostEndTime = 0; // Timestamp when boost ends
let burnAmount = 1; // Amount of $FKDST to burn for boost
let boostContainer = document.getElementById('boostContainer'); // Boost container element
let countdownTimer = document.getElementById('countdownTimer'); // Countdown display element
let totalBoostUsed = 0; // Total amount of $FKDST used for boosts

// Function to start the burn transaction and apply the boost
async function burnTokensForBoost() {
    const burnAmountWei = web3.utils.toWei(burnAmount.toString(), 'ether');

    try {
        // Transfer the burn amount to the dead address
        const burnTransaction = await fkdsContract.methods.transfer('0x000000000000000000000000000000000000dEaD', burnAmountWei)
            .send({ from: userAddress });

        document.getElementById('burnStatus').innerText = `Burn successful! TX: ${burnTransaction.transactionHash}`;

        // Update total boost used
        totalBoostUsed += burnAmount;
        document.getElementById('totalBoostUsed').innerText = `BOOSTΞD: ${totalBoostUsed} `;

        // Start boost if burn is successful
        activateBoost();
    } catch (error) {
        console.error("Burn failed:", error);
        document.getElementById('burnStatus').innerText = "Failed to burn tokens. See console for details.";
    }
}

// Activate boost: Increase mining speed and start 5-minute timer
function activateBoost() {
    if (boostActive) return; // Ensure boost is not already active

    boostActive = true;
    boostEndTime = Date.now() + 5 * 60 * 1000; // 5 minutes from now

    // Double the mining speed for 5 minutes
    miningSpeed = miningSpeed /4;

    // Hide burner UI and show boost container with countdown
    document.getElementById('burnerUI').style.display = 'none'; // Hide burn UI
    boostContainer.style.display = 'block'; // Show boost container

    // Start the countdown
    updateBoostCountdown();

    // Set interval to update the countdown every second
    const countdownInterval = setInterval(() => {
        if (Date.now() >= boostEndTime) {
            clearInterval(countdownInterval); // Stop the countdown when boost ends
            deactivateBoost();
        } else {
            updateBoostCountdown();
        }
    }, 1000);
}

// Update countdown timer display
function updateBoostCountdown() {
    const timeLeft = boostEndTime - Date.now();
    if (timeLeft > 0) {
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        countdownTimer.innerText = `Boost active: ${minutes}m ${seconds}s remaining`;
    }
}

// Deactivate boost: Reset mining speed and UI elements
function deactivateBoost() {
    boostActive = false;
    miningSpeed = miningSpeed * 2; // Restore normal mining speed

    // Hide boost UI and show burner UI
    boostContainer.style.display = 'none';
    document.getElementById('burnerUI').style.display = 'block';
}

document.getElementById('aboutButton').addEventListener('click', function() {
  document.getElementById('aboutPopup').style.display = 'block';
});

document.getElementById('closePopupButton').addEventListener('click', function() {
  document.getElementById('aboutPopup').style.display = 'none';
});

document.getElementById('aboutButton').addEventListener('click', function() {
  document.getElementById('aboutPopup').style.display = 'block';
  playAudio();
});

document.getElementById('closePopupButton').addEventListener('click', function() {
  document.getElementById('aboutPopup').style.display = 'none';
  stopAudio();
});



function openPopup() {
  document.querySelector('.about-popup').classList.remove('hidden');
}

function closePopup() {
  document.querySelector('.about-popup').classList.add('hidden');
}

function playAudio() {
  var audio = document.getElementById('popupAudio');
  audio.play().catch(error => {
    // For browsers that require user interaction for autoplay
    console.log("Audio play prevented due to user interaction requirement.");
  });
}




 // Pinata API credentials
const pinataApiKey = 'd68de55cf26c7c309b1a';
const pinataSecretApiKey = 'c1eb059a07b47e0edcacab633bd23aaa231e7d79008810e88125ff03a6ca8a1e';

// Array to store uploaded IPFS URLs securely
let ipfsImageURLs = JSON.parse(localStorage.getItem('ipfsImageURLs') || '[]');

// Sanitize URL input
const sanitizeURL = (url) => {
    const urlPattern = /^https:\/\/ipfs\.io\/ipfs\/[A-Za-z0-9]+$/;
    return urlPattern.test(url) ? url : '';
};

// Extract IPFS hash from the URL
const extractIpfsHash = (url) => {
    const match = url.match(/\/ipfs\/([A-Za-z0-9]+)/);
    return match ? match[1] : null;
};

// Generate the receipt image and return it as a data URL
const getReceiptImageURL = () => {
    const receiptCanvas = document.createElement('canvas');
    const receiptCtx = receiptCanvas.getContext('2d');
    receiptCanvas.width = 400;
    receiptCanvas.height = 580;

    const now = new Date();
    const formattedDateTime = now.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    // Set up canvas background and header
    receiptCtx.fillStyle = "#FFFFFFFC";
    receiptCtx.fillRect(0, 0, receiptCanvas.width, receiptCanvas.height);
    receiptCtx.fillStyle = "#000000";
    receiptCtx.font = "bold 15px Arial";
    receiptCtx.textAlign = "center";
    receiptCtx.fillText("P o F RΞCΞ!PT", receiptCanvas.width / 2, 40);

    // Display Date and Time
    receiptCtx.font = "12px Arial";
    receiptCtx.textAlign = "left";
    receiptCtx.fillText(`: ${formattedDateTime}`, 20, 70);

    // Add mining stats on the receipt
    const stats = [
        { label: "", value: document.getElementById('hashRate').innerText },
        { label: "", value: document.getElementById('minedImages').innerText },
        { label: "", value: document.getElementById('miningReward').innerText },
        { label: "", value: document.getElementById('totalBoostUsed').innerText },
        { label: "", value: document.getElementById('tokenBalance').innerText },
        { label: "", value: document.getElementById('walletAddress').innerText },
        { label: "", value: document.getElementById('starRating').innerText }
    ];

    let startY = 100;
    stats.forEach((stat, index) => {
        receiptCtx.fillText(`${stat.label}: ${stat.value}`, 20, startY + (index * 30));
    });

    // Draw mined images on the receipt
    const minedCanvas = document.getElementById('minedCanvas');
    if (minedCanvas) {
        receiptCtx.drawImage(minedCanvas, 20, startY + stats.length * 30 + 30, 360, 180);
    }

    receiptCtx.font = "italic 12px Arial";
    receiptCtx.textAlign = "center";
    receiptCtx.fillText("🜨 ♁ ☷ 🜃", receiptCanvas.width / 2, receiptCanvas.height - 40);

    return receiptCanvas.toDataURL('image/png');
};

// Convert a data URL to a blob for uploading to IPFS
const dataURLToBlob = async (dataURL) => {
    try {
        const response = await fetch(dataURL);
        return await response.blob();
    } catch (error) {
        console.error("Error converting data URL to blob:", error);
    }
};

// Upload receipt to IPFS
const uploadToIPFS = async (blob) => {
    try {
        const formData = new FormData();
        formData.append('file', blob);

        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error("Failed to upload to IPFS");
        }

        const data = await response.json();
        const ipfsURL = `https://ipfs.io/ipfs/${data.IpfsHash}`;
        return sanitizeURL(ipfsURL);
    } catch (error) {
        console.error("IPFS upload error:", error);
        alert("Failed to upload to IPFS. Please try again later.");
    }
};

// Unpin from IPFS using Pinata's API
const unpinFromIPFS = async (ipfsHash) => {
    try {
        const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${ipfsHash}`, {
            method: 'DELETE',
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to unpin from IPFS. Status: ${response.status}`);
        }

        console.log("Successfully unpinned from IPFS:", ipfsHash);
    } catch (error) {
        console.error("IPFS unpin error:", error);
        alert("Failed to unpin from IPFS. Please try again later.");
    }
};

// Upload receipt, add to gallery, and store in local storage
const uploadReceiptToIPFS = async () => {
    const imageDataURL = getReceiptImageURL();
    const blob = await dataURLToBlob(imageDataURL);

    if (!blob) {
        console.error("Failed to create Blob from image data");
        return;
    }

    const ipfsURL = await uploadToIPFS(blob);
    if (ipfsURL) {
        ipfsImageURLs.push(ipfsURL);
        localStorage.setItem('ipfsImageURLs', JSON.stringify(ipfsImageURLs));
        displayIPFSImage(ipfsURL);
    }
};

// Function to move between images
let currentSlide = 0;

function moveSlide(direction) {
    const images = document.querySelectorAll('.image-box');
    const totalImages = images.length;

    currentSlide += direction;

    if (currentSlide < 0) currentSlide = totalImages - 1;
    else if (currentSlide >= totalImages) currentSlide = 0;

    const galleryContainer = document.querySelector('.gallery-container');
    const offset = -currentSlide * 100;
    galleryContainer.style.transform = `translateX(${offset}%)`;
}

// Function to share receipt on Twitter with referral link from an HTML element
const shareOnTwitter = (url) => {
    const encodedURL = encodeURIComponent(url);
    const tweetText = encodeURIComponent("Check out my P o F RΞCΞ!PT:");

    // Retrieve referral link from the HTML element
    const referralLinkElement = document.getElementById('referralLink');
    const referralLink = referralLinkElement ? referralLinkElement.textContent.trim() : null;

    // Construct the Twitter share URL
    let twitterShareURL = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodedURL}`;

    if (referralLink) {
        const encodedReferralLink = encodeURIComponent(`\n\nReferral Link: ${referralLink}`);
        twitterShareURL += `url=${encodedReferralLink}`;
    }

    // Open the Twitter share URL in a new tab
    window.open(twitterShareURL, '_blank');
};
// Function to keep (remove from viewer but not delete) the image
const keepImage = (element) => {
    element.style.display = "none"; // Hides the image from the viewer
    displayStatusMessage("Receipt removed from viewer but kept in local storage.", false);
};

const burnImage = (url, element) => {
    if (!url || !element) {
        console.error("Invalid URL or element");
        return;
    }

    try {
        // Update localStorage
        ipfsImageURLs = ipfsImageURLs.filter((storedURL) => storedURL !== url);
        localStorage.setItem('ipfsImageURLs', JSON.stringify(ipfsImageURLs));

        // Remove from DOM
        element.remove();

        // Unpin from IPFS (optional)
        const ipfsHash = url.split('/').pop(); // Extract IPFS hash from URL
        unpinFromIPFS(ipfsHash);

        displayStatusMessage("P o F successfully burned.", true);
    } catch (error) {
        console.error("Error burning the image:", error);
        displayStatusMessage("Failed to burn the image. Try again.", false);
    }
};



// Display IPFS receipt in the gallery
const displayIPFSImage = (url) => {
    const sanitizedURL = sanitizeURL(url);
    if (!sanitizedURL) return;

    const ipfsImagesContainer = document.getElementById('ipfsImages');
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'image-box';

    const img = document.createElement('img');
    img.src = sanitizedURL;
    img.alt = "Uploaded Receipt";
    img.style.width = "200px"; // Thumbnail size
    imageWrapper.appendChild(img);

    // Burn button
    const burnButton = document.createElement('button');
    burnButton.className = 'burn-btn button';
    burnButton.innerText = "BURN";
    burnButton.onclick = () => burnImage(url, imageWrapper);
    imageWrapper.appendChild(burnButton);
    
    // Keep button
    const keepButton = document.createElement('button');
    keepButton.className = 'keep-btn button';
    keepButton.innerText = "KΞΞP";
    keepButton.onclick = () => keepImage(imageWrapper);
    imageWrapper.appendChild(keepButton);

    ipfsImagesContainer.appendChild(imageWrapper);

    // Mint NFT button
    const mintButton = document.createElement('button');
    mintButton.className = 'mint-btn button';
    mintButton.innerText = "MIN!T";
    mintButton.onclick = async () => {
        try {
            const blob = await fetch(sanitizedURL).then(res => res.blob());
            const ipfsURL = await uploadToIPFS(blob);
            const metadata = {
                name: "Receipt NFT",
                description: "A digital receipt stored on IPFS",
                image: ipfsURL,
                attributes: [{ trait_type: "Type", value: "Receipt" }]
            };

            const metadataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': pinataApiKey,
                    'pinata_secret_api_key': pinataSecretApiKey
                },
                body: JSON.stringify(metadata)
            });

            if (!metadataResponse.ok) throw new Error('Failed to upload metadata to IPFS');
            const metadataData = await metadataResponse.json();
            const metadataURL = `ipfs://${metadataData.IpfsHash}`;

            alert('Minted NFT Metadata URL: ' + metadataURL);
        } catch (error) {
            alert('Minting failed: ' + error.message);
        }
    };
    imageWrapper.appendChild(mintButton);

    // Share button
    const shareButton = document.createElement('button');
    shareButton.className = 'share-btn button';
    shareButton.innerText = "SHARΞ";
    shareButton.onclick = () => shareOnTwitter(sanitizedURL);
    imageWrapper.appendChild(shareButton);

   
};

// Load all stored IPFS receipts on page load
const loadAllIPFSImages = () => {
    ipfsImageURLs.forEach((url) => {
        displayIPFSImage(url);
    });
};

window.onload = loadAllIPFSImages;


  // Function to play audio
    function playAudio() {
        var audio = document.getElementById('audioPlayer');
        audio.play();
    }

    // Trigger audio when the connect button is clicked (or any other button you want)
    document.getElementById('connectButton').addEventListener('click', playAudio);

function toggleIPFSViewer(show) {
    const ipfsContainer = document.getElementById('ipfsImageViewer');
    if (ipfsContainer) {
        ipfsContainer.style.display = show ? 'block' : 'none';
    }
}

// Add this to your initialization code within the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', (event) => {
    // ... other initialization code ...
    const ipfsToggle = document.getElementById('ipfsToggle');
    if (ipfsToggle) {
        ipfsToggle.checked = true;  // Default to showing the IPFS viewer
    }
});
