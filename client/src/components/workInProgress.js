import React, { Component } from 'react';
import Web3 from 'web3';

import App from '../App';

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
      if ( typeof window.ethereum !== 'undefined' ) {
          window.web3 = new Web3(window.ethereum);
          try {
              await window.etherum.enable();
              this.isInstalledP();
          } catch (err) {
              console.log(err);
          }
      } else if (typeof window.web3 !== 'undefined' ) {
          window.web3 = new Web3(window.web3.currentProvider);
          this.isInstalledP();
      }
      else {
          console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
          window.web3 = new Web3("http://localhost:7545");
          this.isInstalledP();
      }
  }

  componentDidUpdate = (prevProps, prevState) => {
    const {
      isInstalled,
      isUnlocked,
      networkId,
      address,
    } = this.state;

    if (
      isInstalled !== prevState.isInstalled
      || isUnlocked !== prevState.isUnlocked
      || networkId !== prevState.networkId
      || address !== prevState.address
    ) {
      this.isInstalledP();
    }
  }

  async getAccount() {
      try {
          const accounts = await window.web3.eth.getAccounts();
          this.setState( { account: accounts[0] } );
      } catch (err) {
          console.log(err);
      }
  }

  async getNetwork() {
      try {
          const network = await window.web3.eth.net.getId();
          this.setState( { networkId: network });
          this.getAccount();
      } catch (err) {
          console.log(err);
      }
  }

  isInstalledP() {
      if (window.web3.currentProvider) {
          this.setState( { isInstalled: true } );
      }
  }

  async isUnlockedP() {
      try {
          const accounts = await window.web3.eth.getAccounts();
          if ( accounts.length > 0) {
              this.setState( { isUnlocked: true } );
              this.getNetwork();
          }
      } catch (err) {
          console.log(err);
      }
  }

  checkState() {
      const expectedNetwork = 3;
      const {
        isInstalled,
        iskUnlocked,
        networkId,
        account,
      } = this.state;

      if ( isInstalled === false ) {
          return;
      }

      if ( iskUnlocked === false ) {
          return;
      }

      /*if ( networkId !== expectedNetwork ) {
          return;
      }*/

      if ( account === '' ) {
          return;
      }

      return <App account = { account } />;
  }

  render() {
    return (
      <div>
        { this.checkState() }
      </div>
    );
  }
}

export default CheckProvider;
