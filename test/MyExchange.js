const Exchange = artifacts.require('MyExchange.sol');
const Token = artifacts.require('TestingToken.sol');
const { constants, expectEvent, shouldFail } = require('openzeppelin-test-helpers');

contract ('Exchange', function (accounts) {

    beforeEach(async function () {
        this.exchange = await Exchange.new();
        this.token = await Token.new(100);
    });

    describe('depositToken', function() {
        describe('when the exchange has not been approved', function() {
            it('reverts', async function () {
                await shouldFail.reverting(this.exchange.depositToken(this.token.address, 50, {from: accounts[0]}));
            });
        });

        describe('when the exchange has been approved', function() {

            describe('when the sender does not have enough tokens', function() {
                it('reverts', async function() {

                });
            });

            describe('when the sender has enough tokens', function() {
                it('deposits the requested amount', async function() {

                });

                it('emits the deposit event', async function() {

                });
            });
        });
    });


    describe('withdrawToken', function() {
        describe('when sender does not have enough tokens to withdraw', function() {
            it('reverts', async function() {

            });
        });

        describe('when the sender has enough tokens to withdraw', function() {
            it('transfers the tokens back to the sender', async function() {

            });

            it('emits the withdraw event', async function() {

            });
        });
    });
});
