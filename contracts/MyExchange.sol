pragma solidity 0.5.2;

import "./SafeMath.sol";
import "./IERC20.sol";
import "./Ownable.sol";


contract  MyExchange is Ownable {

    using SafeMath for uint256;

    event LogDepositToken(address indexed _token, address indexed _user, uint256 _amount);
    event LogWithdrawToken(address indexed _token, address indexed _user, uint256 _amount);
    event LogOrder(address indexed _sender, address indexed _tokenMake, uint256 _amountMake, address _tokenTake, uint256 _amountTake, uint256 _expirationBlock, uint256 _nonce);
    event LogCancelOrder(address indexed _sender, address indexed _tokenMake, uint256 _amountMake, address _tokenTake, uint256 _amountTake, uint256 _expirationBlock, uint256 _nonce);

    struct Balance {
        uint256 available;
        uint256 locked;
    }

    struct OrderInfo {
        bool exists;
        uint256 fill;
    }

    mapping (address => mapping (address => Balance) ) public userBalanceForToken;
    mapping (address => mapping (bytes32 => OrderInfo) ) public userOrders;

    constructor() public {
    }

    /// Function to receive ETH
    /// Allows the contract to manage the Ether the user deposits
    /// Triggers deposit event.
    function deposit() external payable {
        Balance storage b = userBalanceForToken[address(0)][msg.sender];
        b.available = b.available.add(msg.value);
        emit LogDepositToken(address(0), msg.sender, msg.value);
    }

    /// Function to withdraw ETH
    /// msg.sender withdraws _amount ETH from the contract
    /// triggers withdraw event
    function withdraw(uint256 _amount) external {
        Balance storage b = userBalanceForToken[address(0)][msg.sender];
        require(b.available >= _amount, "not enough balance available");
        b.available = b.available.sub(_amount);
        msg.sender.transfer(_amount);
        emit LogWithdrawToken(address(0), msg.sender, _amount);
    }

    /// Function to send _amount of specific _token to contract
    /// This allows the contract to spend _amount tokens on your behalf.
    /// msg.sender has to call approve on this contract first.
    /// triggers DepositToken event.
    function depositToken(address _token, uint256 _amount) external {
        require(_token != address(0), "address cannot be the 0 address");
        require(IERC20(_token).transferFrom(msg.sender, address(this), _amount), "ERC20 transfer failed");
        Balance storage b = userBalanceForToken[_token][msg.sender];
        b.available = b.available.add(_amount);
        emit LogDepositToken(_token, msg.sender, _amount);
    }

    /// function to withdraw _amount of specific _token from contract
    /// triggers WithdrawToken event
    function withdrawToken(address _token, uint256 _amount) external {
        require(_token != address(0), "address cannot be the 0 address");
        Balance storage b = userBalanceForToken[_token][msg.sender];
        require(b.available >= _amount, "not enough balance available");
        b.available = b.available.sub(_amount);
        require(IERC20(_token).transfer(msg.sender, _amount), "ERC20 transfer failed");
        emit LogWithdrawToken(_token, msg.sender, _amount);
    }

    /// function to allow users to place orders inside the contract
    /// parameters:
        /// _tokenMake: address of the token the user (maker of the order) wants to get from the trade.
        /// _amountMake: amount of _tokenMake the maker wants to get from the trade.
        /// _tokenTake: address of the token the user (maker of the order) gives in exchgange for the tokenMake.
        /// _amountTake: amount of  _tokenTake the user (maker of the order) will give.
        /// _expirationBlock: block number from which this order will not be acceptable anymore.
        /// _nonce: for the sake of allowing users to place the exact same orders more than once, this number is added.
        /// in this case, nonce will represent the nonce of msg.sender account at the moment of creating the Tx.
    /// how it works:
        /// The contract will store for each user, the hash of the orders they have placed, it will also store
        /// the amount of the order that has been filled.
    function placeOrder(address _tokenMake, uint256 _amountMake, address _tokenTake, uint256 _amountTake, uint256 _expirationBlock, uint256 _nonce) external {
        Balance storage b = userBalanceForToken[_tokenTake][msg.sender];
        require(b.available >= _amountTake, "not enough balance available");
        b.available = b.available.sub(_amountTake);
        b.locked = b.locked.add(_amountTake);
        bytes memory m = abi.encode(_tokenMake, _amountMake, _tokenTake, _amountTake, _expirationBlock, _nonce);
        bytes32 orderHash = keccak256(m);
        OrderInfo storage o = userOrders[msg.sender][orderHash];
        o.exists = true;
        o.fill = 0;
        emit LogOrder(msg.sender, _tokenMake, _amountMake, _tokenTake, _amountTake, _expirationBlock, _nonce);
    }

    function cancelOrder(address _tokenMake, uint256 _amountMake, address _tokenTake, uint256 _amountTake, uint256 _expirationBlock, uint256 _nonce) external {
        bytes memory m = abi.encode(_tokenMake, _amountMake, _tokenTake, _amountTake, _expirationBlock, _nonce);
        bytes32 orderHash = keccak256(m);
        OrderInfo storage o = userOrders[msg.sender][orderHash];
        require(o.exists, "The order does not exist");
        o.fill = _amountMake;
        emit LogCancelOrder(msg.sender, _tokenMake, _amountMake, _tokenTake, _amountTake, _expirationBlock, _nonce);
    }

    function executeOrder(address _tokenMake, uint256 _amountMake, address _tokenTake, uint256 _amountTake, uint256 _expirationBlock, uint256 _nonce) external {

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

    function getOrderFilling(address _tokenMake, uint256 _amountMake, address _tokenTake, uint256 _amountTake, uint256 _expirationBlock, uint256 _nonce) public view returns (uint256) {
        bytes memory m = abi.encode(_tokenMake, _amountMake, _tokenTake, _amountTake, _expirationBlock, _nonce);
        bytes32 orderHash = keccak256(m);
        OrderInfo storage o = userOrders[msg.sender][orderHash];
        require(o.exists, "The order does not exist");
        return (o.fill);
    }
}
