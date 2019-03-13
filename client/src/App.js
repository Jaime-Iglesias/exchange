import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';

import Header from "./components/Header";

class App extends Component {

    componentDidMount() {
        this.loadBlockchainData();
    }

    accountChanged(event) {
        this.setState({
            address: event.selectedAddress,
        })
    }

    networkChanged(event) {
        this.setState({
            netWork: event.networkChanged,
        })
    }

    async loadBlockchainData() {
        const web3 = new Web3(Web3.givenProvider || "http://localhost:7545")
        const network = await web3.eth.net.getNetworkType()
        const accounts = await web3.eth.getAccounts()

        this.setState({ network: network, address: accounts[0] })

        console.log('network:', network)
        console.log('account:', accounts[0])
    }

    constructor(props) {
            super(props)
            this.state = {
                network: -1,
                address: ''
            };
    }

    render() {
        return (
          <div>
            <Header/>
            <h1>  Hello World!  </h1>
            <p> Your account: { this.state.address } </p>
            <p> The netWork: { this.state.network } </p>
          </div>
        );
    }
}

export default App;
