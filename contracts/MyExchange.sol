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

    function placeOrder(
        address _wantToken, uint256 _wantAmount,
        address _haveToken, uint256 _haveAmount,
    ) external payable tokenExists(_wantToken) tokenExists(_haveToken) {
        if (_haveToken == address(0)) {
            Balance storage b = userBalanceForToken[_haveToken][msg.sender];
            b.available = b.available.add(msg.value);
        } else {
            Balance storage b = userBalanceForToken[_haveToken][msg.sender];
            uint256 allowed = IERC20(_haveToken).allowance(msg.sender, address(this));
            if (b.available < _haveAmount) {

            }
            require(b.available >= _haveAmount || b.available.add(allowed) >= _haveAmount, "something something not enough cash");
        }

        require(b.available >= _haveAmount, "not enough balance available");
        b.available = b.available.sub(_haveAmount);
        b.locked = b.locked.add(_haveAmount);
        openOrders.push(Order({
            orderMaker: msg.sender,
            haveTokenId: tokenIds[_haveToken],
            haveAmount: _haveAmount,
            wantTokenId: tokenIds[_wantToken],
            wantAmount: _wantAmount,
            creationBlock: block.number,
        }));
        arrayLength = arrayLength + 1;
        haveTokenId = tokenIds[_haveToken];
        wantTokenId = tokenIds[_wantToken];
        emit LogOrder(msg.sender, haveTokenId, haveAmount, wantTokenId, wantAmount, creationBlock)
    }

    function cancelOrder(uint256 orderIndex) external {
        require(orderIndex > lastExpiredOrder, "the order has already expired");
        Order storage order = openOrders[orderIndex];
        require(o != 0, "the order has already been canceled");
        require(msg.sender == order.orderMaker, "only the maker can cancel an order");
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

    function executeOrder(uint256 orderIndex, uint256 amountFill) external {
        require(orderIndex > lastExpiredOrder, "the order has already expired");
        Order storage order = openOrders[orderIndex];
        require(order != 0, "the order was canceled");
        wantTokenAddress = tokenAddresses[order.wantTokenId];
        Balance storage takerWantTokenBalance = userBalanceForToken[wantTokenAddress][msg.sender]
        require(takerWantTokenBalance.availabe >= amountFill, "not enough balance");
        /// calculate cost for taker and maker
        haveTokenPrice = order.wantAmount.div(order.haveAmount);
        takerTotalCost = haveTokenPrice.mul(amountFill);
        wantTokenPrice = order.haveAmount.div(order.wantAmount);
        makerTotalCost = wantTokenPrice.mul(amountFill);
        /// proceed to token swap
        takerWantTokenBalance.available = takerWantTokenBalance.available.sub(takerTotalCost);
        haveTokenAddress = tokenAddresses[order.haveTokenId];
        Balance storage makerHaveTokenBalance = userBalanceForToken[haveTokenAddress][order.orderMaker];
        makerHaveTokenBalance.locked = makerHaveTokenBalance.locked.sub(makerTotalCost);
        takerWantTokenBalance.available = takerWantTokenBalance.available.add(makerTotalCost);
        makerWantTokenBalance.available = makerWantTokenBalance.available.add(takerTotalCost);
        /// update order
        order.wantAmount = order.wantAmount.sub(amountFill);
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
        Order[] memory o = new Order[](size);
        uint[] memory realIndices = new uint[](size);
        uint index = 0;
        for (uint256 i = lastExpired + 1; i < arrayLength - 1; i++) {
            if (openOrders[i] == 0 && openOrders[i].wantAmount != 0) continue;
            o[index++] = openOrders[i];
            realIndices[index++] = i;
        }
        return (o, realIndices);
    }
}
