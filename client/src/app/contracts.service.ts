import { Injectable } from '@angular/core'
import { ethers, BigNumber } from 'ethers'
import bigNumberToETHString from 'src/helpers/bigNumberToETHString'
import * as ContractAddressesJSON from '../assets/contracts/contracts.json'
import * as LotteryContractJSON from '../assets/contracts/lottery-contract/Lottery.json'
import * as LotteryTokenContractJSON from '../assets/contracts/lottery-token-contract/LotteryToken.json'
import currentEpoch from '../helpers/currentEpoch'

@Injectable({
  providedIn: 'root',
})
export class ContractsService {
  currentAccount: string
  isLoggedIn: Boolean

  contractOwner: string

  lotteryContractAddress: string
  lotteryTokenContractAddress: string

  contractAddressesJSON: {
    lotteryContractAddress: string
    lotteryTokenContractAddress: string
  }
  lotteryContractJSON: any
  lotteryTokenContractJSON: any

  provider: ethers.providers.BaseProvider

  constructor() {
    this.currentAccount = ''
    this.isLoggedIn = false
    this.contractOwner = ''

    this.contractAddressesJSON = ContractAddressesJSON
    this.lotteryContractAddress = this.contractAddressesJSON.lotteryContractAddress
    this.lotteryTokenContractAddress = this.contractAddressesJSON.lotteryTokenContractAddress

    this.lotteryContractJSON = LotteryContractJSON
    this.lotteryTokenContractJSON = LotteryTokenContractJSON

    // this.provider = ethers.getDefaultProvider('goerli')
    this.provider = ethers.getDefaultProvider('http://localhost:8545')
  }

  // get metamask account/signer/address
  async checkWalletConnection(ethereum: any) {
    try {
      if (!ethereum) {
        console.log('Install MetaMask!')
        window.alert('MetaMask needed to use this site!')
      } else {
        // console.log('Ethereum object found!', ethereum)
        console.log('Ethereum object found!')
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' })

      if (accounts.length !== 0) {
        const account = accounts[0]
        console.log('Found authorized account!', account)
        // console.log('Found authorized account!')
        this.currentAccount = account

        this.isLoggedIn = true
        return true
      } else {
        console.log('No authorized account found!')
        this.isLoggedIn = false
        window.alert('Connect site to MetaMask account to use this page!')
        return false
      }
    } catch (error) {
      console.error(error)
      return false
    }
  }

  // connect to metamask on button click
  async connectToWallet(ethereum: any): Promise<string> {
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
    })

