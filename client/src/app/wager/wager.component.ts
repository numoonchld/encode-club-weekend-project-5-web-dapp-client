import { Component, OnInit } from '@angular/core'
import { ContractsService } from '../contracts.service'
import { FormBuilder, Validators } from '@angular/forms'
import { BigNumber, ethers } from 'ethers'
import bigNumberToETHString from 'src/helpers/bigNumberToETHString'

declare var window: any

@Component({
  selector: 'app-wager',
  templateUrl: './wager.component.html',
  styleUrls: ['./wager.component.css'],
})
export class WagerComponent implements OnInit {
  isAttemptingToPurchaseTokens: Boolean
  isAttemptingTokenRedemption: Boolean
  isLoadingBalance: Boolean
  isBettingWindowOpen: Boolean
  currentLotteryTokenBalanceForCurrentWallet: string
  currentWalletBalance: string
  unclaimedLotteryWinning: string
  unclaimedLotteryWinningBN: ethers.BigNumber
  isPlacingBet: Boolean
  isClaimingWinning: Boolean
  isForcingAllowance: Boolean
  isWinningClaimable: boolean
  baseWinningFee: string

  buyTokensForm = this.fb.group({
    lotteryTokenAmount: ['', [Validators.required]],
  })

  redeemTokensForm = this.fb.group({
    lotteryTokenAmount: ['', [Validators.required]],
  })

  constructor(
    private contractsService: ContractsService,
    private fb: FormBuilder,
  ) {
    this.isAttemptingToPurchaseTokens = false
    this.isAttemptingTokenRedemption = false
    this.isLoadingBalance = true
    this.isBettingWindowOpen = false
    this.currentLotteryTokenBalanceForCurrentWallet = ''
    this.currentWalletBalance = ''
    this.unclaimedLotteryWinning = ''
    this.isPlacingBet = false
    this.isClaimingWinning = false
    this.unclaimedLotteryWinningBN = ethers.BigNumber.from(0)
    this.isForcingAllowance = false
    this.isWinningClaimable = false
    this.baseWinningFee = ''
  }

  async ngOnInit(): Promise<void> {
    this.isBettingWindowOpen = await this.contractsService.isBettingWindowOpen()

    const { ethereum } = window
    this.currentLotteryTokenBalanceForCurrentWallet = await this.contractsService.getLotteryTokenBalance(
      ethereum,
    )
    this.currentWalletBalance = await this.contractsService.getWalletBalance(
      ethereum,
    )
    ;[
      this.unclaimedLotteryWinningBN,
      this.unclaimedLotteryWinning,
    ] = await this.contractsService.getUnclaimedWinnings(ethereum)

    this.isLoadingBalance = false

    this.shouldWinningClaimBeEnabled()

    this.baseWinningFee = ethers.utils.formatEther(
      await this.contractsService.getBaseWinningFee(),
    )
  }

  async shouldWinningClaimBeEnabled() {
    this.isWinningClaimable = await this.contractsService.shouldWinningClaimBeEnabled(
      this.unclaimedLotteryWinningBN,
    )
  }

  async attemptTokenPurchase() {
    this.isAttemptingToPurchaseTokens = true
    const { ethereum } = window

    const { lotteryTokenAmount } = this.buyTokensForm.value

    if (Number.isNaN(parseFloat(lotteryTokenAmount!))) {
      console.log('Enter valid token amount!')
      window.alert('Enter valid token amount!')
      this.isAttemptingToPurchaseTokens = false
    }

    const isPurchaseSuccess = await this.contractsService.purchaseLotteryTokens(
      ethereum,
      lotteryTokenAmount!,
    )

    if (isPurchaseSuccess) {
      window.alert('Token purchase successful!')

      this.currentWalletBalance = await this.contractsService.getWalletBalance(
        ethereum,
      )
    } else window.alert('Token purchase unsuccessful - please try later!')
    this.isAttemptingToPurchaseTokens = false
    await this.ngOnInit()
  }

  async attemptTokenRedemption() {
    this.isAttemptingTokenRedemption = true
    const { ethereum } = window

    const ifRedemptionSuccess = await this.contractsService.redeemTokensToETH(
      ethereum,
    )
    if (ifRedemptionSuccess) {
      window.alert('Redemption was successful!')
      await this.ngOnInit()
    }
    this.isAttemptingTokenRedemption = false
  }

  async attemptPlacingBets() {
    this.isPlacingBet = true
    const { ethereum } = window

    const isPlacingBetSuccess = await this.contractsService.placeBets(ethereum)

    if (isPlacingBetSuccess) {
      window.alert('Placed bet successfully!')
      await this.ngOnInit()
    }
    this.isPlacingBet = false
  }

  async attemptWinningClaim() {
    const { ethereum } = window
    this.isClaimingWinning = true

    const isWinningClaimSuccess = await this.contractsService.claimWinning(
      ethereum,
    )

    if (isWinningClaimSuccess) {
      window.alert('Claimed winning successfully!')
      location.reload()
    }

    this.isClaimingWinning = false
  }
}
