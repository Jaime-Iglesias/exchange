var MyExchange = artifacts.require("./MyExchange.sol");
var TestingToken = artifacts.require("./TestingToken.sol");

module.exports = function(deployer) {
  deployer.deploy(MyExchange).then(function() {
      var initialSupply = 1000;
      return deployer.deploy(TestingToken, initialSupply);
  });
};
