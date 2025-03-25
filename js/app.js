// OFT合约ABI定义
const OFT_ABI = [
    {
        "inputs": [
            {
                "components": [
                    { "name": "dstEid", "type": "uint32" },
                    { "name": "to", "type": "bytes32" },
                    { "name": "amountLD", "type": "uint256" },
                    { "name": "minAmountLD", "type": "uint256" },
                    { "name": "extraOptions", "type": "bytes" },
                    { "name": "composeMsg", "type": "bytes" },
                    { "name": "oftCmd", "type": "bytes" }
                ],
                "name": "sendParam",
                "type": "tuple"
            },
            {
                "name": "payInLzToken",
                "type": "bool"
            }
        ],
        "name": "quoteSend",
        "outputs": [
            {
                "components": [
                    { "name": "nativeFee", "type": "uint256" },
                    { "name": "lzTokenFee", "type": "uint256" }
                ],
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    { "name": "dstEid", "type": "uint32" },
                    { "name": "to", "type": "bytes32" },
                    { "name": "amountLD", "type": "uint256" },
                    { "name": "minAmountLD", "type": "uint256" },
                    { "name": "extraOptions", "type": "bytes" },
                    { "name": "composeMsg", "type": "bytes" },
                    { "name": "oftCmd", "type": "bytes" }
                ],
                "name": "sendParam",
                "type": "tuple"
            },
            {
                "components": [
                    { "name": "nativeFee", "type": "uint256" },
                    { "name": "lzTokenFee", "type": "uint256" }
                ],
                "name": "fee",
                "type": "tuple"
            },
            {
                "name": "refundAddress",
                "type": "address"
            }
        ],
        "name": "send",
        "outputs": [
            {
                "components": [
                    { "name": "guid", "type": "bytes32" },
                    { "name": "nonce", "type": "uint64" },
                    { "name": "fee", "type": "uint256" }
                ],
                "name": "",
                "type": "tuple"
            },
            {
                "components": [
                    { "name": "amountSentLD", "type": "uint256" },
                    { "name": "amountReceivedLD", "type": "uint256" }
                ],
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// 链配置
const CHAIN_CONFIG = {
    "bsc": {
        "rpc": "https://bsc-dataseed.binance.org/",
        "chainId": 56,
        "lzChainId": 30102,
        "explorer": "https://bscscan.com/tx/"
    },
    "base": {
        "rpc": "https://mainnet.base.org",
        "chainId": 8453,
        "lzChainId": 30184,
        "explorer": "https://basescan.org/tx/"
    }
};

// 全局变量
let web3;
let accounts;
let contractInstance;
let tokenDecimals = 18;
let tokenSymbol = '';

// 转换地址为bytes32格式
function addressToBytes32(address) {
    if (address.startsWith('0x')) {
        address = address.slice(2);
    }

    if (address.length !== 40) {
        throw new Error('EVM地址必须是20字节长度');
    }

    return '0x' + '0'.repeat(24) + address;
}

// 显示状态消息
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = 'status ' + type;
}

// 切换链
async function switchChain(chainName) {
    const chainInfo = CHAIN_CONFIG[chainName];

    if (!window.ethereum) {
        showStatus('请安装MetaMask钱包!', 'error');
        return false;
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + chainInfo.chainId.toString(16) }],
        });
        return true;
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await addChain(chainName);
                return true;
            } catch (addError) {
                showStatus('添加网络失败: ' + addError.message, 'error');
                return false;
            }
        } else {
            showStatus('切换网络失败: ' + switchError.message, 'error');
            return false;
        }
    }
}

// 添加链
async function addChain(chainName) {
    const chainInfo = CHAIN_CONFIG[chainName];
    let networkName, nativeCurrency, rpcUrls;

    if (chainName === 'bsc') {
        networkName = 'BNB Smart Chain';
        nativeCurrency = {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
        };
        rpcUrls = ['https://bsc-dataseed.binance.org/'];
    } else if (chainName === 'base') {
        networkName = 'Base';
        nativeCurrency = {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
        };
        rpcUrls = ['https://mainnet.base.org'];
    }

    await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
            {
                chainId: '0x' + chainInfo.chainId.toString(16),
                chainName: networkName,
                nativeCurrency: nativeCurrency,
                rpcUrls: rpcUrls,
                blockExplorerUrls: [chainInfo.explorer.slice(0, -3)]
            },
        ],
    });
}

// 连接钱包
async function connectWallet() {
    if (!window.ethereum) {
        showStatus('请安装MetaMask钱包!', 'error');
        return;
    }

    try {
        showStatus('正在连接钱包...', 'info');

        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        web3 = new Web3(window.ethereum);

        document.getElementById('connect-wallet').textContent = accounts[0].substring(0, 6) + '...' + accounts[0].substring(38);
        document.getElementById('send-tx').disabled = false;

        showStatus('钱包已连接', 'success');

        // 设置源链事件监听
        document.getElementById('source-chain').addEventListener('change', async function () {
            if (await switchChain(this.value)) {
                loadContractInfo();
            }
        });

        // 初始切换到源链
        const sourceChain = document.getElementById('source-chain').value;
        if (await switchChain(sourceChain)) {
            loadContractInfo();
        }
    } catch (error) {
        showStatus('连接钱包失败: ' + error.message, 'error');
    }
}

