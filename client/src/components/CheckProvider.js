import React, { Component } from 'react';
import Web3 from 'web3';

class CheckProvider extends Component {

    constructor(props) {
        super(props);

        this.state = {
            isInstalled: false,
            isUnlocked: false,
            networkId: -1,
            address: '',
        };
    }

    async componentDidMount() {
      if (window.ethereum) {
          window.web3 = new Web3(window.ethereum);
          try {
              await window.ethereum.enable();
          } catch (err) {
              console.log(err);
          }
      } else if (window.web3) {
          window.web3 = new Web3(window.web3.currentProvider);
      }
      else {
          console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
      }
    }

    async getAddress() {
        try {
            const accounts = await window.web3.eth.getAccounts();
            this.setState( {
                address: accounts[0],
            });
        } catch(err) {
            console.log(err);
        }
    }

    async getNetwork() {
        try{
            const net = await window.web3.eth.net.getId();
            this.setState( {
                netWorkId: net,
            });

            this.getAddress();
        } catch(err) {
            console.log(err);
        }
    }

    isInstalled() {
        if (Web3.givenProvider) {
            this.setState({
              isInstalled: true,
            });
        }

        this.isMetaMaskUnlocked();
    }

    async isUnlocked() {
        try {
          const accounts = await window.web3.eth.getAccounts();
          if ( accounts.length > 0 ) {
              this.setState({
                  isUnlocked: true,
              });

              this.getNetwork();
          }
        } catch(err) {
          console.log(err);
        }
    }

    checkMetaMask = () => {
      const {
        isMetaMaskInstalled,
        isMetaMaskUnlocked,
        networkId,
        address,
      } = this.state;

      if (isMetaMaskInstalled === false) {
        return <InstallMetaMask />;
      }

      if (isMetaMaskUnlocked === false) {
        return <UnlockMetaMask />;
      }

      if (networkId !== this.networkId) {
        return <WrongNetwork />;
      }

      if (address === '') {
        return <UnlockAccount />;
      }

      return <App address={address} />;
    }

    render() {
        return (
            <div> { this.loadProvider() } </div>
        );
    }
}

export default CheckProvider;
