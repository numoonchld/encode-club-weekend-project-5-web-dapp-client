// SPDX-License-Identifier: none
pragma solidity >=0.7.0 <0.9.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {LotteryToken} from "./LotteryToken.sol";

contract Lottery is Ownable {
    uint256 public lotteryClosingEpochInSeconds;
    bool public lotteryOpen;
    uint256 public maxPlayersPerRoll;

    uint256 public betPrice;
    uint256 public betFee;

    LotteryToken public lotteryTxnToken;
    /// @notice updated when token are bought
    mapping(address => bool) public activeLotteryPlayers;
    /// @notice updated when bets are placed
    address[] public lotteryPlayers;
    mapping(address => bool) isOnePlayerBetRegistered;

    uint256 public currentLotteryPayoutPool;
    address public latestLotteryWinner;
    mapping(address => uint256) public winningStash;
    uint256 public winningWithdrawBaseFee;
    mapping(address => uint256) private winningsToTransfer;

    uint256 public feeCollection;
    uint256 private feeToWithdraw;

    mapping(address => uint256) public requestedTokenBurnAmount;
    mapping(address => uint256) private burnAmountToTransfer;

    // contract deployer (i.e. owner) sets a fixed betPrice and betFee for all lotteries generated by this smart contract
    constructor(
        uint256 _betPrice,
        uint256 _betFee,
        string memory _tokenName,
        string memory _tokenSymbol
    ) {
        betPrice = _betPrice;
        betFee = _betFee;

        // limit number of lottery players to 10 per roll
        maxPlayersPerRoll = 14;

        activeLotteryPlayers[msg.sender] = true;

        // token contract will be owned by Lottery contract
        lotteryTxnToken = new LotteryToken(_tokenName, _tokenSymbol);
    }

    modifier whenLotteryClosed() {
        require(!lotteryOpen, "Lottery: Already open for bets!");
        _;
    }

    modifier whenLotteryOpen() {
        require(lotteryOpen, "Lottery: Not yet open for bets!");
        require(
            block.timestamp < lotteryClosingEpochInSeconds,
            "Lottery: Betting window closed!"
        );
        _;
    }

    modifier isLotteryCloseable() {
        require(lotteryOpen, "Lottery: Not yet open for bets!");
        require(
            block.timestamp > lotteryClosingEpochInSeconds,
            "Lottery: Betting window still open!"
        );
        _;
    }

    modifier isActiveLotteryPlayer() {
        require(
            activeLotteryPlayers[msg.sender] == true,
            "Lottery: You are not an active player!"
        );
        _;
    }

    receive() external payable {
        // ...
    }

    fallback() external {
        // ...
    }

    /// @notice starts a new lottery pool
    /// @param _closingEpochInSeconds epoch time in seconds when the lottery will close for bets
    function startLottery(
        uint256 _closingEpochInSeconds,
        uint256 _winningWithdrawBaseFee
    ) public onlyOwner whenLotteryClosed {
        require(
            _closingEpochInSeconds > block.timestamp,
            "Lottery: Closing time must be in the future!"
        );
        lotteryClosingEpochInSeconds = _closingEpochInSeconds;
        lotteryOpen = true;
        winningWithdrawBaseFee = _winningWithdrawBaseFee;
    }

    /// @notice receive ether to provide lottery tokens
    function sellLotteryTokens() public payable {
        activeLotteryPlayers[msg.sender] = true;

        // mint tokens for buyer's account in token contract
        lotteryTxnToken.mint(msg.sender, msg.value);
    }

    /// @notice track unique users
    function manageUserUniqueness(address _bettingUser)
        internal
        whenLotteryOpen
    {
        if (isOnePlayerBetRegistered[_bettingUser] == false) {
            lotteryPlayers.push(_bettingUser);
            isOnePlayerBetRegistered[_bettingUser] = true;
        }
    }

    /// @notice place lottery bets
    function bet() public whenLotteryOpen {
        require(msg.sender != owner(), "Lottery: Owner not allowed to bet!");
        require(
            lotteryPlayers.length <= maxPlayersPerRoll,
            "Lottery: Current lottery player capacity maxed out!"
        );

        // register lottery better into contract's state
        manageUserUniqueness(msg.sender);
        currentLotteryPayoutPool += betPrice;
        feeCollection += betFee;

        // transfer lotterTokens into lottery contract's account from better's account
        // https://stackoverflow.com/a/71809065
        lotteryTxnToken.transferFrom(
            msg.sender,
            address(this),
            betPrice + betFee
        );
        // lotteryTxnToken.approve(owner(), feeCollection);
        // lotteryTxnToken.transfer(owner(), betFee);
    }

    /// @notice ends currently open lottery pool (if one is active) and calculates possible winnings
    function endLottery() public isLotteryCloseable isActiveLotteryPlayer {
        /// @notice generates a block-property-based random number
        /// @dev works only after the merge
        uint256 randomNumber = block.difficulty;

        // calculate winning index of participant addresses
        if (lotteryPlayers.length > 0) {
            latestLotteryWinner = lotteryPlayers[
                randomNumber % lotteryPlayers.length
            ];

            // assign the current lottery pool value to addres
            winningStash[latestLotteryWinner] += currentLotteryPayoutPool;
        }

        // reset current lottery pool
        currentLotteryPayoutPool = 0;

        // change state of contract
        lotteryOpen = false;

        // reset lottery participants
        resetLotteryParticipants();
    }

    /// @notice reset lottery participants after lottery roll
    function resetLotteryParticipants() private {
        for (
            uint256 playerIndex = 0;
            playerIndex < lotteryPlayers.length;
            playerIndex++
        ) {
            activeLotteryPlayers[lotteryPlayers[playerIndex]] = false;
        }
    }

    /// @notice withdraw winnings after deducting fee
    function withdrawWinning(uint256 _winningAmount, uint256 _feeToDeduct)
        public
        isActiveLotteryPlayer
    {
        require(
            winningStash[msg.sender] == _winningAmount + _feeToDeduct,
            "Lottery: Winning fee calculation failed!"
        );
        feeCollection += _feeToDeduct;

        // lotteryTxnToken.approve(owner(), feeCollection);
        // lotteryTxnToken.transfer(owner(), _feeToDeduct);

        lotteryTxnToken.transfer(msg.sender, _winningAmount);
        winningStash[msg.sender] = 0;
    }

    /// @notice owner collects accumulated fees and restarts lottery
    function collectFees() public onlyOwner {
        require(
            feeCollection > 0.005 ether,
            "Lottery: fee tokens to be collected too less to collect!"
        );

        feeToWithdraw = feeCollection;
        feeCollection = 0;
        lotteryTxnToken.transfer(owner(), feeToWithdraw);
        feeToWithdraw = 0;
    }

    /// @notice track the most recent burn by registered player
    function trackLatestBurn(uint256 _burnAmount) public isActiveLotteryPlayer {
        requestedTokenBurnAmount[msg.sender] = _burnAmount;
    }

    /// @notice withdraw the most recent burn
    function withdrawLastBurnToEther() public isActiveLotteryPlayer {
        require(
            requestedTokenBurnAmount[msg.sender] > 1 ether,
            "Lottery: Insufficient burn to withdraw!"
        );
        burnAmountToTransfer[msg.sender] = requestedTokenBurnAmount[msg.sender];
        requestedTokenBurnAmount[msg.sender] = 0;
        payable(msg.sender).transfer(burnAmountToTransfer[msg.sender]);
        burnAmountToTransfer[msg.sender] = 0;
    }
}
