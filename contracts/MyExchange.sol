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
        uint256 _creationBlock,
        uint256 _nonce
    );

    event LogTrade(
        address _maker,
        uint256 _wantTokenId,
        uint256 _wantAmount,
        uint256 _giveTokenId,
        uint256 _giveAmount,
        uint256 _creationBlock,
        uint256 _amountFill
    );

    event LogCancelOrder(
        address _maker,
        uint256 _wantTokenId,
        uint256 _wantAmount,
        uint256 _giveTokenId,
        uint256 _giveAmount,
        uint256 _creationBlock
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
        uint256 creationBlock;
    }

    uint256 public arrayLength;
    uint256 public lastExpiredOrder;
    Order[] public openOrders;

    mapping (address => uint256) public tokenIds;
    address[] public tokenAddresses;

    mapping (address => mapping (address => Balance)) public userBalanceForToken;

    constructor() public {
        tokenIds[address(0)] = 1;
        tokenAddresses[0] = address(0);
    }

    modifier onlyTokens(address _tokenAddress) {
        require(_token != address(0), "address cannot be the 0 address");
        _;
    }

    modifier onlyOrderMaker(uint256 _orderIndex) {
        require(openOrders[_orderIndex].orderMaker == msg.sender);
        _;
    }

    modifier tokenExists(address _tokenAddress) {
        require(tokenIds[_tokenAddress] != 0, "Token does not exist");
        _;
    }

    modifier tokenNotExists(address _tokenAddress) {
        require(tokenIds[_tokenAddress] == 0, "Token already exists");
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
    function depositToken(address _token, uint256 _amount) external onlyTokens(_token) tokenExists(_token) {
        require(_checkBank(tokenIds[_token], _amount), "approve the contract first");
        emit LogDepositToken(msg.sender, _token, _amount);
    }

    /// function to withdraw _amount of specific _token from contract
    /// triggers WithdrawToken event
    function withdrawToken(address _token, uint256 _amount) external onlyTokens(_token) tokenExists(_token) {
        Balance storage balance = userBalanceForToken[_token][msg.sender];
        require(balance.available >= _amount, "not enough balance available");
        balance.available = balance.available.sub(_amount);
        require(IERC20(_token).transfer(msg.sender, _amount), "ERC20 transfer failed");
        emit LogWithdrawToken(msg.sender, _token, _amount);
    }

    function placeOrder(
        address _wantToken,
        uint256 _wantAmount,
        address _haveToken,
        uint256 _haveAmount,
    ) external payable tokenExists(_wantToken) tokenExists(_haveToken) {
        Balance storage balance = userBalanceForToken[_haveToken][msg.sender];
        /// if availabe is not enough, check for other sources of balance.
        if (balance.available < _haveAmount) {
            require(
                _checkBank(tokenIds[_haveToken]), _haveAmount.sub(balance.available),
                "not enough balance"
            );
        }
        /// lock assets
        balance.available = (balance.available).sub(_haveAmount);
        balance.locked = (balance.locked).add(_haveAmount);
        /// update orders
        openOrders.push(Order({
            orderMaker: msg.sender,
            haveTokenId: tokenIds[_haveToken],
            haveAmount: _haveAmount,
            wantTokenId: tokenIds[_wantToken],
            wantAmount: _wantAmount,
            creationBlock: block.number,
        }));
        arrayLength = arrayLength + 1;
        /// emit event
        emit LogOrder(msg.sender, tokenIds[_haveToken], haveAmount, tokenIds[_wantToken], wantAmount, creationBlock);
    }

    function cancelOrder(uint256 _orderIndex) external onlyOrderMaker(_orderIndex) {
        require(_orderIndex > lastExpiredOrder, "the order has already expired");
        Order storage order = openOrders[_orderIndex];
        require(order != 0, "the order has already been canceled");
        /// unlock locked assets
        Balance storage balance = userBalanceForToken[tokenAddresses[order.haveTokenId]][msg.sender];
        balance.locked = (balance.locked).sub(order.haveAmount);
        balance.available = (balance.available).add(order.haveAmount);
        /// emit event and delete order
        emit LogCancelOrder(
            order.orderMaker,
            order.haveTokenId,
            order.haveAmount,
            order.wantTokenId,
            order.wantAmount,
            order.creationBlock,
        );
        delete order;
    }

    function executeOrder(uint256 _orderIndex, uint256 _amountFill) external {
        require(_orderIndex > lastExpiredOrder, "the order has already expired");
        Order storage order = openOrders[_orderIndex];
        require(order != 0, "the order was canceled");
        /// check if taker has enough balance
        Balance storage takerHaveTokenBalance = userBalanceForToken[tokenAddresses[order.wantTokenId]][msg.sender]
        /// if availabe is not enough, check for other sources of balance.
        if (takerHaveTokenBalance.availabe < _amountFill) {
            require(
                _checkBank(tokenAddresses[order.haveTokenId], _haveAmount.sub(balance.available),
                "not enough balance"
            );
        }
        /// Calculate the cost the maker
        haveToWantRatio = (order.haveAmount).div(order.wantAmount);
        makerCost = haveToWantRatio.mul(_amountFill);
        /// update haveToken balance for maker and taker
        Balance storage makerHaveTokenBalance = userBalanceForToken[tokenAddresses[order.wantTokenId]][msg.sender];
        makerHaveTokenBalance.locked = (makerHaveTokenBalance.locked).sub(makerCost);
        takerHaveTokenBalance.availabe = (takerHaveTokenBalance.availabe).sub(_amountFill);
        /// update wantToken balance for maker and taker
        Balance storage makerWantTokenBalance = userBalanceForToken[tokenAddresses[order.wantTokenId]][order.orderMaker];
        makerWantTokenBalance = (makerWantTokenBalance.available).add(_amountFill);
        Balance storage takerWantTokenBalance = userBalanceForToken[tokenAddresses[order.haveTokenId]][msg.sender];
        takerWantTokenBalance = (takerWantTokenBalance.available).add(makerCost);
        /// update order
        order.wantAmount = (order.wantAmount).sub(_amountFill);
        order.haveAmount = (order.haveAmount).sub(_makerCost);
        /// if the order is completely filled, delete it
        if (order.wantAmount == 0) {
            delete order;
        }
        /// emit event
        emit LogTrade(
            order.orderMaker, order.haveTokenId,
            order.haveAmount, order.wantTokenId,
            order.wantAmount, order.creationBlock,
            amountFill
        );
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

    function getTokenAddress(uint256 _tokenId) public view tokenExists(_tokenId) returns (address tokenAddress) {
        return tokenAddresses[_tokenId];
    }

    function getOpenOrders() public view returns (Order[] memory, uint256[] memory) {
        uint256 size = arrayLength - lastExpiredOrder;
        Order[] memory order = new Order[](size);
        uint[] memory realIndices = new uint[](size);
        uint index = 0;
        for (uint256 i = lastExpired + 1; i < arrayLength - 1; i++) {
            if (openOrders[i] == 0) continue;
            order[index++] = openOrders[i];
            realIndices[index++] = i;
        }
        return (order, realIndices);
    }

    function _checkBank(uint256 _tokenId, uint256 _amountNeeded) internal returns (bool) {
        if (_tokenId == 1) {
            require(msg.value >= _amountNeeded, "not enough balance");
            Balance storage balance = userBalanceForToken[tokenAddresses(_tokenId)][msg.sender];
            balance.available = balance.available.add(_amountNeeded);
            msg.sender.transfer(msg.value.sub(_amountNeeded));
        } else {
            require(
                IERC20(tokenAddresses(_tokenId)).allowance(msg.sender, address(this)) >= _amountNeeded,
                "not enough balance"
            );
            require(
                IERC20(tokenAddresses(_tokenId)).transferFrom(msg.sender, address(this), _amountNeeded),
                "ERC20 token error"
            );
            Balance storage balance = userBalanceForToken[tokenAddresses(_tokenId)][msg.sender];
            balance.available = balance.available.add(_amountNeeded);
        }
        return true;
    }
}
