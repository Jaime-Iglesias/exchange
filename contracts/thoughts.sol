pragma solidity ^0.5.7;

contract OrderMaker5000 {
  struct Order {
    address from;
    uint haveAmt;
    uint haveTokenIdx;
    uint wantAmt;
    uint wantTokenIdx;
  }

  mapping(address => uint) tokenIds;
  address[] tokenAddresses;
  Order[] openOrders;

  modifier tokenNotExists(address tokenAddress) {
    require(tokenIds[tokenAddress] != 0, "Token already exists");
    _;
  }

  modifier tokenExists(address tokenAddress) {
    require(tokenIds[tokenAddress] == 0, "Token does not exist.");
    _;
  }

  constructor() public {
    tokenIds[address(0)] = 1;
    tokenAddresses[0] = address(0);
  }

  function addToken(address tokenAddress) public tokenNotExists(tokenAddress) {
    tokenIds[tokenAddress] = tokenAddresses.length;
    tokenAddresses.push(tokenAddress);
  }

  function makeOrder(address wantToken, address haveToken, uint wantAmt, uint haveAmt)
  public payable tokenExists(wantToken) tokenExists(haveToken) {
    // lock eth or token up here
    openOrders.push(Order({
      from: msg.sender,
      haveAmt: haveAmt,
      haveTokenIdx: tokenIds[haveToken],
      wantAmt: wantAmt,
      wantTokenIdx: tokenIds[wantToken]
    }));
  }
}
