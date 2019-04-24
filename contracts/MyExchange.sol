pragma solidity 0.5.2;

import "./SafeMath.sol";
import "./IERC20.sol";
import "./Ownable.sol";

contract  MyExchange is Ownable {

    using SafeMath for uint256;

    event LogDepositToken(
        address indexed _user,
        address indexed _token,
        uint256 _amount
    );

    event LogWithdrawToken(
        address indexed _user,
        address indexed _token,
        uint256 _amount
    );

    event LogOrder(
        address _maker,
        uint256 _wantTokenId,
        uint256 _wantAmount,
        uint256 _giveTokenId,
        uint256 _giveAmount,
        uint256 _expiration,
        uint256 _nonce
    );

    event LogCancelOrder(
        address _maker,
        uint256 _wantTokenId,
        uint256 _wantAmount,
        uint256 _giveTokenId,
        uint256 _giveAmount,
        uint256 _nonce
    );

    struct Balance {
        uint256 available;
        uint256 locked;
    }

    struct Order {
        address orderMaker;
        uint256 haveTokenId;
        uint256 haveAmount;
        uint256 wantTokenId;
        uint256 wantAmount;
        uint256 expiration;
        uint256 nonce;
    }

    mapping (address => uint256) tokenIds;
    address[] tokenAddresses;
    mapping (address => mapping (address => Balance) ) public userBalanceForToken;
    Order[] openOrders;

    constructor() public {
        tokenIds[address(0)] = 1;
        tokenAddresses[0] = address(0);
    }

    modifier tokenNotExists(address _tokenAddress) {
        require(tokenIds[_tokenAddress] != 0, "Token already exists");
        _;
    }

    modifier tokenExists(address _tokenAddress) {
        require(tokenIds[_tokenAddress] == 0, "Token does not exist");
        _;
    }

    function addToken(address _tokenAddress) external onlyOwner tokenNotExists(_tokenAddress) {
        tokenIds[_tokenAddress] = tokenAddresses.length;
        tokenAddresses.push(_tokenAddress);
    }

    /// Function to receive ETH
    /// Allows the contract to manage the Ether the user deposits
    /// Triggers deposit event.
    function deposit() external payable {
        Balance storage b = userBalanceForToken[address(0)][msg.sender];
        b.available = b.available.add(msg.value);
        emit LogDepositToken(msg.sender, address(0), msg.value);
    }

    /// Function to withdraw ETH
    /// msg.sender withdraws _amount ETH from the contract
    /// triggers withdraw event
    function withdraw(uint256 _amount) external {
        Balance storage b = userBalanceForToken[address(0)][msg.sender];
        require(b.available >= _amount, "not enough balance available");
        b.available = b.available.sub(_amount);
        msg.sender.transfer(_amount);
        emit LogWithdrawToken(msg.sender, address(0), _amount);
    }

    /// Function to send _amount of specific _token to contract
    /// This allows the contrct to spend _amount tokens on your behalf.
    /// msg.sender has to call approve on this contract first.
    /// triggers DepositToken event.
    function depositToken(address _token, uint256 _amount) external {
        require(_token != address(0), "address cannot be the 0 address");
        require(IERC20(_token).transferFrom(msg.sender, address(this), _amount), "ERC20 transfer failed");
        Balance storage b = userBalanceForToken[_token][msg.sender];
        b.available = b.available.add(_amount);
        emit LogDepositToken(msg.sender, _token, _amount);
    }

    /// function to withdraw _amount of specific _token from contract
    /// triggers WithdrawToken event
    function withdrawToken(address _token, uint256 _amount) external {
        require(_token != address(0), "address cannot be the 0 address");
        Balance storage b = userBalanceForToken[_token][msg.sender];
        require(b.available >= _amount, "not enough balance available");
        b.available = b.available.sub(_amount);
        require(IERC20(_token).transfer(msg.sender, _amount), "ERC20 transfer failed");
        emit LogWithdrawToken(msg.sender, _token, _amount);
    }

    function placeOrder(address _wantToken, uint256 _wantAmount, address _haveToken, uint256 _haveAmount, uint256 _expirationBlock, uint256 _nonce)
    external tokenExists(_wantToken) tokenExists(_haveToken) {
        Balance storage b = userBalanceForToken[_haveToken][msg.sender];
        require(b.available >= _haveAmount, "not enough balance available");
        b.available = b.available.sub(_haveAmount);
        b.locked = b.locked.add(_haveAmount);
        openOrders.push(Order({
            orderMaker: msg.sender,
            haveTokenId: tokenIds[_haveToken],
            haveAmount: _haveAmount,
            wantTokenId: tokenIds[_wantToken],
            wantAmount: _wantAmount,
            expiration: _expirationBlock,
            nonce: _nonce
        }));
        emit LogOrder(msg.sender, tokenIds[_haveToken], _haveAmount, tokenIds[_wantToken], _wantAmount, _expirationBlock, _nonce)
    }

    function cancelOrder(address _wantToken, uint256 _wantAmount, address _haveToken, uint256 _haveAmount, uint256 _expirationBlock, uint256 _nonce) external {
        //if the orders exists -> cancel it by deleting it from the openOrders
    }

    function executeOrder(address _tokenMake, uint256 _amountMake, address _tokenTake, uint256 _amountTake, uint256 _expirationBlock, uint256 _nonce) external {
        //if the order exists -> start executing the order
    }

    /// function to get the amount of tokens of _token type a user has
    function balanceOf(address _token) public view returns (uint256) {
        return (IERC20(_token).balanceOf(msg.sender));
    }

    /// function to get the amount of tokens of _token type msg.sender has inside the contract
    function getUserBalanceForToken(address _token) public view returns (uint256 available, uint256 locked) {
        Balance storage b = userBalanceForToken[_token][msg.sender];
        return (b.available, b.locked);
    }

    function getOpenOrders() public view returns (Order[]) {
        Order[] memory o = new Order[](openOrders.length);
        for(uint256 i = 0; i < openOrders.length; i++) {
            o[i] = openOrders[i];
        }
        return o;
    }
}
