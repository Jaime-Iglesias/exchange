pragma solidity 0.5.2;
pragma experimental ABIEncoderV2;

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
        address _orderMaker,
        uint256 _haveTokenId,
        uint256 _haveAmount,
        uint256 _wantTokenId,
        uint256 _wantAmount,
        uint256 _creationBlock
    );

    event LogTrade(
        address _orderMaker,
        uint256 _haveTokenId,
        uint256 _haveAmount,
        uint256 _wantTokenId,
        uint256 _wantAmount,
        uint256 _creationBlock,
        uint256 _amountFill
    );

    event LogCancelOrder(
        address _orderMaker,
        uint256 _haveTokenId,
        uint256 _haveAmount,
        uint256 _wantTokenId,
        uint256 _wantAmount,
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
    uint256 public expirationBlocks;
    uint256 public lastExpiredOrder;
    Order[] public openOrders;

    mapping (address => uint256) public tokenIds;
    address[] public tokenAddresses;

    mapping (address => mapping (address => Balance)) public userBalanceForToken;

    constructor() public {
        tokenIds[address(0)] = 1;
        tokenAddresses.push(address(0));
        expirationBlocks = 5000;
    }

    modifier orderExists(uint256 _orderIndex) {
        require(arrayLength > 0 && _orderIndex < (arrayLength), "order does not exist");
        require(openOrders[_orderIndex].haveAmount != 0, "order does not exist");
        _;
    }

    modifier onlyOrderMaker(uint256 _orderIndex) {
        require(openOrders[_orderIndex].orderMaker == msg.sender);
        _;
    }

    modifier orderNotExpired(uint256 _orderIndex) {
        if (_orderIndex != 0) {
            require(_orderIndex > lastExpiredOrder, "the order has already expired");
        }
        require(
            (openOrders[_orderIndex].creationBlock).add(expirationBlocks) >= block.number,
            "the order has already expired"
        );
        _;
    }

    modifier onlyTokens(address _tokenAddress) {
        require(_tokenAddress != address(0), "address cannot be the 0 address");
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
        tokenAddresses.push(_tokenAddress);
        tokenIds[_tokenAddress] = tokenAddresses.length;
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
    function withdraw(uint256 _amount) external {
        Balance storage b = userBalanceForToken[address(0)][msg.sender];
        require(b.available >= _amount, "not enough balance available");
        b.available = (b.available).sub(_amount);
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
        balance.available = (balance.available).sub(_amount);
        require(IERC20(_token).transfer(msg.sender, _amount), "ERC20 transfer failed");
        emit LogWithdrawToken(msg.sender, _token, _amount);
    }

    function placeOrder(
        address _haveToken,
        uint256 _haveAmount,
        address _wantToken,
        uint256 _wantAmount
    ) external payable tokenExists(_haveToken) tokenExists(_wantToken) {
        Balance storage balance = userBalanceForToken[_haveToken][msg.sender];
        /// if availabe is not enough, check for other sources of balance.
        if (balance.available < _haveAmount) {
            require(
                _checkBank(tokenIds[_haveToken], _haveAmount.sub(balance.available)),
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
            creationBlock: block.number
        }));
        arrayLength = arrayLength + 1;
        /// emit event
        emit LogOrder(msg.sender, tokenIds[_haveToken], _haveAmount, tokenIds[_wantToken], _wantAmount, block.number);
    }

    function cancelOrder(
        uint256 _orderIndex
    ) external orderExists(_orderIndex) onlyOrderMaker(_orderIndex) orderNotExpired(_orderIndex) {
        Order storage order = openOrders[_orderIndex];
        /// unlock locked assets
        Balance storage balance = userBalanceForToken[tokenAddresses[order.haveTokenId-1]][msg.sender];
        balance.locked = (balance.locked).sub(order.haveAmount);
        balance.available = (balance.available).add(order.haveAmount);
        /// emit event
        emit LogCancelOrder(
            order.orderMaker,
            order.haveTokenId,
            order.haveAmount,
            order.wantTokenId,
            order.wantAmount,
            order.creationBlock
        );
        /// delete order
        delete openOrders[_orderIndex];
    }

    function executeOrder(
        uint256 _orderIndex,
        uint256 _amountFill
    ) external orderExists(_orderIndex) orderNotExpired(_orderIndex) {
        Order storage order = openOrders[_orderIndex];
        /// check if taker has enough balance
        Balance storage takerHaveTokenBalance = userBalanceForToken[tokenAddresses[order.wantTokenId-1]][msg.sender];
        /// if availabe is not enough, check for other sources of balance.
        if (takerHaveTokenBalance.available < _amountFill) {
            require(
                _checkBank(order.haveTokenId, _amountFill.sub(takerHaveTokenBalance.available)),
                "not enough balance"
            );
        }
        /// check if _amountFill is bigger than order wantAmount then calculate cost and change
        uint256 takerCost = _amountFill;
        if (_amountFill > order.wantAmount) {
            takerCost = order.wantAmount;
            uint256 takerChange = _amountFill.sub(order.wantAmount);
            takerHaveTokenBalance.available = (takerHaveTokenBalance.available).add(takerChange);
        }
        /// Calculate the cost for the maker
        uint256  haveToWantRatio = (order.haveAmount).div(order.wantAmount);
        uint256  makerCost = haveToWantRatio.mul(takerCost);
        /// update haveToken balance for maker and taker
        Balance storage makerHaveTokenBalance = userBalanceForToken[tokenAddresses[order.wantTokenId-1]][msg.sender];
        makerHaveTokenBalance.locked = (makerHaveTokenBalance.locked).sub(makerCost);
        takerHaveTokenBalance.available = (takerHaveTokenBalance.available).sub(takerCost);
        /// update wantToken balance for maker and taker
        Balance storage makerWantTokenBalance = userBalanceForToken[tokenAddresses[order.wantTokenId-1]][order.orderMaker];
        makerWantTokenBalance.available = (makerWantTokenBalance.available).add(takerCost);
        Balance storage takerWantTokenBalance = userBalanceForToken[tokenAddresses[order.haveTokenId-1]][msg.sender];
        takerWantTokenBalance.available = (takerWantTokenBalance.available).add(makerCost);
        /// update order
        order.wantAmount = (order.wantAmount).sub(takerCost);
        order.haveAmount = (order.haveAmount).sub(makerCost);
        /// if the order is completely filled, delete it
        if (order.wantAmount == 0) {
            delete openOrders[_orderIndex];
        }
        /// emit event
        emit LogTrade(
            order.orderMaker, order.haveTokenId,
            order.haveAmount, order.wantTokenId,
            order.wantAmount, order.creationBlock,
            takerCost
        );
    }

    function setExpiration(uint256 _expiraton) external onlyOwner {
        expirationBlocks = _expiraton;
    }

    function deleteExpiredOrders() external onlyOwner {
        for (uint256 i = lastExpiredOrder; i < arrayLength; i++) {
            if (openOrders[i].creationBlock == 0) continue;
            if ((openOrders[i].creationBlock).add(expirationBlocks) <= block.number) {
                delete openOrders[i];
            } else {
                lastExpiredOrder = i;
                break;
            }
        }
    }

    function balanceOf(address _token) public view returns (uint256) {
        return (IERC20(_token).balanceOf(msg.sender));
    }

    function getUserBalanceForToken(address _token) public view returns (Balance memory) {
        return(userBalanceForToken[_token][msg.sender]);
    }

    function getTokenId(address _token) public view tokenExists(_token) returns (uint256) {
        return tokenIds[_token];
    }

    function getTokenAddress(uint256 _tokenId) public view returns (address) {
        require(_tokenId != 0 && _tokenId <= tokenAddresses.length, "token does not exist");
        return tokenAddresses[_tokenId - 1];
    }

    function getOrder(uint256 _orderIndex) public view orderExists(_orderIndex) returns (Order memory) {
        return openOrders[_orderIndex];
    }

    function getTokens() public view returns (address[] memory) {
        address[] memory tokens = new address[](tokenAddresses.length);
        uint256 counter = 0;
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            tokens[counter++] = tokenAddresses[i];
        }
        return tokens;
    }

    function getOpenOrders() public view returns (Order[] memory, uint256[] memory) {
        uint256 size = arrayLength - lastExpiredOrder;
        Order[] memory order = new Order[](size);
        uint[] memory realIndices = new uint[](size);
        uint counter = 0;
        for (uint256 i = lastExpiredOrder; i < arrayLength; i++) {
            if (openOrders[i].wantAmount == 0) continue;
            order[counter++] = openOrders[i];
            realIndices[counter++] = i;
        }
        return (order, realIndices);
    }

    function _checkBank(uint256 _tokenId, uint256 _amountNeeded) internal returns (bool) {
        if (_tokenId == 1) {
            require(msg.value >= _amountNeeded, "not enough balance");
            Balance storage balance = userBalanceForToken[tokenAddresses[_tokenId-1]][msg.sender];
            balance.available = balance.available.add(_amountNeeded);
            msg.sender.transfer(msg.value.sub(_amountNeeded));
        } else {
            require(
                IERC20(tokenAddresses[_tokenId-1]).allowance(msg.sender, address(this)) >= _amountNeeded,
                "not enough balance"
            );
            require(
                IERC20(tokenAddresses[_tokenId-1]).transferFrom(msg.sender, address(this), _amountNeeded),
                "ERC20 token error"
            );
            Balance storage balance = userBalanceForToken[tokenAddresses[_tokenId-1]][msg.sender];
            balance.available = balance.available.add(_amountNeeded);
        }
        return true;
    }
}
