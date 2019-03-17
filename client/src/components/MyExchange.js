const MyExchange = {
    /*async depositToken(tokenAddress, amount) {

    }

    async withdrawToken(tokenAddress, amount) {

    }*/

    async getUserBalanceForToken(address, exchange, tokenAddress) {
        try {
            const balance = await exchange.methods.userBalanceForToken(address, tokenAddress).call({ from: address })
            return balance
        } catch (err) {
            console.log(err)
        }
    }
}

export default MyExchange;
