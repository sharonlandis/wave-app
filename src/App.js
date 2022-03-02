import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";
import ProgressBar from "./ProgressBar";
import food1 from "./food.png";
import instructions from "./walletInstructions.pdf";
import Emoji from "a11y-react-emoji";

function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [totalWaves, setTotalWaves] = useState(0);
  const [waverMsg, setWaverMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const [requestConnect, setConnectRequest] = useState(false);

  const contractAddress = "0x4fe1043cfea32d20586f2116b082866817b92356";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Install the MetaMask browser extension!");
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length === 0) {
        console.log("No authorized account found");
      } else {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      }
      // if (accounts.length !== 0) {
      //   const account = accounts[0];
      //   console.log("Found an authorized account:", account);
      //   setCurrentAccount(account);
      // } else {
      //   alert("Connect your wallet");
      //   console.log("No authorized account found");
      //   return;
      // }
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        // alert("Get MetaMask!");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      checkIfWalletIsConnected();
      if (!currentAccount) {
        setConnectRequest(true);
        return;
      }

      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        setProgress(60);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
         * Execute the actual wave from your smart contract
         */
        const waveTxn = await wavePortalContract.wave(waverMsg);

        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();

        console.log("Retrieved total wave count...", count.toNumber());

        setTotalWaves(count.toNumber());
        getAllWaves();
        setProgress(0);
        setWaverMsg("");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map((wave) => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    if (!currentAccount) {
      return;
    }
    let wavePortalContract;

    const getCurrentAccount = async () => {
      const { ethereum } = window;
      if (ethereum) {
        const accounts = await ethereum.request({ method: "eth_accounts" });
        return accounts[0];
      }
    };

    const onNewWave = async (from, timestamp, message) => {
      const currentAccount = await getCurrentAccount();
      console.log("OnNewWave > currentAcct ", currentAccount);
      console.log("OnNewWave > from ", from);
      if (currentAccount.toLowerCase() === from.toLowerCase()) {
        console.log("It's my wave");
        return;
      }
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      console.log("cleanup");
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, [contractABI, currentAccount]);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <img src={food1} alt="Comfort food" />
        <div className="header">
          <h1>What's your favorite comfort food?</h1>
          <p className="headerP1">
            Add your favorite comfort food to The Comfort Food Chain.
          </p>
          <p className="headerP2">
            Can't decide on one favorite? Add two or three!
          </p>
        </div>
        <ol className="rules">
          <li>
            Connect your Ethereum Ropsten wallet.{" "}
            <a
              className="rulesLink"
              href={instructions}
              target="_blank"
              rel="noopener noreferrer"
            >
              Click here to find out how
            </a>
          </li>
          <li>Enter your favorite comfort food in the box below.</li>
          <li>Click the "Wave at me" button.</li>
          <li>
            After MM reports a completed transaction, scroll down to see your
            entries.
          </li>
          <li>Want to add another favorite food? Wait 1 minute.</li>
        </ol>
        {!currentAccount && !requestConnect && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Your Wallet (link to instructions above)
          </button>
        )}
        {!currentAccount && requestConnect && (
          <button className="waveButton connectBold" onClick={connectWallet}>
            <Emoji className="emojis" symbol="👋"></Emoji>
            Connect Your Wallet (link to instructions above)
          </button>
        )}

        <div className="form">
          <input
            type="text"
            className="formInput"
            placeholder="Enter your favorite comfort food here..."
            value={waverMsg}
            onChange={(event) => setWaverMsg(event.target.value)}
          />
        </div>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        {progress === 60 && currentAccount && (
          <ProgressBar bgcolor={"#6a1b9a"} completed={60} />
        )}

        {totalWaves > 0 && <h2>Total Comfort Foods: {totalWaves}</h2>}

        {allWaves.map((wave, index) => {
          return (
            <div
              key={index}
              style={{
                backgroundColor: "OldLace",
                marginTop: "16px",
                padding: "8px",
              }}
            >
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div className="favFood">Comfort Food: {wave.message}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
