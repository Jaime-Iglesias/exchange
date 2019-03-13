import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';

<<<<<<< HEAD
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

=======
class App extends Component {

    componentWillMount() {
        this.loadBlockchainData();
    }

    async loadBlockchainData() {
        const web3 = new Web3(Web3.giveProvider || "http://localhost:7545")
        const network = await web3.eth.net.getNetworkType()
        const accounts = await web3.eth.getAccounts()
        this.setState({ account: accounts[0] })
>>>>>>> master
        console.log('network:', network)
        console.log('account:', accounts[0])
    }

    constructor(props) {
            super(props)
<<<<<<< HEAD
            this.state = {
                network: -1,
                address: ''
            };
=======
            this.state =  {account: ''}
>>>>>>> master
    }

    render() {
        return (
<<<<<<< HEAD
          <div>
            <Header/>
            <h1>  Hello World!  </h1>
            <p> Your account: { this.state.address } </p>
            <p> The netWork: { this.state.network } </p>
=======
          <div className="container">
            <h1>  Hello World!  </h1>
            <p> Your account: { this.state.account } </p>
>>>>>>> master
          </div>
        );
    }
}

export default App;
