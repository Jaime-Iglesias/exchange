const Exchange = artifacts.require('MyExchange.sol');
const Token = artifacts.require('TestingToken.sol');
const { BN, constants, expectEvent, shouldFail, ether, balance } = require('openzeppelin-test-helpers');

contract ('Exchange', function (accounts) {

    const initialSupply = new BN(100);
    const transferAmount = new BN(50);
    const transferAmountFail = new BN(10000);
    const negativeTransferAmount = new BN(-1);
    const ethTransferAmount = ether('1');
    const ethTransferAmountFail = ether('200');
    const ethNegativeTransferAmount = ether('-1');
    const zeroAmount = new BN(0);
    const sender = accounts[0];

    beforeEach(async function () {
        this.exchange = await Exchange.new();
        this.token = await Token.new(initialSupply);
    });

    describe('depositToken', function() {
        describe('when the token address is the 0 address', function () {
            it('reverts', async function () {
                await shouldFail.reverting(this.exchange.depositToken(constants.ZERO_ADDRESS, transferAmount, { from: sender }));
            });
        });

        describe('when the token is not the 0 address', function () {
            describe('when the exchange has not been approved', function () {
                it('reverts', async function () {
                    await shouldFail.reverting(this.exchange.depositToken(this.token.address, transferAmount, { from: sender }));
                });
            });

            describe('when the exchange has been approved', function () {
                describe('when the sender does not have enough tokens', function () {
                    it('reverts', async function () {
                        await this.token.approve(this.exchange.address, transferAmount, { from: sender });

                        await shouldFail.reverting(this.exchange.depositToken(this.token.address, transferAmountFail, { from: sender }));
                    });
                });

                describe('when the sender has enough tokens', function () {
                    it('deposits the requested amount', async function () {
                        await this.token.approve(this.exchange.address, transferAmount, { from: sender });

                        await this.exchange.depositToken(this.token.address, transferAmount, { from: sender });

                        (await this.token.balanceOf(sender)).should.be.bignumber.equal(transferAmount);

                        (await this.token.balanceOf(this.exchange.address)).should.be.bignumber.equal(transferAmount);

                        const balance = await this.exchange.getUserBalanceForToken(this.token.address, { from: sender });

                        (balance[0]).should.be.bignumber.equal(transferAmount);

                        (balance[1]).should.be.bignumber.equal(zeroAmount);
                    });

                    it('emits the deposit event', async function () {
                        await this.token.approve(this.exchange.address, transferAmount, { from: sender });

                        const { logs } = await this.exchange.depositToken(this.token.address, transferAmount, { from: sender });

                        expectEvent.inLogs(logs, 'LogDepositToken', {
                            _token: this.token.address,
                            _user: sender,
                            _amount: transferAmount,
                        });
                    });
                });
            });
        });
    });

    describe('withdrawToken', function () {
        describe('when the token address is the 0 address', function () {
            it('reverts', async function () {
                await shouldFail.reverting(this.exchange.withdrawToken(constants.ZERO_ADDRESS, transferAmount, { from: sender }));
            });
        });

        describe('when the token address is not the 0 address', function () {
            describe('when sender does not have enough tokens to withdraw', function () {
                it('reverts', async function () {
                    await shouldFail.reverting(this.exchange.withdrawToken(this.token.address, transferAmountFail, { from: sender}));
                });
            });

            describe('when the sender has enough tokens to withdraw', function () {
                it('transfers the tokens back to the sender', async function () {
                    await this.token.approve(this.exchange.address, transferAmount, { from: sender });

                    await this.exchange.depositToken(this.token.address, transferAmount, { from: sender });

                    await this.exchange.withdrawToken(this.token.address, transferAmount, { from: sender});

                    (await this.token.balanceOf(sender)).should.be.bignumber.equal(initialSupply);

                    (await this.token.balanceOf(this.exchange.address)).should.be.bignumber.equal(zeroAmount);

                    const balanceUser = await this.exchange.getUserBalanceForToken(this.token.address, { from: sender });

                    (balanceUser[0]).should.be.bignumber.equal(zeroAmount);

                    (balanceUser[1]).should.be.bignumber.equal(zeroAmount);
                });

                it('emits the withdraw event', async function () {
                    await this.token.approve(this.exchange.address, transferAmount, { from: sender });

                    await this.exchange.depositToken(this.token.address, transferAmount, { from: sender });

                    const { logs } = await this.exchange.withdrawToken(this.token.address, transferAmount, { from: sender });

                    expectEvent.inLogs(logs, 'LogWithdrawToken', {
                        _token: this.token.address,
                        _user: sender,
                        _amount: transferAmount,
                    });
                });
            });
        });
    });

    describe('deposit', function () {
        describe('when sender tries to deposit more ETH than he currently owns', function() {
            it ('reverts', async function () {
                await shouldFail(this.exchange.deposit({
                    from: sender,
                    value: ethTransferAmountFail
                }));
            });
        });

        describe('when sender has enough ETH to send', function () {
            it('transfers ETH to the contract', async function () {

                const reciever = this.exchange.address;

                const initialBalanceSender = new BN(await balance.current(sender));

                const initialBalanceReceiver = new BN(await balance.current(reciever));

                await this.exchange.deposit({
                    from: sender,
                    value: ethTransferAmount,
                    gasPrice: 0
                });

                const currentBalanceSender = new BN(await balance.current(sender));

                const currentBalanceReceiver = new BN(await balance.current(reciever));

                currentBalanceSender.should.be.bignumber.equal(initialBalanceSender.sub(ethTransferAmount));

                currentBalanceReceiver.should.be.bignumber.equal(initialBalanceReceiver.add(ethTransferAmount));

                const balanceUser = await this.exchange.getUserBalanceForToken(constants.ZERO_ADDRESS, { from: sender });

                (balanceUser[0]).should.be.bignumber.equal(ethTransferAmount);

                (balanceUser[1]).should.be.bignumber.equal(zeroAmount);
            });

            it('emits the deposit event', async function () {
                const { logs } = await this.exchange.deposit({
                    from: sender,
                    value: ethTransferAmount,
                    gasPrice: 0
                });

                expectEvent.inLogs(logs, 'LogDepositToken', {
                    _token: constants.ZERO_ADDRESS,
                    _user: sender,
                    _amount: ethTransferAmount,
                });
            });
        });
    });

    describe('withdraw', function () {
        describe('when the sender does not have enough balance', function () {
            it('reverts', async function () {
                await shouldFail.reverting(this.exchange.withdraw(ethTransferAmountFail, {
                    from: sender
                }));
            });
        });

        describe('when the sender has enough balance', function () {
            it('transfers the ETH back to the sender', async function () {
                const reciever = this.exchange.address;

                await this.exchange.deposit({
                    from: sender,
                    value: ethTransferAmount,
                    gasPrice: 0
                });

                const initialBalanceSender = new BN(await balance.current(sender));

                const initialBalanceReceiver = new BN(await balance.current(reciever));

                await this.exchange.withdraw(ethTransferAmount, {
                    from: sender,
                    gasPrice: 0
                });

                const currentBalanceSender = new BN(await balance.current(sender));

                const currentBalanceReceiver = new BN(await balance.current(reciever));

                currentBalanceSender.should.be.bignumber.equal(initialBalanceSender.add(ethTransferAmount));

                currentBalanceReceiver.should.be.bignumber.equal(initialBalanceReceiver.sub(ethTransferAmount));

                const balanceUser = await this.exchange.getUserBalanceForToken(constants.ZERO_ADDRESS, { from: sender });

                (balanceUser[0]).should.be.bignumber.equal(zeroAmount);

                (balanceUser[1]).should.be.bignumber.equal(zeroAmount);
            });

            it('emits the withdraw event', async function () {
                await this.exchange.deposit({
                    from: sender,
                    value: ethTransferAmount
                });

                const { logs } = await this.exchange.withdraw(ethTransferAmount, {
                    from: sender
                });

                expectEvent.inLogs(logs, 'LogWithdrawToken', {
                    _token: constants.ZERO_ADDRESS,
                    _user: sender,
                    _amount: ethTransferAmount,
                });
            });
        });
    });

    describe('placeOrder', function() {
        describe('when the sender does not have enough balance', function () {
            it('reverts', async function() {

                const tokenGet = constants.ZERO_ADDRESS;
                const amountGet = ethTransferAmount;
                const tokenGive = this.token.address;
                const amountGive = transferAmount;
                const currentBlock = await web3.eth.getBlockNumber();
                const expiration = currentBlock + 2;
                const nonce = await web3.eth.getTransactionCount(sender);

                await shouldFail.reverting(this.exchange.placeOrder(tokenGet, amountGet, tokenGive, amountGive, expiration, nonce, {
                    from: sender
                }));
            });
        });

        describe('when the sender has enough balance', function() {
            it('creates a new order', async function () {

                const tokenGet = constants.ZERO_ADDRESS;
                const amountGet = ethTransferAmount;
                const tokenGive = this.token.address;
                const amountGive = transferAmount;

                await this.token.approve(this.exchange.address, transferAmount, { from: sender });

                await this.exchange.depositToken(tokenGive, amountGive, { from: sender });

                const currentBlock = new BN(await web3.eth.getBlockNumber());
                const nonce = new BN(await web3.eth.getTransactionCount(sender));

                await this.exchange.placeOrder(tokenGet, amountGet, tokenGive, amountGive, currentBlock, nonce, {
                    from: sender
                });

                const balanceUser = await this.exchange.getUserBalanceForToken(tokenGive, { from: sender });

                (balanceUser[0]).should.be.bignumber.equal(zeroAmount);

                (balanceUser[1]).should.be.bignumber.equal(amountGive);
            });

            it('emits a LogOrder event', async function () {

                const tokenGet = constants.ZERO_ADDRESS;
                const amountGet = ethTransferAmount;
                const tokenGive = this.token.address;
                const amountGive = transferAmount;

                await this.token.approve(this.exchange.address, transferAmount, { from: sender });

                await this.exchange.depositToken(tokenGive, amountGive, { from: sender });

                const currentBlock = new BN(await web3.eth.getBlockNumber());
                const nonce = new BN(await web3.eth.getTransactionCount(sender));

                const { logs } = await this.exchange.placeOrder(tokenGet, amountGet, tokenGive, amountGive, currentBlock, nonce, {
                    from: sender
                });

                expectEvent.inLogs(logs, 'LogOrder', {
                    _sender: sender,
                    _tokenMake: tokenGet,
                    _amountMake: amountGet,
                    _tokenTake: tokenGive,
                    _amountTake: amountGive,
                    _expirationBlock: currentBlock,
                    _nonce: nonce
                });
            });
        });
    });

    describe('cancelOrder', function () {
        describe('when the order does not exist', function () {
            it('reverts', async function () {
                const tokenGet = constants.ZERO_ADDRESS;
                const amountGet = ethTransferAmount;
                const tokenGive = this.token.address;
                const amountGive = transferAmount;
                const currentBlock = new BN(await web3.eth.getBlockNumber());
                const nonce = new BN(await web3.eth.getTransactionCount(sender));

                await shouldFail.reverting(this.exchange.cancelOrder(
                    tokenGet, amountGet,
                    tokenGive, amountGive,
                    currentBlock, nonce, {
                        from: sender
                }));
            });
        });

        describe('when the order exists', function () {
            it('fills up the order', async function () {

                const tokenGet = constants.ZERO_ADDRESS;
                const amountGet = ethTransferAmount;
                const tokenGive = this.token.address;
                const amountGive = transferAmount;

                await this.token.approve(this.exchange.address, transferAmount, { from: sender });

                await this.exchange.depositToken(tokenGive, amountGive, { from: sender });

                const currentBlock = new BN(await web3.eth.getBlockNumber());
                const nonce = new BN(await web3.eth.getTransactionCount(sender));

                await this.exchange.placeOrder(tokenGet, amountGet, tokenGive, amountGive, currentBlock, nonce, {
                    from: sender
                });

                await this.exchange.cancelOrder(
                    tokenGet, amountGet,
                    tokenGive, amountGive,
                    currentBlock, nonce, {
                        from: sender
                });

                const orderFilling = await this.exchange.getOrderFilling(
                    tokenGet, amountGet,
                    tokenGive, amountGive,
                    currentBlock, nonce, {
                        from: sender
                });

                orderFilling.should.be.bignumber.equal(amountGet);
            });

            it('emits the cancel event', async function () {
                const tokenGet = constants.ZERO_ADDRESS;
                const amountGet = ethTransferAmount;
                const tokenGive = this.token.address;
                const amountGive = transferAmount;

                await this.token.approve(this.exchange.address, transferAmount, { from: sender });

                await this.exchange.depositToken(tokenGive, amountGive, { from: sender });

                const currentBlock = new BN(await web3.eth.getBlockNumber());
                const nonce = new BN(await web3.eth.getTransactionCount(sender));

                await this.exchange.placeOrder(tokenGet, amountGet, tokenGive, amountGive, currentBlock, nonce, {
                    from: sender
                });

                const { logs } = await this.exchange.cancelOrder(tokenGet, amountGet, tokenGive, amountGive, currentBlock, nonce, {
                    from: sender
                });

                expectEvent.inLogs(logs, 'LogCancelOrder', {
                    _sender: sender,
                    _tokenMake: tokenGet,
                    _amountMake: amountGet,
                    _tokenTake: tokenGive,
                    _amountTake: amountGive,
                    _expirationBlock: currentBlock,
                    _nonce: nonce
                });
            });
        });
    });
});