// 加载合约信息
async function loadContractInfo() {
    try {
        const contractAddress = document.getElementById('contract-address').value;

        if (!web3.utils.isAddress(contractAddress)) {
            showStatus('无效的合约地址', 'error');
            return;
        }

        contractInstance = new web3.eth.Contract(OFT_ABI, contractAddress);

        // 获取代币信息
        tokenSymbol = await contractInstance.methods.symbol().call();
        tokenDecimals = parseInt(await contractInstance.methods.decimals().call());
        const tokenName = await contractInstance.methods.name().call();

        // 获取余额
        const balance = await contractInstance.methods.balanceOf(accounts[0]).call();
        const formattedBalance = parseFloat(balance) / Math.pow(10, tokenDecimals);

        showStatus(`代币: ${tokenName} (${tokenSymbol}), 余额: ${formattedBalance.toFixed(6)}`, 'info');
    } catch (error) {
        showStatus('加载合约信息失败: ' + error.message, 'error');
    }
}

// 执行跨链交易
async function sendBridgeTransaction() {
    try {
        const contractAddress = document.getElementById('contract-address').value;
        const toAddress = document.getElementById('to-address').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const sourceChain = document.getElementById('source-chain').value;
        const destChain = document.getElementById('dest-chain').value;

        if (!web3.utils.isAddress(contractAddress) || !web3.utils.isAddress(toAddress)) {
            showStatus('无效的地址格式', 'error');
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            showStatus('无效的金额', 'error');
            return;
        }

        if (sourceChain === destChain) {
            showStatus('源链和目标链不能相同', 'error');
            return;
        }

        // 切换到源链
        if (!(await switchChain(sourceChain))) {
            return;
        }

        showStatus('正在准备交易...', 'info');

        // 检查余额
        const balance = await contractInstance.methods.balanceOf(accounts[0]).call();
        const formattedBalance = parseFloat(balance) / Math.pow(10, tokenDecimals);
        const amountInWei = BigInt(Math.floor(amount * Math.pow(10, tokenDecimals)));
        const minAmount = BigInt(Math.floor(amountInWei * 0.95)); // 5% 滑点

        if (BigInt(balance) < amountInWei) {
            showStatus(`余额不足: 需要 ${amount} ${tokenSymbol}, 当前余额 ${formattedBalance.toFixed(6)}`, 'error');
            return;
        }

        // 准备发送参数
        const toBytes32 = addressToBytes32(toAddress);
        const destChainId = CHAIN_CONFIG[destChain].lzChainId;

        const sendParam = {
            dstEid: destChainId,
            to: toBytes32,
            amountLD: amountInWei.toString(),
            minAmountLD: minAmount.toString(),
            extraOptions: '0x',
            composeMsg: '0x',
            oftCmd: '0x'
        };

        // 估算费用
        showStatus('正在估算费用...', 'info');

        let nativeFee;
        try {
            const fee = await contractInstance.methods.quoteSend(sendParam, false).call({ from: accounts[0] });
            nativeFee = fee[0]; // nativeFee

            const formattedFee = web3.utils.fromWei(nativeFee, 'ether');
            showStatus(`预估费用: ${formattedFee} ${sourceChain === 'bsc' ? 'BNB' : 'ETH'}`, 'info');
        } catch (error) {
            showStatus('费用估算失败，使用默认费用: ' + error.message, 'info');
            nativeFee = web3.utils.toWei('0.02', 'ether');
        }

        // 确认交易
        if (!confirm(`确认从${sourceChain.toUpperCase()}发送 ${amount} ${tokenSymbol}到${destChain.toUpperCase()}?`)) {
            showStatus('交易已取消', 'info');
            return;
        }

        // 发送交易
        showStatus('正在发送交易...', 'info');

        const fee = {
            nativeFee: nativeFee,
            lzTokenFee: '0'
        };

        await contractInstance.methods.send(sendParam, fee, accounts[0])
            .send({
                from: accounts[0],
                value: nativeFee,
                gas: 500000
            })
            .on('transactionHash', function (hash) {
                const explorerUrl = CHAIN_CONFIG[sourceChain].explorer + hash;
                showStatus(`交易已提交，正在处理...<br>哈希: <a href="${explorerUrl}" target="_blank">${hash}</a>`, 'info');
            })
            .on('receipt', function (receipt) {
                if (receipt.status) {
                    showStatus(`交易成功! 代币将在几分钟内到达${destChain.toUpperCase()}链<br>接收地址: ${toAddress}`, 'success');
                } else {
                    showStatus('交易失败!', 'error');
                }
            })
            .on('error', function (error) {
                showStatus('交易发送失败: ' + error.message, 'error');
            });

    } catch (error) {
        showStatus('交易发送失败: ' + error.message, 'error');
    }
}

// 页面加载完成后设置事件监听
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('connect-wallet').addEventListener('click', connectWallet);
    document.getElementById('send-tx').addEventListener('click', sendBridgeTransaction);

    // 当目标链变更时，确保源链和目标链不同
    document.getElementById('dest-chain').addEventListener('change', function () {
        const sourceSelect = document.getElementById('source-chain');
        const destSelect = this;

        if (sourceSelect.value === destSelect.value) {
            sourceSelect.value = (destSelect.value === 'bsc') ? 'base' : 'bsc';
        }
    });

    // 当源链变更时，确保源链和目标链不同
    document.getElementById('source-chain').addEventListener('change', function () {
        const sourceSelect = this;
        const destSelect = document.getElementById('dest-chain');

        if (sourceSelect.value === destSelect.value) {
            destSelect.value = (sourceSelect.value === 'bsc') ? 'base' : 'bsc';
        }
    });
});