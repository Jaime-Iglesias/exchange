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

    async loadProvider() {
        const web3 = new Web3(Web3.giveProvider || "http://localhost:7545");
        this.getInfo();
    }

    componentWillMount() {
        this.loadProvider();
    }

    /*componentDidMount() {
        if (typeof window.ethereum !== 'undefined') {
            window.web3 = new Web3(window.ethereum);

            window.addEventListener('message', ({ data }) => {
                console.log(window.ethereum);
            });

            this.isInstalled();

            window.ethereum.enable()
                .then( () => {
                    this.getAddress();
                })
                .catch( (err) => {
                    console.log(err);
                });
            this.getNetwork();
        } else if (typeof window.web3 !== 'undefined') {
            window.web3 = new Web3(window.web3.currentProvider);
            this.getInfo();
        } else {
            console.log('No Web3 provider detected. Please, consider using MetaMask!');
        }
    }*/

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
        if (this.web3) {
            this.setState({
                isInstalled: true,
            });
        }
    }

    async getAddress() {
        try{
            const accounts = await this.web3.eth.getAccounts();
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
            const network = await this.web3.eth.net.getId();
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

        if (networkId === -1) {
          return;
        }

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
