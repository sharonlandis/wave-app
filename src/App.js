import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";
import food1 from "./food.png";
import instructions from "./walletInstructions.pdf";
import { css } from "@emotion/react";
import GridLoader from "react-spinners/GridLoader";
// import { ethErrors } from "eth-rpc-errors";

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [allWaves, setAllWaves] = useState([]);
  const [totalWaves, setTotalWaves] = useState(0);
  const [waverMsg, setWaverMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestConnect, setRequestConnect] = useState(false);
  const [error, setError] = useState(null);

  const contractAddress = "0x4fe1043cfea32d20586f2116b082866817b92356";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      setError(null);
      const { ethereum } = window;

      if (!ethereum) {
        setError("Install the MetaMask browser extension!");
        return;
      } else {
        console.log("We have the ethereum object"); //
      }

      // window.ethereum injects ethereum object into the browser, but does not guarantee
      // access to users account is not aivailable until ethereum._state.isConnected is true
      // If false need to reload window. Can't auto load page (window.location.reload()).
      // as it may take several page loads for ethereum to fully connect, and continually reloading .
      // page creates a choppy UE
      // Issue has been raised to MetaMask forum.
      // For now instruct user to wait 1 minute and reload page

      if (!ethereum._state.isConnected) {
        setError("MetaMask not available. Wait 1 minute then, reload page.");
        return;
      }

      // There was pending wallet connect and user connected manually => no longer request connect
      if (requestConnect && ethereum.accounts?.length > 0)
        setRequestConnect(false);
      // else pending wallet connect persists
      // User clicked "Connect Your Wallet" and did not complete MM popup to connect.
      //  User has to open MM popup manually.
      else if (requestConnect) {
        setError("Open MetaMask extension manually to complete wallet connect");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        setCurrentAccount(account);
        setRequestConnect(false);
        console.log("Found an authorized account:", account);
      } else {
        // no error msg here, user loaded page and hasn't done else anything
        console.log("No authorized account found");
        return;
      }
    } catch (error) {
      console.log("2 ", error.code);
      console.log("2 ", error.message);
      setError("Something went wrong");
    }
  };

  /**
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        setError("Error: Install the MetaMask browser extension!");
        return;
      }

      setRequestConnect(true);

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts[0]);
      setRequestConnect(false);
      setError(false);
      console.log("Connected", accounts[0]);
    } catch (error) {
      if (error.code === -32002) {
        setError("Open MetaMask extension manually to complete wallet connect");
      }
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      checkIfWalletIsConnected();
      if (!currentAccount) {
        if (requestConnect) {
          setError(
            "Open MetaMask extension manually to complete wallet connect"
          );
        } else {
          setError("Connect your wallet");
        }
        return;
      }

      const { ethereum } = window;

      if (ethereum) {
        // Make sure user is on Ropsten
        const chainId = await ethereum.request({ method: "eth_chainId" });
        const ropstenChainId = "0x3";
        console.log("chainId ", chainId);
        if (chainId !== ropstenChainId) {
          setError("Switch to the Ropsten Test Network!");
          return;
        }

        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
         * Execute the actual wave from your smart contract
         */

        const waveTxn = await wavePortalContract.wave(waverMsg);

        console.log("Mining...", waveTxn.hash);

        setLoading(true);
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();

        console.log("Retrieved total wave count...", count.toNumber());

        setTotalWaves(count.toNumber());
        getAllWaves();
        setLoading(false);
        setWaverMsg("");
      } else {
        console.log("Ethereum object doesn't exist in browser!");
      }
    } catch (error) {
      setLoading(false);
      console.log("1 ", error.code);
      console.log("1 ", error.message);
      if (error.code === 4001) setError("Transaction cancelled");
      else if (error.message.includes("Wait 1 minute"))
        setError("Wait 1 minute to waive again");
      else setError("Something went wrong");
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

  const override = css`
    display: block;
    margin: 20px;
  `;

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
      if (currentAccount.toLowerCase() === from.toLowerCase()) {
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
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <img src={food1} alt="Comfort food" />
        <h1>Add your favorite comfort food to The Comfort Food Chain</h1>
        <ol className="rules">
          <li>
            Connect your Ethereum wallet.{" "}
            <a
              className="rulesLink"
              href={instructions}
              target="_blank"
              rel="noopener noreferrer"
            >
              Click here to find out how
            </a>
          </li>
          <li>In your MetaMask wallet, go to the Ropsten testnet.</li>
          <li>Enter your favorite comfort food in the box below.</li>
          <li>
            Click the "Wave at me" button. Confirm the transaction in the MM
            popup.
          </li>
          <li>
            After the txn completes you'll see the Food Chain. Scroll down to
            see your entry.
          </li>
          <li>Want to add another favorite food? Wait 1 minute.</li>
        </ol>
        {error && <div className="connectBold">{error}</div>}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Your MetaMask Wallet (instructions above)
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

        <div className="spinner">
          <GridLoader
            color="purple"
            loading={loading}
            css={override}
            size={10}
          />
          {loading && <div className="spinnerMessage">In Progress</div>}
        </div>
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
              <div className="address">{wave.address}</div>
              <div className="msgTime">{wave.timestamp.toString()}</div>
              <div className="favFood">Fav comfort food: {wave.message}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
