pragma solidity 0.5.11;
pragma experimental ABIEncoderV2;

import "./SafeMath.sol";
import "./IERC20.sol";
import "./Ownable.sol";

contract Dex is Ownable {

    using SafeMath for uint256;

    // Events
    event DepositToken(
        address indexed user,
        address indexed token,
        uint256 indexed amount
    );

    event WithdrawToken(
        address indexed user,
        address indexed token,
        uint256 indexed amount
    );

    event NewOrder(
        bytes32 orderId,
        address orderMaker,
        address haveToken,
        uint256 haveAmount,
        address wantToken,
        uint256 wantAmount,
        uint256 creationBlock
    );

    event ExecuteOrder(
        bytes32 orderId,
        uint256 amountFilled
    );

    event CancelOrder(
        bytes32 orderId,
        uint256 cancelationBlock
    );

    // Storage
    struct Balance {
        uint256 available;
        uint256 locked;
    }

    uint256 public expirationBlocks;
    uint256 public lastExpiredOrder;

    mapping (address => uint256) public tokenIds;
    address[] public tokens;

    mapping (address => mapping (address => Balance)) public userBalanceForToken;
    mapping (address => mapping (bytes32 => uint256)) public orders;

    constructor() public {
        // address(0) represents ETH
        // ETH will have the id 1 since mappings have the value 0 by default
        tokenIds[address(0)] = 1;
        tokens.push(address(0));
        expirationBlocks = 5000;
    }

    modifier onlyTokens(address tokenAddress) {
        require(tokenAddress != address(0), "address cannot be the 0 address");
        _;
    }

    modifier tokenExists(address tokenAddress) {
        require(tokenIds[tokenAddress] != 0, "Token does not exist");
        _;
    }

    modifier tokenNotExists(address tokenAddress) {
        require(tokenIds[tokenAddress] == 0, "Token already exists");
        _;
    }

    function addToken(address tokenAddress) external onlyOwner tokenNotExists(tokenAddress) {
        tokens.push(tokenAddress);
        tokenIds[tokenAddress] = tokens.length;
    }

    /// Function to receive ETH
    /// Allows the contract to manage the Ether the user deposits
    /// Triggers deposit event.
    function deposit() external payable {
        Balance storage b = userBalanceForToken[address(0)][msg.sender];
        b.available = (b.available).add(msg.value);
        emit LogDepositToken(msg.sender, address(0), msg.value);
    }

    /// Function to withdraw ETH
    /// msg.sender withdraws _amount ETH from the contract
    /// triggers withdraw event
    function withdraw(uint256 amount) external {
        Balance storage b = userBalanceForToken[address(0)][msg.sender];
        require(b.available >= amount, "not enough balance available");
        b.available = (b.available).sub(amount);
        msg.sender.transfer(amount);
        emit LogWithdrawToken(msg.sender, address(0), amount);
    }

    /// Function to send _amount of specific _token to contract
    /// This allows the contrct to spend _amount tokens on your behalf.
    /// msg.sender has to call approve on this contract first.
    /// triggers DepositToken event.
    function depositToken(address token, uint256 amount) external onlyTokens(_oken) tokenExists(token) {
        require(_checkBank(tokenIds[token], amount), "approve the contract first");
        emit LogDepositToken(msg.sender, token, amount);
    }

    /// function to withdraw _amount of specific _token from contract
    /// triggers WithdrawToken event
    function withdrawToken(address token, uint256 amount) external onlyTokens(token) tokenExists(token) {
        Balance storage balance = userBalanceForToken[token][msg.sender];
        require(balance.available >= amount, "not enough balance available");
        balance.available = (balance.available).sub(amount);
        require(IERC20(token).transfer(msg.sender, amount), "ERC20 transfer failed");
        emit LogWithdrawToken(msg.sender, token, amount);
    }
}