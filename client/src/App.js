import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';

class App extends Component {

    componentWillMount() {
        this.loadBlockchainData();
    }

    async loadBlockchainData() {
        const web3 = new Web3(Web3.giveProvider || "http://localhost:7545")
        const network = await web3.eth.net.getNetworkType()
        const accounts = await web3.eth.getAccounts()
        this.setState({ account: accounts[0] })
        console.log('network:', network)
        console.log('account:', accounts[0])
    }

    constructor(props) {
            super(props)
            this.state =  {account: ''}
    }

    render() {
        return (
          <div className="container">
            <h1>  Hello World!  </h1>
            <p> Your account: { this.state.account } </p>
          </div>
        );
    }
}

export default App;
