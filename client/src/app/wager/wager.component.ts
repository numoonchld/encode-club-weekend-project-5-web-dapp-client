import { Component, OnInit } from '@angular/core'
import { ContractsService } from '../contracts.service'
import { FormBuilder, Validators } from '@angular/forms'
import { ethers } from 'ethers'

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
  }

  async ngOnInit(): Promise<void> {
    this.isBettingWindowOpen = await this.contractsService.isBettingWindowOpen()

    const { ethereum } = window
    const lotteryTokenBalance = await this.contractsService.getLotteryTokenBalance(
      ethereum,
    )

    this.currentLotteryTokenBalanceForCurrentWallet = ethers.utils.formatEther(
      lotteryTokenBalance!.toString(),
    )

    this.currentWalletBalance = ethers.utils.formatEther(
      (await this.contractsService.getWalletBalance(ethereum)).toString(),
    )

    this.isLoadingBalance = false
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
      await this.ngOnInit()
    } else window.alert('Token purchase unsuccessful - please try later!')
    this.isAttemptingToPurchaseTokens = false
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
}
