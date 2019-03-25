pragma solidity 0.5.2;

import "./SafeMath.sol";
import "./IERC20.sol";
import "./Ownable.sol";


contract  MyExchange is Ownable {

    using SafeMath for uint256;

    /// Create functionality for creating orders (buy, sell)
    /// Create functionality to cancel an order

    event LogDepositToken(address _token, address _user, uint256 _amount);
    event LogWithdrawToken(address _token, address _user, uint256 _amount);

    mapping (address => mapping (address => uint256) ) public userBalanceForToken;
    //mapping (address => mapping (bytes32 => uint256) ) public userOrders;

    constructor() public {
    }

    /// Function to receive ETH
    /// Allows the contract to manage the Ether the user deposits
    /// Triggers deposit event.
    function deposit() external payable {
        userBalanceForToken[address(0)][msg.sender] = userBalanceForToken[address(0)][msg.sender].add(msg.value);
        emit LogDepositToken(address(0), msg.sender, msg.value);
    }

    /// Function to withdraw ETH
    /// msg.sender withdraws _amount ETH from the contract
    /// triggers withdraw event
    function withdraw(uint256 _amount) external {
        require(userBalanceForToken[address(0)][msg.sender] >= _amount, "not enough balance");
        userBalanceForToken[address(0)][msg.sender] = userBalanceForToken[address(0)][msg.sender].sub(_amount);
        msg.sender.transfer(_amount);
        emit LogWithdrawToken(address(0), msg.sender, _amount);
    }

    /// Function to send _amount of specific _token to contract
    /// This allows the contract to spend _amount tokens on your behalf.
    /// msg.sender has to call approve on this contract first.
    /// triggers DepositToken event.
    function depositToken(address _token, uint256 _amount) external {
        require(_token != address(0), "address cannot be the 0 address");
        //require(IERC20(_token).allowance(msg.sender, address(this)) >= _amount, "not enough allowance");
        require(IERC20(_token).transferFrom(msg.sender, address(this), _amount), "ERC20 transfer failed");
        userBalanceForToken[_token][msg.sender] = userBalanceForToken[_token][msg.sender].add(_amount);
        emit LogDepositToken(_token, msg.sender, _amount);
    }

    /// function to withdraw _amount of specific _token from contract
    /// triggers WithdrawToken event
    function withdrawToken(address _token, uint256 _amount) external {
        require(_token != address(0), "address cannot be the 0 address");
        require(userBalanceForToken[_token][msg.sender] >= _amount, "not enough balance");
        userBalanceForToken[_token][msg.sender] = userBalanceForToken[_token][msg.sender].sub(_amount);
        require(IERC20(_token).transfer(msg.sender, _amount), "ERC20 transfer failed");
        emit LogWithdrawToken(_token, msg.sender, _amount);
    }

    /*function placeOrder(address _tokenMake, uint256 _amountMake, address _tokenTake, uint256 _amountTake, uint256 _expirationBlock, uint256 _nonce) external {
        bytes32 orderHash = keccak256(address(this), _tokenMake, _amountMake, _tokenTake, _amountTake, _expirationBlock, _nonce);
        userOrders[msg.sender][orderHash] = 0;
        emit LogOrder(msg.sender, _tokenMake, _amountMake, _tokenTake, _amountTake, _expirationBlock, _nonce)
    }*/

    /// function to get the amount of tokens of _token type a user has
    function balanceOf(address _token) public view returns (uint256) {
        return (IERC20(_token).balanceOf(msg.sender));
    }

    /// function to get the amount of tokens of _token type msg.sender has inside the contract
    function getUserBalanceForToken(address _token) public view returns (uint256) {
        return userBalanceForToken[_token][msg.sender];
    }
}
