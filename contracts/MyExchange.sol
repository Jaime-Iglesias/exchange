pragma solidity >=0.4.21 <0.6.0;

import "./SafeMath.sol";
import "./IERC20.sol";
import "./Ownable.sol";

contract ERC20 is IERC20 {

  /// total amount of tokens
  uint256 public totalSupply;
  string public name;

  mapping (address => uint256) public balances;
  mapping (address => mapping (address => uint256)) public allowed;

  function transfer(address _to, uint256 _value) public returns (bool success) {
    require(balances[msg.sender] >= _value);
    balances[msg.sender] -= _value;
    balances[_to] += _value;
    emit LogTransfer(msg.sender, _to, _value);
    return true;
  }

  function approve(address _spender, uint256 _value) public returns (bool success) {
    allowed[msg.sender][_spender] = _value;
    emit LogApproval(msg.sender, _spender, _value);
    return true;
  }

  function transferFrom(address _from, address _to, uint256 _value) public returns (bool success){
    require(balances[_from] >= _value);
    require(allowed[_from][msg.sender] >= _value);
    balances[_from] -= _value;
    balances[_to] += _value;
    allowed[_from][msg.sender] -= _value;
    emit LogTransfer(_from, _to, _value);
    return true;
  }

  function balanceOf(address _owner) public view returns (uint256 balance) {
    return balances[_owner];
  }

  function allowance(address _owner, address _spender) public view returns (uint256 remaining){
    return allowed[_owner][_spender];
  }

}

contract MyExchange is Ownable{

  using SafeMath for uint256;

  ///Create functionality for creating orders (buy, sell)
  //Create functionality to cancel an order

  event LogDepositToken(address _token, address _user, uint256 _amount);
  event LogWithdrawToken(address _token, address _user, uint256 _amount);

  mapping (address => mapping (address => uint256) ) userBalanceForToken;
  /// mapping (address => mapping (type1 => type2) ) userOrders;

  constructor() public {
    owner = msg.sender;
  }

  /// Returns amount of specific _token owned by _user
  function userTokenBalance(address _token, address _user) public view returns (uint256 balance) {
    return userBalanceForToken[_token][_user];
  }

  /// Function to send _amount of specific _token to contract
  /// This allows the contract to spend _amount tokens on your behalf.
  /// triggers DepositToken event
  function depositToken(address _token, uint256 _amount) public {
    ERC20(_token).approve(address(this), _amount);
    require(ERC20(_token).transferFrom(msg.sender, address(this), _amount));
    userBalanceForToken[_token][msg.sender] = userBalanceForToken[_token][msg.sender].add(_amount);
    emit LogDepositToken(_token, msg.sender, _amount);
  }

  /// function to withdraw _amount of specific _token from contract
  /// triggers WithdrawToken event
  function withdrawToken(address _token, uint256 _amount) public {
    require(userBalanceForToken[_token][msg.sender] >= _amount);
    userBalanceForToken[_token][msg.sender] = userBalanceForToken[_token][msg.sender].sub(_amount);
    require(ERC20(_token).transfer(msg.sender, _amount));
    emit LogWithdrawToken(_token, msg.sender, _amount);
  }
}
