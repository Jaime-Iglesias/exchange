import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';

import Header from "./components/Header";

class App extends Component {

    constructor(props) {
            super(props)

    }

    /*componentDidUpdate(prevProps, prevState) {
        const{
            network,
            address,
        } = this.State;

    }*/

    /*componentWillMount() {
        this.loadBlockchainData();
    }

    async loadBlockchainData() {
        const web3 = new Web3(Web3.giveProvider || "http://localhost:7545")
        const network = await web3.eth.net.getNetworkType()
        const accounts = await web3.eth.getAccounts()
        this.setState({ network: network, address: accounts[0] })
        console.log('network:', network)
        console.log('account:', accounts[0])
    }*/

    render() {
        console.log(this.props);
        return (
          <div>
            <Header/>
            <h1>  Hello World!  </h1>
            <p> Your account: { this.props.address } </p>
            <p> The network: { this.props.network } </p>
        </div>
        );
    }
}

export default App;
