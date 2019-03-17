import React, { Component } from 'react';
import './App.css';
import Web3 from 'web3';

import Header from "./components/Header";
import Exchange from './contracts/MyExchange.json'
import TestingToken from './contracts/TestingToken.json'
import MyExchange from './components/MyExchange'

class App extends Component {

    constructor(props) {
        super(props)
        this.state ={
            provider: null,
            network: -1,
            address: '',
            contract: null,
            owner: '',
            token: null,
            loaded: false,
        }
    }

    componentWillMount() {
        this.loadBlockchainData();
    }

    async loadBlockchainData() {
        const web3 = new Web3(Web3.givenProvider || "http://localhost:7545")
        console.log(web3)
        const network = await web3.eth.net.getId()
        const accounts = await web3.eth.getAccounts()
        const exchange = new web3.eth.Contract(Exchange.abi, Exchange.networks[network].address)
        this.setState({ provider: web3, network, address: accounts[0], contract: exchange })
        const owner = await exchange.methods.owner().call()
        this.setState({ owner })
        const token = new web3.eth.Contract(TestingToken.abi, TestingToken.networks[network].address)
        this.setState({ token })
        const totalSupply = await token.methods.totalSupply().call()
        this.setState({ loaded: true })


        console.log('provider', web3)
        console.log('network:', network)
        console.log('account:', accounts[0])
        console.log('contract:', exchange)
        console.log('token:', token)
        console.log('totalSupply', totalSupply)
    }

    balanceForToken() {
        const {
            address,
            contract,
            token,
        } = this.state;
        MyExchange.getUserBalanceForToken(address, contract, token.options.address)
    }

    renderApp() {
        if (this.state.loaded === false) {
            return;
        } else {
            return(
                <div>
                    <Header/>
                    <h1>  Hello World!  </h1>
                    <p> Your account: { this.state.address } </p>
                    <p> The network: { this.state.network } </p>
                    <p> Contract owner: { this.state.owner }</p>
                    <p> User balance for Token: { this.balanceForToken() }</p>
                </div>
            )
        }
    }

    render() {
        return(
          <div> { this.renderApp() } </div>
        );
    }
}

export default App;
