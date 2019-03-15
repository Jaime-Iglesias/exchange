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
        if (typeof window.ethereum !== 'undefined') {
            window.web3 = new Web3(window.ethereum);

            this.isInstalled();

            try {
                await window.ethereum.enable();
                this.getAddress();
            } catch (err) {
                console.log(err);
            }
            this.getNetwork();
        } else if (typeof window.web3 !== 'undefined') {
            window.web3 = new Web3(window.web3.currentProvider);
            this.getInfo();
        } else {
            console.log('No Web3 provider detected. Please, consider using MetaMask!');
        }
    }

    componentWillUpdate(prevProps, prevState) {
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
            this.getInfo();
        }
        console.log(this.state);
    }

    async isInstalled() {
        if (window.web3.givenProvider) {
            this.setState({
                isInstalled: true,
            });
        }
    }

    async getAddress() {
        try{
            const accounts = await window.web3.eth.getAccounts();
            if (accounts.length > 0) {
                this.setState({
                    isUnlocked: true,
                    address: accounts[0],
                });
            }
        } catch (err) {
            console.log(err);
        }
    }

    async getNetwork() {
        try{
            const network = await window.web3.eth.net.getId();
            this.setState({
                networkId: network,
            });
        } catch (err) {
            console.log(err);
        }
    }

    getInfo() {
        this.isInstalled();
        this.getAddress();
        this.getNetwork();
    }

    check() {
        const {
          isInstalled,
          isUnlocked,
          networkId,
          address,
        } = this.state;


        if (isInstalled === false) {
          return;
        }

        if (isUnlocked === false) {
          return;
        }

        /*if (networkId !== this.networkId) {
          return;
      }*/

        if (address === '') {
          return;
      }

        return <App network = { this.state.networkId } address = { this.state.address } />;
    }

    render() {
        return(
            <div> { this.check() } </div>
        )
    }
}

export default CheckProvider;