    const account = accounts[0]
    this.currentAccount = account
    this.isLoggedIn = true
    return this.currentAccount
  }

  // get metamask wallet signer
  async getMetamaskWalletSigner(ethereum: any) {
    const metamaskWalletProvider = new ethers.providers.Web3Provider(ethereum)
    return metamaskWalletProvider.getSigner()
  }

  // get wallet balance
  async getWalletBalance(ethereum: any) {
    const metamaskWalletProvider = new ethers.providers.Web3Provider(ethereum)
    return bigNumberToETHString(
      await metamaskWalletProvider.getSigner().getBalance(),
    )
  }

  // instantiate lottery contract
  async getLotteryContract(signer?: ethers.Signer) {
    let lotteryContract: ethers.Contract

    if (signer) {
      lotteryContract = new ethers.Contract(
        this.lotteryContractAddress,
        this.lotteryContractJSON.abi,
        signer,
      )
    } else {
      lotteryContract = new ethers.Contract(
        this.lotteryContractAddress,
        this.lotteryContractJSON.abi,
        this.provider,
      )
    }

    return lotteryContract
  }

  // instantiate token contract
  async getLotteryTokenContract(signer?: ethers.Signer) {
    let lotteryTokenContract: ethers.Contract

    if (signer) {
      lotteryTokenContract = new ethers.Contract(
        this.lotteryTokenContractAddress,
        this.lotteryTokenContractJSON.abi,
        signer,
      )
    } else {
      lotteryTokenContract = new ethers.Contract(
        this.lotteryTokenContractAddress,
        this.lotteryTokenContractJSON.abi,
        this.provider,
      )
    }

    return lotteryTokenContract
  }

  // load contract owner
  async loadContractOwner(ethereum: any) {
    // const signer = await this.getMetamaskWalletSigner(ethereum)
    const lotteryContract = await this.getLotteryContract()
    const owner = await lotteryContract['owner']()
    // console.log('owner: ', await owner)
    this.contractOwner = await owner
  }

  // is a lottery active
  determineIsCurrentAccountLotteryContractOwner(): Boolean {
    console.log('owner: --', this.contractOwner)
    console.log('loggedIn: ', this.currentAccount)
    return (
      this.contractOwner.toLowerCase().trim() ===
      this.currentAccount.toLowerCase().trim()
    )
  }

  // betting window open?
  async isBettingWindowOpen() {
    const lotteryContract = await this.getLotteryContract()
    const isLotteryOpen = await lotteryContract['lotteryOpen']()

    const currentlySetLotteryContractClosingEpoch = (
      await lotteryContract['lotteryClosingEpochInSeconds']()
    ).toNumber()
    const captureEpoch = currentEpoch()

    if (
      isLotteryOpen &&
      captureEpoch < currentlySetLotteryContractClosingEpoch
    ) {
      return true
    }
    return false
  }

  // start lottery
  async startLottery(
    ethereum: any,
    closingTime: Number,
    BASE_WINNING_FEE_DEPLOY_FRIENDLY_FORMAT: BigNumber,
  ) {
    const currentWallet = await this.getMetamaskWalletSigner(ethereum)
    console.log(await currentWallet.getAddress(), this.contractOwner)
    if (
      (await currentWallet.getAddress()).toLowerCase().trim() !==
      this.contractOwner.toLowerCase().trim()
    ) {
      window.alert('Only owner allowed to start lottery!')
      return
    }

    try {
      const lotteryContract = await this.getLotteryContract()
      const startLotteryTxn = await lotteryContract
        .connect(currentWallet)
        ['startLottery'](closingTime, BASE_WINNING_FEE_DEPLOY_FRIENDLY_FORMAT)

      return [startLotteryTxn.hash]
    } catch (error) {
      console.log(error)
      window.alert(error)
      return false
    }
  }

  // get lottery token balance
  async getLotteryTokenBalance(ethereum: any) {
    try {
      const currentWallet = await this.getMetamaskWalletSigner(ethereum)
      const lotteryTokenContract = await this.getLotteryTokenContract()

      const currentAccountTokenBalance = await lotteryTokenContract[
        'balanceOf'
      ](await currentWallet.getAddress())

      return bigNumberToETHString(currentAccountTokenBalance)
    } catch (error) {
      console.log('Can not get token balance: ', error)
      window.alert('Can not get token balance: ' + `${error}`)
      return ''
    }
  }

  // token purchase
  async purchaseLotteryTokens(
    ethereum: any,
    lotteryTokenAmount: string,
  ): Promise<Boolean> {
    try {
      const currentWallet = await this.getMetamaskWalletSigner(ethereum)

      // run purchase function on lottery contract itself
      const lotteryContract = await this.getLotteryContract()
      const tokenPurchaseTxn = await lotteryContract
        .connect(currentWallet)
        ['sellLotteryTokens']({
          value: ethers.utils.parseEther(lotteryTokenAmount),
        })

      const tokenPurchaseTxnReceipt = await this.provider.getTransactionReceipt(
        tokenPurchaseTxn.hash,
      )

      if (tokenPurchaseTxnReceipt) {
        // run approve on token contract
        // to approve token spending to lottery contract on behalf of the signer
        const lotteryTokenContract = await this.getLotteryTokenContract()

        const currentTokenBalance = await this.getLotteryTokenBalance(ethereum)

        const approveAllowanceToLotteryContractTxn = await lotteryTokenContract
          .connect(currentWallet)
          ['approve'](this.lotteryContractAddress, currentTokenBalance)

        const approveAllowanceToLotteryContractTxnReceipt = await this.provider.getTransactionReceipt(
          approveAllowanceToLotteryContractTxn.hash,
        )

        if (approveAllowanceToLotteryContractTxnReceipt) return true
        return false
      }

      return false
    } catch (error) {
      console.log(error)
      window.alert(error)
      return false
    }
  }

  // token redemption
  async redeemTokensToETH(ethereum: any): Promise<Boolean> {
    try {
      const currentWallet = await this.getMetamaskWalletSigner(ethereum)
      const currentTokenBalance = await this.getLotteryTokenBalance(ethereum)

      const lotteryTokenContract = await this.getLotteryTokenContract()
      const lotteryContract = await this.getLotteryContract()

      const amountToBurn = currentTokenBalance
      await lotteryContract
        .connect(currentWallet)
        ['trackLatestBurn'](amountToBurn)

      await lotteryTokenContract.connect(currentWallet)['burn'](amountToBurn)

      await lotteryContract.connect(currentWallet)['withdrawLastBurnToEther']()

      return true
    } catch (error) {
      console.log(error)
      window.alert(error)
      return false
    }
  }

  // get accumulated fees
  async getAccumulatedFees() {
    let accumulatedFees: BigNumber

    try {
      const lotteryContract = await this.getLotteryContract()
      accumulatedFees = await lotteryContract['feeCollection']()

      return bigNumberToETHString(accumulatedFees)
    } catch (error) {
      console.log(error)
      window.alert(error)
      return ''
    }
  }

  // is lottery roll available
  async isLotteryRollAvailable() {
    try {
      const lotteryContract = await this.getLotteryContract()
      const isLotteryOpenForBetting = await lotteryContract['lotteryOpen']()

      const currentlySetLotteryContractClosingEpoch = (
        await lotteryContract['lotteryClosingEpochInSeconds']()
      ).toNumber()
      const captureEpoch = currentEpoch()

      if (
        isLotteryOpenForBetting &&
        currentlySetLotteryContractClosingEpoch < captureEpoch
      ) {
        return true
      }
      return false
    } catch (error) {
      console.log(error)
      window.alert(error)
      return false
    }
  }

  // is lottery start available
  async isLotteryStartAvailable() {
    try {
      const lotteryContract = await this.getLotteryContract()
      const isLotteryOpenForBetting = await lotteryContract['lotteryOpen']()
      return !isLotteryOpenForBetting
    } catch (error) {
      console.log(error)
      window.alert(error)
      return false
    }
  }

  // roll lottery
  async rollLottery(ethereum: any) {
    try {
      const lotteryContract = await this.getLotteryContract()
      const currentWallet = await this.getMetamaskWalletSigner(ethereum)

      const lotteryRollTxn = await lotteryContract
        .connect(currentWallet)
        ['endLottery']()

      const lotteryRollTxnReceipt = await this.provider.getTransactionReceipt(
        lotteryRollTxn.hash,
      )

      if (lotteryRollTxnReceipt) return true
      return false
    } catch (error) {
      console.log(error)
      window.alert(error)
      return false
    }
  }

  // latest lottery winner
  async getLatestLotteryWinner() {
    try {
      const lotteryContract = await this.getLotteryContract()
      const latestLotteryWinner = await lotteryContract['latestLotteryWinner']()
      return latestLotteryWinner
    } catch (error) {
      console.log(error)
      window.alert(error)
      return false
    }
  }

  // get unclaimed winnings for wallet
  async getUnclaimedWinnings(ethereum: any) {
    try {
      const lotteryContract = await this.getLotteryContract()
      const currentWallet = await this.getMetamaskWalletSigner(ethereum)
      const unclaimedWinnings = await lotteryContract['winningStash'](
        await currentWallet.getAddress(),
      )

      return bigNumberToETHString(unclaimedWinnings)
    } catch (error) {
      console.log(error)
      window.alert(error)
      return ''
    }
  }

  // place bets
  async placeBets(ethereum: any) {
    try {
      const lotteryContract = await this.getLotteryContract()
      const currentWallet = await this.getMetamaskWalletSigner(ethereum)
      const placeBetTxn = await lotteryContract.connect(currentWallet)['bet']()

      const placeBetTxnReceipt = await this.provider.getTransactionReceipt(
        placeBetTxn.hash,
      )

      if (placeBetTxnReceipt) return true
      return false
    } catch (error) {
      console.log(error)
      window.alert(error)
      return false
    }
  }

  // get closing epoch time for current pool
  async getClosingEpochTime() {
    try {
      const lotteryContract = await this.getLotteryContract()
      const currentlySetLotteryContractClosingEpoch = (
        await lotteryContract['lotteryClosingEpochInSeconds']()
      ).toNumber()

      return currentlySetLotteryContractClosingEpoch
    } catch (error) {
      console.log(error)
      window.alert(error)
      return 0
    }
  }

  // claim fee credit
  async claimFeeCredit(ethereum: any) {
    try {
      const currentWallet = await this.getMetamaskWalletSigner(ethereum)
      const lotteryContract = await this.getLotteryContract()

      const claimFeeCreditTxn = await lotteryContract
        .connect(currentWallet)
        ['collectFees']()

      const claimFeeCreditTxnReceipt = await this.provider.getTransactionReceipt(
        claimFeeCreditTxn.hash,
      )

      if (claimFeeCreditTxnReceipt) return true

      return false
    } catch (error) {
      console.log(error)
      window.alert(error)
      return false
    }
  }
}
