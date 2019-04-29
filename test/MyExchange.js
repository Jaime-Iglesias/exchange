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
    const owner = accounts[0];
    const caller = accounts[1];

    beforeEach(async function () {
        this.exchange = await Exchange.new();
        this.token = await Token.new(initialSupply);
    });

    describe('addToken', function () {
        describe('when the caller is not the contract owner', function () {
            it('reverts', async function () {
                await shouldFail.reverting(this.exchange.addToken(this.token.address, { from: caller }));
            });
        });
        describe('when the caller is the contract owner', function () {
            describe('when the token already exists', function () {
                it('reverts', async function () {
                    await shouldFail.reverting(this.exchange.addToken(constants.ZERO_ADDRESS, { from: owner }));
                });
            });
            describe('when the token does not exist', function () {
                it('adds the token to the list', async function () {
                    await this.exchange.addToken(this.token.address, { from: owner });

                    tokenId = await this.exchange.getTokenId(this.token.address, { from: owner });

                    (tokenId).should.be.bignumber.equal(new BN(2));

                    tokenAddress = await this.exchange.getTokenAddress(tokenId, { from: owner});

                    tokenAddress.should.be.equal(this.token.address);
                });
            });
        });
    });

    describe('depositToken', function() {
        describe('when the token address is the 0 address', function () {
            it('reverts', async function () {
                await shouldFail.reverting(this.exchange.depositToken(constants.ZERO_ADDRESS, transferAmount));
            });
        });
        describe('when the token is not the 0 address', function () {
            describe('when the token does not exist', function () {
                it('reverts', async function () {
                    await shouldFail.reverting(this.exchange.depositToken(this.token.address, transferAmount));
                });
            });
            describe('when the token exists', function () {
                describe('when the exchange has not been approved', function () {
                    it('reverts', async function () {
                        await this.exchange.addToken(this.token.address, { from: owner });

                        await shouldFail.reverting(this.exchange.depositToken(this.token.address, transferAmount));
                    });
                });
                describe('when the exchange has been approved', function () {
                    describe('when the sender does not have enough tokens', function () {
                        it('reverts', async function () {
                            await this.exchange.addToken(this.token.address, { from: owner });

                            await this.token.approve(this.exchange.address, transferAmount);

                            await shouldFail.reverting(this.exchange.depositToken(this.token.address, transferAmountFail));
                        });
                    });
                    describe('when the sender has enough tokens', function () {
                        it('deposits the requested amount', async function () {
                            await this.exchange.addToken(this.token.address, { from: owner });

                            await this.token.approve(this.exchange.address, transferAmount);

                            await this.exchange.depositToken(this.token.address, transferAmount);

                            (await this.token.balanceOf(owner)).should.be.bignumber.equal(transferAmount);

                            (await this.token.balanceOf(this.exchange.address)).should.be.bignumber.equal(transferAmount);

                            const balance = await this.exchange.getUserBalanceForToken(this.token.address);

                            (new BN(balance.available)).should.be.bignumber.equal(transferAmount);

                            (new BN(balance.locked)).should.be.bignumber.equal(zeroAmount);
                        });
                        it('emits the deposit event', async function () {
                            await this.exchange.addToken(this.token.address, { from: owner });

                            await this.token.approve(this.exchange.address, transferAmount);

                            const { logs } = await this.exchange.depositToken(this.token.address, transferAmount);

                            expectEvent.inLogs(logs, 'LogDepositToken', {
                                _token: this.token.address,
                                _user: owner,
                                _amount: transferAmount,
                            });
                        });
                    });
                });
            });
        });
    });

    describe('withdrawToken', function () {
        describe('when the token address is the 0 address', function () {
            it('reverts', async function () {
                await shouldFail.reverting(this.exchange.withdrawToken(constants.ZERO_ADDRESS, transferAmount));
            });
        });
        describe('when the token address is not the 0 address', function () {
            describe('when the token does not exist', function () {
                it('reverts', async function () {
                    await shouldFail.reverting(this.exchange.withdrawToken(this.token.address, transferAmount));
                });
            });
            describe('when the token exists', function () {
                describe('when sender does not have enough tokens to withdraw', function () {
                    it('reverts', async function () {
                        await this.exchange.addToken(this.token.address, { from: owner });

                        await shouldFail.reverting(this.exchange.withdrawToken(this.token.address, transferAmountFail));
                    });
                });
                describe('when the sender has enough tokens to withdraw', function () {
                    it('transfers the tokens back to the sender', async function () {
                        await this.exchange.addToken(this.token.address, { from: owner });

                        await this.token.approve(this.exchange.address, transferAmount);

                        await this.exchange.depositToken(this.token.address, transferAmount);

                        await this.exchange.withdrawToken(this.token.address, transferAmount);

                        (await this.token.balanceOf(owner)).should.be.bignumber.equal(initialSupply);

                        (await this.token.balanceOf(this.exchange.address)).should.be.bignumber.equal(zeroAmount);

                        const balance = await this.exchange.getUserBalanceForToken(this.token.address);

                        (new BN(balance.available)).should.be.bignumber.equal(zeroAmount);

                        (new BN(balance.locked)).should.be.bignumber.equal(zeroAmount);
                    });
                    it('emits the withdraw event', async function () {
                        await this.exchange.addToken(this.token.address, { from: owner });

                        await this.token.approve(this.exchange.address, transferAmount);

                        await this.exchange.depositToken(this.token.address, transferAmount);

                        const { logs } = await this.exchange.withdrawToken(this.token.address, transferAmount);

                        expectEvent.inLogs(logs, 'LogWithdrawToken', {
                            _token: this.token.address,
                            _user: owner,
                            _amount: transferAmount,
                        });
                    });
                });
            });
        });
    });

    describe('deposit', function () {
        describe('when sender tries to deposit more ETH than he currently owns', function() {
            it ('reverts', async function () {
                await shouldFail(this.exchange.deposit({
                    value: ethTransferAmountFail
                }));
            });
        });
        describe('when sender has enough ETH to send', function () {
            it('transfers ETH to the contract', async function () {
                const reciever = this.exchange.address;

                const initialBalanceSender = new BN(await balance.current(owner));

                const initialBalanceReceiver = new BN(await balance.current(reciever));

                await this.exchange.deposit({
                    value: ethTransferAmount,
                    gasPrice: 0
                });

                const currentBalanceSender = new BN(await balance.current(owner));

                const currentBalanceReceiver = new BN(await balance.current(reciever));

                currentBalanceSender.should.be.bignumber.equal(initialBalanceSender.sub(ethTransferAmount));

                currentBalanceReceiver.should.be.bignumber.equal(initialBalanceReceiver.add(ethTransferAmount));

                const balanceUser = await this.exchange.getUserBalanceForToken(constants.ZERO_ADDRESS);

                (new BN(balanceUser.available)).should.be.bignumber.equal(ethTransferAmount);

                (new BN(balanceUser.locked)).should.be.bignumber.equal(zeroAmount);
            });
            it('emits the deposit event', async function () {
                const { logs } = await this.exchange.deposit({
                    value: ethTransferAmount,
                    gasPrice: 0
                });

                expectEvent.inLogs(logs, 'LogDepositToken', {
                    _token: constants.ZERO_ADDRESS,
                    _user: owner,
                    _amount: ethTransferAmount,
                });
            });
        });
    });

    describe('withdraw', function () {
        describe('when the sender does not have enough balance', function () {
            it('reverts', async function () {
                await shouldFail.reverting(this.exchange.withdraw(ethTransferAmountFail));
            });
        });
        describe('when the sender has enough balance', function () {
            it('transfers the ETH back to the sender', async function () {
                const reciever = this.exchange.address;

                await this.exchange.deposit({
                    value: ethTransferAmount,
                    gasPrice: 0
                });

                const initialBalanceSender = new BN(await balance.current(owner));

                const initialBalanceReceiver = new BN(await balance.current(reciever));

                await this.exchange.withdraw(ethTransferAmount, {
                    gasPrice: 0
                });

                const currentBalanceSender = new BN(await balance.current(owner));

                const currentBalanceReceiver = new BN(await balance.current(reciever));

                currentBalanceSender.should.be.bignumber.equal(initialBalanceSender.add(ethTransferAmount));

                currentBalanceReceiver.should.be.bignumber.equal(initialBalanceReceiver.sub(ethTransferAmount));

                const balanceUser = await this.exchange.getUserBalanceForToken(constants.ZERO_ADDRESS);

                (new BN(balanceUser.available)).should.be.bignumber.equal(zeroAmount);

                (new BN(balanceUser.locked)).should.be.bignumber.equal(zeroAmount);
            });
            it('emits the withdraw event', async function () {
                await this.exchange.deposit({
                    value: ethTransferAmount
                });

                const { logs } = await this.exchange.withdraw(ethTransferAmount);

                expectEvent.inLogs(logs, 'LogWithdrawToken', {
                    _token: constants.ZERO_ADDRESS,
                    _user: owner,
                    _amount: ethTransferAmount,
                });
            });
        });
    });

    describe('placeOrder', function () {
        describe('when any of the tokens does not exist', function () {
            it('reverts', async function () {
                const tokenHave = constants.ZERO_ADDRESS;
                const amountHave = ethTransferAmount;
                const tokenWant = this.token.address;
                const amountWant = transferAmount;

                await shouldFail.reverting(this.exchange.placeOrder(tokenHave, amountHave, tokenWant, amountWant));
            });
        });
        describe('when both tokens exist', function () {
            describe('when haveToken is the 0 address', function () {
                describe('when the sender does not have enough balance available', function () {
                    describe('when balance available + msg.value is not enough', function () {
                        it('reverts', async function () {
                            const tokenHave = constants.ZERO_ADDRESS;
                            const amountHave = ethTransferAmountFail;
                            const tokenWant = this.token.address;
                            const amountWant = transferAmount;

                            await this.exchange.addToken(this.token.address, { from: owner });

                            await shouldFail.reverting(this.exchange.placeOrder(tokenHave, amountHave, tokenWant, amountWant, {
                                value: 0
                            }));
                        });
                    });
                    describe('when balance available + msg.value is enough', function () {
                        describe('when balance available + msg.value is bigger than haveAmount', function () {
                            it('updates available balance, sends the excess back to the sender and places the order', async function () {
                                const tokenHave = constants.ZERO_ADDRESS;
                                const amountHave = ether('2');
                                const tokenWant = this.token.address;
                                const amountWant = transferAmount;

                                const available = ether('1');
                                const msgValue = ether('3');

                                const reciever = this.exchange.address;

                                await this.exchange.addToken(this.token.address, { from: owner });

                                await this.exchange.deposit({
                                    value: available,
                                    gasPrice: 0
                                });

                                const initialBalanceSender = new BN(await balance.current(owner));

                                const initialBalanceReceiver = new BN(await balance.current(reciever));

                                await this.exchange.placeOrder(tokenHave, amountHave, tokenWant, amountWant, {
                                    value: msgValue,
                                    gasPrice: 0
                                });

                                const currentBalanceSender = new BN(await balance.current(owner));

                                const currentBalanceReceiver = new BN(await balance.current(reciever));

                                const sent = (amountHave.sub(available));

                                initialBalanceSender.should.be.bignumber.equal(currentBalanceSender.add(sent));

                                currentBalanceReceiver.should.be.bignumber.equal(initialBalanceReceiver.add(sent));

                                const balanceUser = await this.exchange.getUserBalanceForToken(constants.ZERO_ADDRESS);

                                (new BN(balanceUser.available)).should.be.bignumber.equal(zeroAmount);

                                (new BN(balanceUser.locked)).should.be.bignumber.equal(amountHave);

                                const order = await this.exchange.getOrder(0);
                                const haveTokenId = await this.exchange.getTokenId(tokenHave);
                                const wantTokenId = await this.exchange.getTokenId(tokenWant);

                                (order.orderMaker).should.be.equal(owner);
                                (new BN(order.haveTokenId)).should.be.bignumber.equal(haveTokenId);
                                (new BN(order.haveAmount)).should.be.bignumber.equal(amountHave);
                                (new BN(order.wantTokenId)).should.be.bignumber.equal(wantTokenId);
                                (new BN(order.wantAmount)).should.be.bignumber.equal(amountWant);
                            });
                            it('emits the LogOrder event', async function () {
                                const tokenHave = constants.ZERO_ADDRESS;
                                const amountHave = ether('2');
                                const tokenWant = this.token.address;
                                const amountWant = transferAmount;

                                const available = ether('1');
                                const msgValue = ether('3');

                                const reciever = this.exchange.address;

                                await this.exchange.addToken(this.token.address, { from: owner });

                                await this.exchange.deposit({
                                    value: available,
                                    gasPrice: 0
                                });

                                const initialBalanceSender = new BN(await balance.current(owner));

                                const initialBalanceReceiver = new BN(await balance.current(reciever));

                                const { logs } = await this.exchange.placeOrder(tokenHave, amountHave, tokenWant, amountWant, {
                                    value: msgValue,
                                    gasPrice: 0
                                });

                                const order = await this.exchange.getOrder(0);

                                expectEvent.inLogs(logs, 'LogOrder', {
                                    _orderMaker: order.orderMaker,
                                    _haveTokenId: order.haveTokenId,
                                    _haveAmount: order.haveAmount,
                                    _wantTokenId: order.wantTokenId,
                                    _wantAmount: order.wantAmount,
                                    _creationBlock: order.creationBlock
                                });
                            });
                        });
                    });
                });
                describe('when the sender has enough balance available', function () {
                    it('places the order', async function () {
                        const tokenHave = constants.ZERO_ADDRESS;
                        const amountHave = ether('2');
                        const tokenWant = this.token.address;
                        const amountWant = transferAmount;

                        const available = ether('2');
                        const msgValue = ether('0');

                        const reciever = this.exchange.address;

                        await this.exchange.addToken(this.token.address, { from: owner });

                        await this.exchange.deposit({
                            value: available,
                            gasPrice: 0
                        });

                        const initialBalanceSender = new BN(await balance.current(owner));

                        const initialBalanceReceiver = new BN(await balance.current(reciever));

                        await this.exchange.placeOrder(tokenHave, amountHave, tokenWant, amountWant, {
                            value: msgValue,
                            gasPrice: 0
                        });

                        const currentBalanceSender = new BN(await balance.current(owner));

                        const currentBalanceReceiver = new BN(await balance.current(reciever));

                        const sent = (amountHave.sub(available));

                        initialBalanceSender.should.be.bignumber.equal(currentBalanceSender.add(sent));

                        currentBalanceReceiver.should.be.bignumber.equal(initialBalanceReceiver.add(sent));

                        const balanceUser = await this.exchange.getUserBalanceForToken(constants.ZERO_ADDRESS);

                        (new BN(balanceUser.available)).should.be.bignumber.equal(zeroAmount);

                        (new BN(balanceUser.locked)).should.be.bignumber.equal(amountHave);

                        const order = await this.exchange.getOrder(0);
                        const haveTokenId = await this.exchange.getTokenId(tokenHave);
                        const wantTokenId = await this.exchange.getTokenId(tokenWant);

                        (order.orderMaker).should.be.equal(owner);
                        (new BN(order.haveTokenId)).should.be.bignumber.equal(haveTokenId);
                        (new BN(order.haveAmount)).should.be.bignumber.equal(amountHave);
                        (new BN(order.wantTokenId)).should.be.bignumber.equal(wantTokenId);
                        (new BN(order.wantAmount)).should.be.bignumber.equal(amountWant);
                    });
                    it('emits the LogOrder event', async function () {
                        const tokenHave = constants.ZERO_ADDRESS;
                        const amountHave = ether('2');
                        const tokenWant = this.token.address;
                        const amountWant = transferAmount;

                        const available = ether('2');
                        const msgValue = ether('0');

                        const reciever = this.exchange.address;

                        await this.exchange.addToken(this.token.address, { from: owner });

                        await this.exchange.deposit({
                            value: available,
                            gasPrice: 0
                        });

                        const { logs } = await this.exchange.placeOrder(tokenHave, amountHave, tokenWant, amountWant);

                        const order = await this.exchange.getOrder(0);

                        expectEvent.inLogs(logs, 'LogOrder', {
                            _orderMaker: order.orderMaker,
                            _haveTokenId: order.haveTokenId,
                            _haveAmount: order.haveAmount,
                            _wantTokenId: order.wantTokenId,
                            _wantAmount: order.wantAmount,
                            _creationBlock: order.creationBlock
                        });

                    });
                });
            });
            describe('when haveToken is not the 0 address', function () {
                describe('when the sender does not have enough balance available', function () {
                    describe('when balance available + allowance is not enough', function () {
                        it('reverts', async function () {
                            const tokenHave = this.token.address;
                            const amountHave = transferAmountFail;
                            const tokenWant = constants.ZERO_ADDRESS;
                            const amountWant = ethTransferAmount;

                            await this.exchange.addToken(this.token.address, { from: owner });

                            await shouldFail.reverting(this.exchange.placeOrder(tokenHave, amountHave, tokenWant, amountWant));
                        });
                    });
                    describe('when balance available + allowance is enough', function () {
                        it('updates available balance with the exact amount needed and places the order', async function () {
                            const tokenHave = this.token.address;
                            const amountHave = transferAmount;
                            const tokenWant = constants.ZERO_ADDRESS;
                            const amountWant = ethTransferAmount;

                            const initialAllowance = new BN(55);

                            const depositAmount = new BN(40);

                            await this.exchange.addToken(this.token.address, { from: owner });

                            await this.token.approve(this.exchange.address, initialAllowance);

                            await this.exchange.depositToken(this.token.address, depositAmount);

                            await this.exchange.placeOrder(tokenHave, amountHave, tokenWant, amountWant);

                            const balance = await this.exchange.getUserBalanceForToken(this.token.address);

                            const finalAllowance = await this.token.allowance(owner, this.exchange.address);

                            (finalAllowance).should.be.bignumber.equal(initialAllowance.sub(amountHave));

                            const available = new BN(balance.available);
                            (available).should.be.bignumber.equal(zeroAmount);

                            const locked = new BN(balance.locked);
                            (locked).should.be.bignumber.equal(amountHave);

                            const order = await this.exchange.getOrder(0);
                            const haveTokenId = await this.exchange.getTokenId(tokenHave);
                            const wantTokenId = await this.exchange.getTokenId(tokenWant);

                            (order.orderMaker).should.be.equal(owner);
                            (new BN(order.haveTokenId)).should.be.bignumber.equal(haveTokenId);
                            (new BN(order.haveAmount)).should.be.bignumber.equal(amountHave);
                            (new BN(order.wantTokenId)).should.be.bignumber.equal(wantTokenId);
                            (new BN(order.wantAmount)).should.be.bignumber.equal(amountWant);
                        });
                        it('emits the logOrder vent', async function () {
                            const tokenHave = this.token.address;
                            const amountHave = transferAmount;
                            const tokenWant = constants.ZERO_ADDRESS;
                            const amountWant = ethTransferAmount;

                            const initialAllowance = new BN(55);

                            const depositAmount = new BN(40);

                            await this.exchange.addToken(this.token.address, { from: owner });

                            await this.token.approve(this.exchange.address, initialAllowance);

                            await this.exchange.depositToken(this.token.address, depositAmount);

                            const { logs } = await this.exchange.placeOrder(tokenHave, amountHave, tokenWant, amountWant);

                            const balance = await this.exchange.getUserBalanceForToken(this.token.address);

                            const finalAllowance = await this.token.allowance(owner, this.exchange.address);

                            (finalAllowance).should.be.bignumber.equal(initialAllowance.sub(amountHave));

                            const available = new BN(balance.available);
                            (available).should.be.bignumber.equal(zeroAmount);

                            const locked = new BN(balance.locked);
                            (locked).should.be.bignumber.equal(amountHave);

                            const order = await this.exchange.getOrder(0);

                            expectEvent.inLogs(logs, 'LogOrder', {
                                _orderMaker: order.orderMaker,
                                _haveTokenId: order.haveTokenId,
                                _haveAmount: order.haveAmount,
                                _wantTokenId: order.wantTokenId,
                                _wantAmount: order.wantAmount,
                                _creationBlock: order.creationBlock
                            });
                        });
                    });
                });
                describe('when the sender has enough balance available', function () {
                    it('updates balance and places the order', async function () {
                        const tokenHave = this.token.address;
                        const amountHave = transferAmount;
                        const tokenWant = constants.ZERO_ADDRESS;
                        const amountWant = ethTransferAmount;

                        const initialAllowance = amountHave;

                        const depositAmount = amountHave;

                        await this.exchange.addToken(this.token.address, { from: owner });

                        await this.token.approve(this.exchange.address, initialAllowance);

                        await this.exchange.depositToken(this.token.address, depositAmount);

                        await this.exchange.placeOrder(tokenHave, amountHave, tokenWant, amountWant);

                        const balance = await this.exchange.getUserBalanceForToken(this.token.address);

                        const finalAllowance = await this.token.allowance(owner, this.exchange.address);

                        (finalAllowance).should.be.bignumber.equal(zeroAmount);

                        const available = new BN(balance.available);
                        (available).should.be.bignumber.equal(zeroAmount);

                        const locked = new BN(balance.locked);
                        (locked).should.be.bignumber.equal(amountHave);

                        const order = await this.exchange.getOrder(0);
                        const haveTokenId = await this.exchange.getTokenId(tokenHave);
                        const wantTokenId = await this.exchange.getTokenId(tokenWant);

                        (order.orderMaker).should.be.equal(owner);
                        (new BN(order.haveTokenId)).should.be.bignumber.equal(haveTokenId);
                        (new BN(order.haveAmount)).should.be.bignumber.equal(amountHave);
                        (new BN(order.wantTokenId)).should.be.bignumber.equal(wantTokenId);
                        (new BN(order.wantAmount)).should.be.bignumber.equal(amountWant);
                    });
                    it('emits the LogOrder event', async function () {
                        const tokenHave = this.token.address;
                        const amountHave = transferAmount;
                        const tokenWant = constants.ZERO_ADDRESS;
                        const amountWant = ethTransferAmount;

                        const initialAllowance = amountHave;

                        const depositAmount = amountHave;

                        await this.exchange.addToken(this.token.address, { from: owner });

                        await this.token.approve(this.exchange.address, initialAllowance);

                        await this.exchange.depositToken(this.token.address, depositAmount);

                        const { logs } = await this.exchange.placeOrder(tokenHave, amountHave, tokenWant, amountWant);

                        const order = await this.exchange.getOrder(0);

                        expectEvent.inLogs(logs, 'LogOrder', {
                            _orderMaker: order.orderMaker,
                            _haveTokenId: order.haveTokenId,
                            _haveAmount: order.haveAmount,
                            _wantTokenId: order.wantTokenId,
                            _wantAmount: order.wantAmount,
                            _creationBlock: order.creationBlock
                        });
                    });
                });
            });
        });
    });

    describe('cancelOrder', function () {
        describe('when the order does not exist', function () {
            it('reverts', async function () {
                const tokenHave = this.token.address;
                const amountHave = transferAmount;
                const tokenWant = constants.ZERO_ADDRESS;
                const amountWant = ethTransferAmount;

                const initialAllowance = amountHave;

                const depositAmount = amountHave;

                await this.exchange.addToken(this.token.address);

                await this.token.approve(this.exchange.address, initialAllowance);

                await this.exchange.depositToken(this.token.address, depositAmount);

                await this.exchange.placeOrder(tokenHave, amountHave, tokenWant, amountWant);

                await shouldFail.reverting(this.exchange.cancelOrder(1));
            });
        });
        describe('when the order does exist', function () {
            describe('when the caller is not the order maker', function () {
                it('reverts', async function () {
                    const tokenHave = this.token.address;
                    const amountHave = transferAmount;
                    const tokenWant = constants.ZERO_ADDRESS;
                    const amountWant = ethTransferAmount;

                    const initialAllowance = amountHave;

                    const depositAmount = amountHave;

                    await this.exchange.addToken(this.token.address);

                    await this.token.approve(this.exchange.address, initialAllowance);

                    await this.exchange.depositToken(this.token.address, depositAmount);

                    await this.exchange.placeOrder(tokenHave, amountHave, tokenWant, amountWant);

                    await shouldFail.reverting(this.exchange.cancelOrder(0, { from: caller }));
                });
            });
            describe('when the order has expired', function () {
                it('reverts', async function () {
                    const tokenHave = this.token.address;
                    const amountHave = transferAmount;
                    const tokenWant = constants.ZERO_ADDRESS;
                    const amountWant = ethTransferAmount;

                    const initialAllowance = amountHave;

                    const depositAmount = amountHave;

                    await this.exchange.addToken(this.token.address);

                    await this.token.approve(this.exchange.address, initialAllowance);

                    await this.exchange.depositToken(this.token.address, depositAmount);

                    await this.exchange.placeOrder(tokenHave, amountHave, tokenWant, amountWant);

                    await this.exchange.setExpiration(1);

                    await shouldFail.reverting(this.exchange.cancelOrder(0));
                });
            });
            describe('when the order has not expired yet', function () {
                it('deletes the order', async function () {
                    const tokenHave = this.token.address;
                    const amountHave = transferAmount;
                    const tokenWant = constants.ZERO_ADDRESS;
                    const amountWant = ethTransferAmount;

                    const initialAllowance = amountHave;

                    const depositAmount = amountHave;

                    await this.exchange.addToken(this.token.address);

                    await this.token.approve(this.exchange.address, initialAllowance);

                    await this.exchange.depositToken(this.token.address, depositAmount);

                    await this.exchange.placeOrder(tokenHave, amountHave, tokenWant, amountWant);

                    await this.exchange.cancelOrder(0);

                    await shouldFail.reverting(this.exchange.getOrder(0))
                });
                it('emits the cancel event', async function () {
                    const tokenHave = this.token.address;
                    const amountHave = transferAmount;
                    const tokenWant = constants.ZERO_ADDRESS;
                    const amountWant = ethTransferAmount;

                    const initialAllowance = amountHave;

                    const depositAmount = amountHave;

                    await this.exchange.addToken(this.token.address);

                    await this.token.approve(this.exchange.address, initialAllowance);

                    await this.exchange.depositToken(this.token.address, depositAmount);

                    await this.exchange.placeOrder(tokenHave, amountHave, tokenWant, amountWant);

                    const order = await this.exchange.getOrder(0);

                    const { logs } = await this.exchange.cancelOrder(0);

                    await shouldFail.reverting(this.exchange.getOrder(0))

                    expectEvent.inLogs(logs, 'LogCancelOrder', {
                        _orderMaker: order.orderMaker,
                        _haveTokenId: order.haveTokenId,
                        _haveAmount: order.haveAmount,
                        _wantTokenId: order.wantTokenId,
                        _wantAmount: order.wantAmount,
                        _creationBlock: order.creationBlock
                    });

                });
            });
        });
    });
});
